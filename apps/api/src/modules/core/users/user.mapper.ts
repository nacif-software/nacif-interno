import {
  getInitials,
  type ProjectRef,
  type SessionUser,
  type UserDto,
  type UserOption,
} from '@nacif/shared';
import type { UserWithProjects } from '../../../db/types';

/** Projetos da pessoa como referências, em ordem alfabética. */
export function projectRefs(user: Pick<UserWithProjects, 'projects'>): ProjectRef[] {
  return user.projects
    .map((p) => ({ id: p.project.id, name: p.project.name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function toSessionUser(user: UserWithProjects): SessionUser {
  return {
    id: user.id,
    name: user.name,
    initials: getInitials(user.name),
    email: user.email,
    role: user.role,
    active: user.active,
    projects: projectRefs(user),
  };
}

export function toUserDto(user: UserWithProjects): UserDto {
  return {
    ...toSessionUser(user),
    invitePending: user.passwordHash === null,
    creditBaseDate: user.creditBaseDate ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toUserOption(user: UserWithProjects): UserOption {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    projectNames: projectRefs(user).map((p) => p.name),
  };
}
