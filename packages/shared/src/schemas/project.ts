import { z } from 'zod';
import { personRefSchema } from './common';

export const projectDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  active: z.boolean(),
  defaultApprover: personRefSchema.nullable(),
  memberCount: z.number().int(),
});
export type ProjectDto = z.infer<typeof projectDtoSchema>;

export const createProjectBodySchema = z.object({
  name: z.string().trim().min(2, { error: 'Informe o nome do projeto.' }).max(80),
  defaultApproverId: z.string().nullable().optional(),
});
export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;

export const updateProjectBodySchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    active: z.boolean(),
    defaultApproverId: z.string().nullable(),
  })
  .partial();
export type UpdateProjectBody = z.infer<typeof updateProjectBodySchema>;
