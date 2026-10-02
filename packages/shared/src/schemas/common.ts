import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().min(1) });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  });
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'DOMAIN_NOT_ALLOWED',
  'INVALID_CREDENTIALS',
  'USER_INACTIVE',
  'NOT_FOUND',
  'INVALID_STATE',
  'UNDO_WINDOW_EXPIRED',
  'CONFLICT',
  'INTERNAL',
] as const;
export const apiErrorCodeSchema = z.enum(API_ERROR_CODES);
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

export const personRefSchema = z.object({ id: z.string(), name: z.string() });
export type PersonRef = z.infer<typeof personRefSchema>;

export const projectRefSchema = z.object({ id: z.string(), name: z.string() });
export type ProjectRef = z.infer<typeof projectRefSchema>;
