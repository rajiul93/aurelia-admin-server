import type { ZodType } from "zod";
import { ValidationError } from "./errors";

function formatZodError(error: { issues: { message: string }[] }) {
  return error.issues.map((issue) => issue.message);
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    throw new ValidationError("Invalid JSON body");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError("Validation failed", formatZodError(result.error));
  }

  return result.data;
}

export function parseQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodType<T>,
): T {
  const result = schema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!result.success) {
    throw new ValidationError(
      "Invalid query parameters",
      formatZodError(result.error),
    );
  }

  return result.data;
}

export function parseParams<T>(
  params: Record<string, string | string[] | undefined>,
  schema: ZodType<T>,
): T {
  const normalized = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );

  const result = schema.safeParse(normalized);
  if (!result.success) {
    throw new ValidationError(
      "Invalid route parameters",
      formatZodError(result.error),
    );
  }

  return result.data;
}
