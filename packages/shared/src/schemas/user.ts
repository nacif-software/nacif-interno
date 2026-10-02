import { z } from 'zod';
import { roleSchema } from '../enums/role';
import { nacifEmailSchema } from './auth';
import { projectRefSchema } from './common';

export const userDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  initials: z.string(),
  email: z.string(),
  role: roleSchema,
  active: z.boolean(),
  invitePending: z.boolean(),
  project: projectRefSchema.nullable(),
  createdAt: z.string(),
});
export type UserDto = z.infer<typeof userDtoSchema>;

export const userOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: roleSchema,
  projectName: z.string().nullable(),
});
export type UserOption = z.infer<typeof userOptionSchema>;

export const userOptionsQuerySchema = z.object({
  purpose: z.enum(['cover', 'approver']),
});
export type UserOptionsQuery = z.infer<typeof userOptionsQuerySchema>;

export const usersListQuerySchema = z.object({
  role: roleSchema.optional(),
  active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});
export type UsersListQuery = z.infer<typeof usersListQuerySchema>;

export const inviteBodySchema = z.object({
  email: nacifEmailSchema,
  name: z.string().trim().min(2).max(120).optional(),
  role: roleSchema.optional(),
  projectId: z.string().nullable().optional(),
});
export type InviteBody = z.infer<typeof inviteBodySchema>;

export const inviteResultSchema = z.object({
  user: userDtoSchema,
  setupLink: z.string(),
});
export type InviteResult = z.infer<typeof inviteResultSchema>;

export const updateUserBodySchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    role: roleSchema,
    active: z.boolean(),
    projectId: z.string().nullable(),
  })
  .partial();
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
