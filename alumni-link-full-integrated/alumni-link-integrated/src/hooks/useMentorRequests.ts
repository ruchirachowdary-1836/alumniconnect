import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mentorshipApi } from "@/integrations/api/client";
import { useAuth } from "@/contexts/AuthContext";

export function useMentorRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mentor-requests", user?.id],
    queryFn: () => mentorshipApi.getMyRequests(),
    enabled: !!user,
  });
}

export function useCreateMentorRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: { alumniId: string; message?: string }) =>
      mentorshipApi.create(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mentor-requests"] }),
  });
}

export function useUpdateMentorRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      mentorshipApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mentor-requests"] }),
  });
}
