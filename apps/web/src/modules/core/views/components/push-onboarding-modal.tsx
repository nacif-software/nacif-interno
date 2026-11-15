import { MESSAGES, ROLE_LABEL } from '@nacif/shared';
import { useState } from 'react';
import { Button, Modal, useToast } from '@/ui';
import { readPromptState, writePromptState } from '../../controllers/push';
import {
  PushBlockedError,
  useEnablePush,
  usePushConfig,
  usePushResync,
  usePushStatus,
} from '../../controllers/use-push';
import { useCurrentUser } from '../../controllers/use-session';

const SESSION_KEY = 'nacif.push.prompt.session';

/** Lista do que a pessoa recebe, pelo papel. Admin recebe como aprovador endereçado. */
export function pushEventsFor(role: 'MEMBER' | 'APPROVER' | 'ADMIN'): readonly string[] {
  return role === 'MEMBER'
    ? MESSAGES.pushEventsMember
    : [...MESSAGES.pushEventsApprover, ...MESSAGES.pushEventsMember];
}

/**
 * Pergunta uma vez por dispositivo se a pessoa quer os avisos push. `Agora não` não volta a
 * perguntar naquele navegador; a opção continua em Notificações. No iPhone/iPad fora da Tela de
 * Início, explica o passo a passo e não grava nada (volta quando abrir instalado).
 */
export function PushOnboardingModal() {
  const user = useCurrentUser();
  const config = usePushConfig();
  const { status } = usePushStatus();
  const enable = useEnablePush(user.id);
  const toast = useToast();
  usePushResync(config.data?.enabled ?? false);
  const [dismissed, setDismissed] = useState(() => readPromptState(user.id) !== null);
  const [hiddenThisSession, setHiddenThisSession] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === '1',
  );

  const open =
    !dismissed &&
    !hiddenThisSession &&
    config.data?.enabled === true &&
    (status === 'off' || status === 'needs-home-screen');
  if (!open) return null;

  const dismissForSession = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setHiddenThisSession(true);
  };
  const later = () => {
    writePromptState(user.id, 'dismissed');
    setDismissed(true);
  };
  const activate = () =>
    enable.mutate(undefined, {
      onSuccess: () => {
        toast.success(MESSAGES.pushEnabledToast);
        setDismissed(true);
      },
      onError: (err) => {
        toast.error(
          err instanceof PushBlockedError ? MESSAGES.pushStatusBlocked : MESSAGES.pushEnableError,
        );
        later();
      },
    });

  if (status === 'needs-home-screen') {
    return (
      <Modal
        open
        onClose={dismissForSession}
        title={MESSAGES.pushIosTitle}
        description={MESSAGES.pushIosSteps}
        footer={<Button onClick={dismissForSession}>{MESSAGES.pushPromptUnderstood}</Button>}
      />
    );
  }

  return (
    <Modal
      open
      onClose={later}
      title={MESSAGES.pushPromptTitle}
      description={MESSAGES.pushPromptIntro}
      footer={
        <>
          <Button variant="secondary" onClick={later} disabled={enable.isPending}>
            {MESSAGES.pushPromptLater}
          </Button>
          <Button onClick={activate} loading={enable.isPending}>
            {MESSAGES.pushPromptEnable}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-[15px] font-semibold text-ink">
          {MESSAGES.pushPromptRole(ROLE_LABEL[user.role])}
        </p>
        <ul className="flex list-disc flex-col gap-[6px] pl-5 text-[15px] leading-[1.5] text-ink">
          {pushEventsFor(user.role).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
