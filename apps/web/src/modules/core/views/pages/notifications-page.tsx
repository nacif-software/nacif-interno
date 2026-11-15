import { MESSAGES } from '@nacif/shared';
import { Card, CardHeader, SkeletonCard, Toggle, useToast } from '@/ui';
import {
  PushBlockedError,
  useDisablePush,
  useEnablePush,
  usePushStatus,
  type PushDeviceStatus,
} from '../../controllers/use-push';
import { useCurrentUser } from '../../controllers/use-session';
import { PageHeader } from '../layouts/page-header';
import { pushEventsFor } from '../components/push-onboarding-modal';

const STATUS_TEXT: Record<PushDeviceStatus, string> = {
  on: MESSAGES.pushStatusOn,
  off: MESSAGES.pushStatusOff,
  blocked: MESSAGES.pushStatusBlocked,
  unsupported: MESSAGES.pushStatusUnsupported,
  unconfigured: MESSAGES.pushStatusUnconfigured,
  'needs-home-screen': MESSAGES.pushStatusNeedsHomeScreen,
};

export function NotificationsPage() {
  const user = useCurrentUser();
  const { status, isLoading } = usePushStatus();
  const enable = useEnablePush(user.id);
  const disable = useDisablePush();
  const toast = useToast();
  const busy = enable.isPending || disable.isPending;
  const canToggle = status === 'on' || status === 'off';

  const onToggle = (next: boolean) => {
    if (next) {
      enable.mutate(undefined, {
        onSuccess: () => toast.success(MESSAGES.pushEnabledToast),
        onError: (err) =>
          toast.error(
            err instanceof PushBlockedError ? MESSAGES.pushStatusBlocked : MESSAGES.pushEnableError,
          ),
      });
    } else {
      disable.mutate(undefined, { onSuccess: () => toast.success(MESSAGES.pushDisabledToast) });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-5 md:gap-7">
      <PageHeader title={MESSAGES.notificationsTitle} subtitle={MESSAGES.notificationsSubtitle} />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1">
            <span className="text-[16px] font-semibold text-ink">{MESSAGES.pushDeviceLabel}</span>
            {isLoading || !status ? (
              <span className="text-[14px] text-ink-muted">…</span>
            ) : (
              <span className="text-[14px] text-ink-muted" data-testid="push-status">
                {STATUS_TEXT[status]}
              </span>
            )}
          </div>
          <Toggle
            label={MESSAGES.pushDeviceLabel}
            checked={status === 'on'}
            disabled={!canToggle || busy}
            onChange={onToggle}
          />
        </CardHeader>
        {status === 'needs-home-screen' && (
          <p className="px-7 py-5 text-[14px] leading-[1.5] text-ink-muted">
            {MESSAGES.pushIosSteps}
          </p>
        )}
      </Card>

      {isLoading ? (
        <SkeletonCard />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Card className="flex flex-col gap-3 px-7 py-6">
            <h2 className="text-[16px] font-semibold text-ink">{MESSAGES.pushEventsTitle}</h2>
            <ul className="flex list-disc flex-col gap-[6px] pl-5 text-[15px] leading-[1.5] text-ink">
              {pushEventsFor(user.role).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {user.role === 'ADMIN' && (
              <p className="text-[13px] text-ink-muted">{MESSAGES.pushEventsAdminNote}</p>
            )}
          </Card>
          <Card className="flex flex-col gap-3 px-7 py-6">
            <h2 className="text-[16px] font-semibold text-ink">{MESSAGES.pushWhereTitle}</h2>
            <ul className="flex list-disc flex-col gap-[6px] pl-5 text-[15px] leading-[1.5] text-ink">
              {MESSAGES.pushWhere.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
