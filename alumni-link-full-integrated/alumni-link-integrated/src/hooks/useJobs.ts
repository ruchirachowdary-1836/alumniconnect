import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi } from "@/integrations/api/client";

export function useJobs() {
  return useQuery({ queryKey: ["jobs"], queryFn: () => jobsApi.getAll() });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (job: {
      title: string; company: string; location: string; type: string;
      description?: string; requirements?: string[];
    }) => jobsApi.create(job),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}
