import { z } from 'zod';

export const serviceStatusSchema = z.enum(['available', 'coming_soon']);
export type ServiceStatus = z.infer<typeof serviceStatusSchema>;

export const serviceDescriptorSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  path: z.string(),
  status: serviceStatusSchema,
});
export type ServiceDescriptor = z.infer<typeof serviceDescriptorSchema>;
