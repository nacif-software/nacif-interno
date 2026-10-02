import { ROLE_LABEL, STATUS_LABEL, type CommunicationStatus, type Role } from '@nacif/shared';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'warning' | 'success' | 'danger' | 'neutral' | 'brand' | 'ink';
export type BadgeSize = 'sm' | 'md' | 'lg';

const TONE: Record<BadgeTone, string> = {
  warning: 'bg-warning-bg text-warning',
  success: 'bg-success-bg text-success',
  danger: 'bg-danger-bg text-danger',
  neutral: 'bg-neutral-bg text-ink-muted',
  brand: 'bg-brand-wash text-brand',
  ink: 'bg-ink text-white',
};

const SIZE: Record<BadgeSize, string> = {
  sm: 'text-[11px] px-[9px] py-1',
  md: 'text-[12px] px-[11px] py-[5px] tracking-[.02em]',
  lg: 'text-[13px] px-[13px] py-[7px]',
};

export function Badge({
  tone,
  size = 'md',
  className,
  children,
}: {
  tone: BadgeTone;
  size?: BadgeSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-badge font-semibold leading-none whitespace-nowrap',
        TONE[tone],
        SIZE[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const STATUS_TONE: Record<CommunicationStatus, BadgeTone> = {
  IN_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

export function StatusBadge({ status, size }: { status: CommunicationStatus; size?: BadgeSize }) {
  return (
    <Badge tone={STATUS_TONE[status]} size={size}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

const ROLE_TONE: Record<Role, BadgeTone> = { MEMBER: 'brand', APPROVER: 'success', ADMIN: 'ink' };

export function RoleChip({ role, size = 'lg' }: { role: Role; size?: BadgeSize }) {
  return (
    <Badge tone={ROLE_TONE[role]} size={size}>
      {ROLE_LABEL[role]}
    </Badge>
  );
}
