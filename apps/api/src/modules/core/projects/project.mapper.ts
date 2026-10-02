import type { ProjectDto } from '@nacif/shared';
import type { Project, User } from '../../../generated/prisma/client';

type ProjectRow = Project & { defaultApprover: User | null; _count: { members: number } };

export function toProjectDto(p: ProjectRow): ProjectDto {
  return {
    id: p.id,
    name: p.name,
    active: p.active,
    defaultApprover: p.defaultApprover
      ? { id: p.defaultApprover.id, name: p.defaultApprover.name }
      : null,
    memberCount: p._count.members,
  };
}
