import { createCommunicationBodySchema, type CreateCommunicationBody } from '@nacif/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

export type CommunicationFormValues = CreateCommunicationBody;

export function useCommunicationForm(defaults: Partial<CommunicationFormValues> = {}) {
  return useForm<CommunicationFormValues>({
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
