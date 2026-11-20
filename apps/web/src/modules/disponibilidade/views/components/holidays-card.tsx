import {
  createHolidayBodySchema,
  formatDate,
  isoDateYear,
  MESSAGES,
  type CreateHolidayBody,
  type HolidayDto,
} from '@nacif/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button, Card, Field, Input, useToast } from '@/ui';
import { useCreateHoliday, useDeleteHoliday } from '../../controllers/use-holidays';

/** Calendário de feriados e recesso (Administração): lista por ano, adicionar e remover. */
export function HolidaysCard({ holidays }: { holidays: HolidayDto[] }) {
  const create = useCreateHoliday();
  const remove = useDeleteHoliday();
  const toast = useToast();
  const form = useForm<CreateHolidayBody>({
    resolver: zodResolver(createHolidayBodySchema),
    defaultValues: { date: '', name: '' },
  });
  const onSubmit = form.handleSubmit((values) => {
    create.mutate(values, {
      onSuccess: (h) => {
        toast.success(MESSAGES.holidayAddedToast(h.name));
        form.reset({ date: '', name: '' });
      },
      onError: (e) => toast.error(e.message),
    });
  });

  const years = [...new Set(holidays.map((h) => isoDateYear(h.date)))].sort((a, b) => b - a);

  return (
    <Card className="flex flex-col gap-5 p-7">
      <p className="text-[13px] text-ink-muted">{MESSAGES.holidaysHint}</p>
      {holidays.length === 0 ? (
        <p className="text-[15px] text-ink-muted">{MESSAGES.holidaysEmpty}</p>
      ) : (
        years.map((year) => (
          <div key={year} className="flex flex-col gap-2">
            <span className="text-eyebrow">{year}</span>
            <ul className="flex flex-col">
              {holidays
                .filter((h) => isoDateYear(h.date) === year)
                .map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-b-0"
                  >
                    <span className="flex flex-col">
                      <span className="text-[15px] font-semibold text-ink">{h.name}</span>
                      <span className="font-mono text-[13px] text-ink-muted">
                        {formatDate(h.date)}
                      </span>
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={remove.isPending && remove.variables?.id === h.id}
                      onClick={() =>
                        remove.mutate(h, {
                          onSuccess: () => toast.success(MESSAGES.holidayRemovedToast(h.name)),
                          onError: (e) => toast.error(e.message),
                        })
                      }
                    >
                      {MESSAGES.holidayRemove}
                    </Button>
                  </li>
                ))}
            </ul>
          </div>
        ))
      )}
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-4 border-t border-line pt-[22px]"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label={MESSAGES.holidayDateLabel} error={form.formState.errors.date?.message}>
            {(p) => <Input {...p} type="date" {...form.register('date')} />}
          </Field>
          <Field label={MESSAGES.holidayNameLabel} error={form.formState.errors.name?.message}>
            {(p) => <Input {...p} {...form.register('name')} />}
          </Field>
        </div>
        <Button type="submit" variant="secondary" loading={create.isPending} className="self-start">
          {MESSAGES.holidayAdd}
        </Button>
      </form>
    </Card>
  );
}
