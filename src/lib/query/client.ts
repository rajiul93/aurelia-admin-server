import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/error-message";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      /** Shown as a success toast when the mutation resolves. */
      successMessage?: string;
    };
  }
}

export function createQueryClient() {
  return new QueryClient({
    // Feedback lives here rather than in each of the 59 mutation hooks. Most
    // call sites did `await deleteX.mutateAsync(id)` with no try/catch and no
    // onError, so a failed delete surfaced as an unhandled rejection and the
    // user saw nothing at all. Handling both outcomes centrally also means a
    // mutation added later is covered by default instead of by remembering.
    mutationCache: new MutationCache({
      onSuccess: (_data, _variables, _context, mutation) => {
        const message = mutation.meta?.successMessage;

        if (message) {
          toast.success(message);
        }
      },
      onError: (error, _variables, _context, mutation) => {
        // Skip when the call site renders the error itself (forms show an
        // inline submitError alert), so the user is not told twice.
        if (mutation.options.onError) {
          return;
        }

        toast.error(getApiErrorMessage(error, "Something went wrong."));
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
