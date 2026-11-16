import {
  createCommunicationBodySchema,
  type CreateCommunicationBody,
  type CreateCommunicationInput,
} from '@nacif/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

export type CommunicationFormValues = CreateCommunicationInput;

export function useCommunicationForm(defaults: Partial<CommunicationFormValues> = {}) {
  // Entrada (cobertura '' permitida) e saída (cobertura null) do mesmo schema do shared.
  return useForm<CommunicationFormValues, unknown, CreateCommunicationBody>({
    resolver: zodResolver(createCommunicationBodySchema),
    defaultValues: {
      startDate: '',
      endDate: '',
      coverId: '',
      approverId: '',
      notes: '',
      ...defaults,
    },
    mode: 'onSubmit',
  });
}
