import { MESSAGES, ROLE_LABEL, ROLES, type ProjectDto, type UserDto } from '@nacif/shared';
import { cn } from '@/lib/cn';
import { RoleChip, Select, Toggle, useToast } from '@/ui';
import { useCurrentUser } from '../../controllers/use-session';
import { useResendInvite, useResetPassword, useUpdateUser } from '../../controllers/use-users';
import type { SetupLink } from './setup-link-modal';

const GRID = 'md:grid-cols-[1.6fr_1.4fr_1fr_1fr_120px]';
const LINK_ACTION = 'w-fit text-[13px] text-brand hover:text-ink cursor-pointer';

export function PeopleTable({
  users,
  projects,
  onSetupLink,
}: {
  users: UserDto[];
  projects: ProjectDto[];
  onSetupLink: (setup: SetupLink) => void;
}) {
  const me = useCurrentUser();
  const update = useUpdateUser();
  const resend = useResendInvite();
  const resetPassword = useResetPassword();
  const toast = useToast();

  const patch = (
    id: string,
    body: Parameters<typeof update.mutate>[0] extends infer T ? Omit<T, 'id'> : never,
  ) => update.mutate({ id, ...body }, { onError: (e) => toast.error(e.message) });

  return (
    <div>
      <div
        className={cn(
          'hidden h-[46px] items-center gap-4 border-b border-line bg-canvas px-[22px] md:grid',
          GRID,
        )}
      >
        {['Pessoa', 'E-mail', 'Papel', 'Projeto'].map((h) => (
          <span key={h} className="text-eyebrow">
            {h}
          </span>
        ))}
        <span className="text-eyebrow text-right">Ativo</span>
      </div>
      <ul>
        {users.map((u) => {
          const isMe = u.id === me.id;
          return (
            <li
              key={u.id}
              className={cn(
                'grid grid-cols-1 gap-3 border-b border-line px-[22px] py-4 last:border-b-0 md:min-h-16 md:grid-cols-[1.6fr_1.4fr_1fr_1fr_120px] md:items-center md:gap-4 md:py-0',
                !u.active && 'opacity-70',
              )}
            >
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-ink">{u.name}</span>
                {u.invitePending && (
                  <button
                    type="button"
                    className={LINK_ACTION}
                    onClick={() =>
                      resend.mutate(u.id, {
                        onSuccess: (r) =>
                          onSetupLink({ link: r.setupLink, email: u.email, mode: 'invite' }),
                        onError: (e) => toast.error(e.message),
                      })
                    }
                  >
                    Convite pendente · gerar novo link
                  </button>
                )}
                {!u.invitePending && u.active && (
                  <button
                    type="button"
                    className={LINK_ACTION}
                    aria-label={`${MESSAGES.resetPasswordAction} de ${u.name}`}
                    onClick={() =>
                      resetPassword.mutate(u.id, {
                        onSuccess: (r) =>
                          onSetupLink({ link: r.setupLink, email: u.email, mode: 'reset' }),
                        onError: (e) => toast.error(e.message),
                      })
                    }
                  >
                    {MESSAGES.resetPasswordAction}
                  </button>
                )}
              </div>
              <span className="truncate font-mono text-[14px] text-ink-muted">{u.email}</span>
              <div>
                {isMe ? (
                  <RoleChip role={u.role} size="md" />
                ) : (
                  <Select
                    aria-label={`Papel de ${u.name}`}
                    value={u.role}
                    onChange={(e) => patch(u.id, { role: e.target.value as UserDto['role'] })}
                    className="py-[7px] text-[13px] font-semibold"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
              <Select
                aria-label={`Projeto de ${u.name}`}
                value={u.project?.id ?? ''}
                onChange={(e) => patch(u.id, { projectId: e.target.value || null })}
                className="py-[7px] text-[13px]"
              >
                <option value="">Sem projeto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <div className="flex md:justify-end">
                <Toggle
                  checked={u.active}
                  disabled={isMe || update.isPending}
                  label={`${u.active ? 'Desativar' : 'Ativar'} ${u.name}`}
                  onChange={(next) => patch(u.id, { active: next })}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
