import { PRODUCT_NAME, type ServiceDescriptor } from '@nacif/shared';

export const disponibilidadeService: ServiceDescriptor = {
  slug: 'disponibilidade',
  name: PRODUCT_NAME,
  description: 'Comunicação de períodos de indisponibilidade e aprovação.',
  path: '/disponibilidade',
  status: 'available',
};
