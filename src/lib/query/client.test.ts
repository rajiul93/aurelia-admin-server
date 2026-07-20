import { beforeEach, describe, expect, it, vi } from "vitest";

const success = vi.fn();
const error = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => success(...args),
    error: (...args: unknown[]) => error(...args),
  },
}));

const { createQueryClient } = await import("./client");

function runMutation(
  client: ReturnType<typeof createQueryClient>,
  options: Record<string, unknown>,
) {
  const mutation = client
    .getMutationCache()
    .build(client, options as never);

  return mutation.execute(undefined as never);
}

beforeEach(() => {
  success.mockReset();
  error.mockReset();
});

describe("mutation success feedback", () => {
  it("toasts the meta message when one is declared", async () => {
    const client = createQueryClient();

    await runMutation(client, {
      mutationFn: async () => "ok",
      meta: { successMessage: "Tour deleted" },
    });

    expect(success).toHaveBeenCalledWith("Tour deleted");
  });

  it("stays quiet when no message is declared", async () => {
    // The release-config panel autosaves on every field blur, so it opts out.
    const client = createQueryClient();

    await runMutation(client, { mutationFn: async () => "ok" });

    expect(success).not.toHaveBeenCalled();
  });
});

describe("mutation error feedback", () => {
  it("surfaces the API's own message, not the axios status text", async () => {
    const client = createQueryClient();

    await expect(
      runMutation(client, {
        mutationFn: async () => {
          throw {
            response: {
              data: { error: { message: "Plan is in use by a purchase" } },
            },
          };
        },
      }),
    ).rejects.toBeDefined();

    expect(error).toHaveBeenCalledWith("Plan is in use by a purchase");
  });

  it("toasts an unhandled failure that no call site catches", async () => {
    // The regression this guards: `await deleteX.mutateAsync(id)` with no
    // try/catch and no onError used to show the user nothing at all.
    const client = createQueryClient();

    await expect(
      runMutation(client, {
        mutationFn: async () => {
          throw new Error("boom");
        },
      }),
    ).rejects.toBeDefined();

    expect(error).toHaveBeenCalledTimes(1);
  });

  it("defers to a mutation that renders the error itself", async () => {
    const client = createQueryClient();

    await expect(
      runMutation(client, {
        mutationFn: async () => {
          throw new Error("boom");
        },
        onError: () => {},
      }),
    ).rejects.toBeDefined();

    expect(error).not.toHaveBeenCalled();
  });
});
