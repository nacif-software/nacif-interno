import { z } from 'zod';

export const ROLES = ['MEMBER', 'APPROVER', 'ADMIN'] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

export const APPROVER_ROLES: readonly Role[] = ['APPROVER', 'ADMIN'];

export function isApproverRole(role: Role): boolean {
  return APPROVER_ROLES.includes(role);
}
