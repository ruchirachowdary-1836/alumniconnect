import { useQuery } from "@tanstack/react-query";
import { profilesApi } from "@/integrations/api/client";

export function useAlumniProfiles() {
  return useQuery({ queryKey: ["alumni-profiles"], queryFn: () => profilesApi.getAlumni() });
}

export function useAllProfiles() {
  return useQuery({ queryKey: ["all-profiles"], queryFn: () => profilesApi.getAll() });
}
