import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { usersService } from "@/services/users.service";
import type { ListParams } from "@/types/api";

export function useUsers(params?: ListParams & { role?: string }) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => usersService.list(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => usersService.getById(id),
    enabled: Boolean(id),
  });
}
