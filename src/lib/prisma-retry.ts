/**
 * Resilience helpers for serverless Postgres (Neon) cold starts.
 *
 * Neon computes scale to zero after inactivity. The first query after a
 * suspension can fail while Neon's control plane wakes the compute, surfacing
 * as a Prisma `DriverAdapterError` whose cause carries Postgres code `XX000`
 * ("Control plane request failed") or a connection timeout. These are transient
 * — an immediate retry almost always succeeds — so they should be retried
 * rather than bubbled up as a 500.
 */

// Postgres/driver codes that indicate a transient connectivity problem.
const TRANSIENT_CODES = new Set([
  "XX000", // Neon: "Control plane request failed"
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "08000", // connection_exception
  "08001", // sqlclient_unable_to_establish_sqlconnection
  "08004", // sqlserver_rejected_establishment_of_sqlconnection
  "08006", // connection_failure
  "57P01", // admin_shutdown
  "57P03", // cannot_connect_now (server starting up)
  "P1001", // Prisma: can't reach database server
  "P1002", // Prisma: database server reached but timed out
  "P1008", // Prisma: operation timed out
  "P1017", // Prisma: server closed the connection
]);

const TRANSIENT_MESSAGE_FRAGMENTS = [
  "control plane request failed",
  "timeout expired",
  "connection timeout",
  "connection terminated",
  "connection closed",
  "can't reach database server",
  "server has closed the connection",
];

/**
 * Walks an error and its `cause` chain looking for a transient connectivity
 * signature (Neon cold start, dropped/refused connection, connect timeout).
 */
export function isTransientDbError(err: unknown, depth = 0): boolean {
  if (!err || typeof err !== "object" || depth > 5) {
    return false;
  }

  const candidate = err as {
    code?: unknown;
    originalCode?: unknown;
    message?: unknown;
    cause?: unknown;
  };

  const code = candidate.code ?? candidate.originalCode;
  if (typeof code === "string" && TRANSIENT_CODES.has(code)) {
    return true;
  }

  if (typeof candidate.message === "string") {
    const message = candidate.message.toLowerCase();
    if (TRANSIENT_MESSAGE_FRAGMENTS.some((fragment) => message.includes(fragment))) {
      return true;
    }
  }

  return isTransientDbError(candidate.cause, depth + 1);
}

type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
};

/**
 * Runs an idempotent database operation, retrying transient cold-start/
 * connectivity failures with exponential backoff + jitter. Only retry
 * operations that are safe to run more than once (reads, upserts keyed by id).
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  { retries = 3, baseDelayMs = 150 }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !isTransientDbError(error)) {
        throw error;
      }

      const backoff = baseDelayMs * 2 ** attempt + Math.random() * 100;
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  throw lastError;
}
