import { getInitials, type SessionUser, type UserDto, type UserOption } from '@nacif/shared';
import type { Project, User } from '../../../generated/prisma/client';

type UserWithProject = User & { project: Project | null };

export function toSessionUser(user: UserWithProject): SessionUser {
  return {
    id: user.id,
    name: user.name,
    initials: getInitials(user.name),
    email: user.email,
    role: user.role,
    active: user.active,
    project: user.project ? { id: user.project.id, name: user.project.name } : null,
  };
}

export function toUserDto(user: UserWithProject): UserDto {
  return {
    ...toSessionUser(user),
    invitePending: user.passwordHash === null,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toUserOption(user: UserWithProject): UserOption {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    projectName: user.project?.name ?? null,
  };
}
