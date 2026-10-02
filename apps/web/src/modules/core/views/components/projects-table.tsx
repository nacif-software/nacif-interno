import {
  createProjectBodySchema,
  type CreateProjectBody,
  type ProjectDto,
  type UserOption,
} from '@nacif/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button, Input, Select, Toggle, useToast } from '@/ui';
import { useCreateProject, useUpdateProject } from '../../controllers/use-projects';

export function ProjectsTable({
  projects,
  approvers,
}: {
  projects: ProjectDto[];
  approvers: UserOption[];
}) {
  const update = useUpdateProject();
  const create = useCreateProject();
  const toast = useToast();
  const form = useForm<CreateProjectBody>({
    resolver: zodResolver(createProjectBodySchema),
    defaultValues: { name: '' },
  });

  const onCreate = form.handleSubmit((values) => {
    create.mutate(values, {
      onSuccess: () => form.reset({ name: '' }),
      onError: (e) => toast.error(e.message),
    });
  });

  return (
    <div>
      <div className="hidden h-[46px] grid-cols-[1.4fr_1.4fr_100px_100px] items-center gap-4 border-b border-line bg-canvas px-[22px] md:grid">
        <span className="text-eyebrow">Projeto</span>
        <span className="text-eyebrow">Aprovador padrão</span>
        <span className="text-eyebrow">Pessoas</span>
        <span className="text-eyebrow text-right">Ativo</span>
      </div>
      <ul>
        {projects.map((p) => (
          <li
            key={p.id}
            className="grid grid-cols-1 gap-3 border-b border-line px-[22px] py-4 md:min-h-16 md:grid-cols-[1.4fr_1.4fr_100px_100px] md:items-center md:gap-4 md:py-0"
          >
            <span className="text-[15px] font-semibold text-ink">{p.name}</span>
            <Select
              aria-label={`Aprovador padrão de ${p.name}`}
              value={p.defaultApprover?.id ?? ''}
              onChange={(e) =>
                update.mutate(
                  { id: p.id, defaultApproverId: e.target.value || null },
                  { onError: (err) => toast.error(err.message) },
                )
              }
              className="py-[7px] text-[13px]"
            >
              <option value="">Nenhum</option>
              {approvers.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
            <span className="font-mono text-[14px] text-ink-muted">{p.memberCount}</span>
            <div className="flex md:justify-end">
              <Toggle
                checked={p.active}
                label={`${p.active ? 'Desativar' : 'Ativar'} ${p.name}`}
                onChange={(next) =>
                  update.mutate(
                    { id: p.id, active: next },
                    { onError: (err) => toast.error(err.message) },
                  )
                }
              />
            </div>
          </li>
        ))}
      </ul>
      <form
        onSubmit={onCreate}
        className="flex flex-col gap-2 bg-canvas px-[22px] py-[18px]"
        noValidate
      >
        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            {...form.register('name')}
            placeholder="Nome do projeto"
            aria-label="Nome do projeto"
            aria-invalid={form.formState.errors.name ? true : undefined}
            className="py-[11px] text-[15px]"
          />
          <Button
            type="submit"
            size="sm"
            loading={create.isPending}
            className="px-[18px] py-3 text-[14px]"
          >
            Criar projeto
          </Button>
        </div>
        {form.formState.errors.name && (
          <p className="text-[13px] text-danger">{form.formState.errors.name.message}</p>
        )}
      </form>
    </div>
  );
}
