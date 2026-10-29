import type { ProjectDto } from '@nacif/shared';
import type { ProjectRow } from '../../../db/types';

export function toProjectDto(p: ProjectRow): ProjectDto {
  return {
    id: p.id,
    name: p.name,
    active: p.active,
    defaultApprover: p.defaultApprover
      ? { id: p.defaultApprover.id, name: p.defaultApprover.name }
      : null,
    memberCount: p.memberCount,
  };
}
