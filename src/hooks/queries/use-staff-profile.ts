import { useQuery } from "@tanstack/react-query";
import { staffProfileService } from "@/services/staff-profile.service";
import { queryKeys } from "@/lib/query/keys";

export function useStaffProfile() {
  return useQuery({
    queryKey: queryKeys.staffProfile.me,
    queryFn: () => staffProfileService.getMe(),
  });
}
