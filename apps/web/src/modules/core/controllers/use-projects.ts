import type { CreateProjectBody, ProjectDto, UpdateProjectBody } from '@nacif/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';

export function useProjects() {
  return useQuery({ queryKey: qk.projects, queryFn: () => apiFetch<ProjectDto[]>('/projects') });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProjectBody) =>
      apiFetch<ProjectDto>('/projects', { method: 'POST', body }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.projects }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateProjectBody & { id: string }) =>
      apiFetch<ProjectDto>(`/projects/${id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.projects });
      void qc.invalidateQueries({ queryKey: qk.users.all });
    },
  });
}
