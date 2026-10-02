import { formatSentOn, type CommunicationSummaryDto } from '@nacif/shared';
import { Link } from 'react-router';
import { StatusBadge } from '@/ui';
import { paths } from '../../manifest';
import { communicationSubtitle, communicationTitle } from '../../models';

export function CommunicationList({ items }: { items: CommunicationSummaryDto[] }) {
  return (
    <ul className="flex flex-col">
      {items.map((c) => (
        <li key={c.id} className="border-b border-line last:border-b-0">
          <Link
            to={paths.detail(c.code)}
            className="flex items-start justify-between gap-4 px-4 py-4 text-inherit hover:bg-canvas hover:text-inherit md:px-7 md:py-5"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="hidden text-[17px] font-semibold text-ink md:block">
                {communicationTitle(c)}
              </span>
              <span className="text-[15px] font-semibold text-ink md:hidden">
                {communicationTitle(c, false).split(' · ')[0]}
              </span>
              <span className="hidden text-[14px] text-ink-muted md:block">
                {communicationSubtitle(c)}
              </span>
              <span className="text-[13px] text-ink-muted md:hidden">
                {c.status === 'REJECTED' || c.status === 'CANCELLED'
                  ? communicationTitle(c, false).split(' · ')[1]
                  : `${communicationTitle(c, false).split(' · ')[1]} · cobertura ${c.cover.name}`}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-5">
              <StatusBadge status={c.status} size="md" />
              <span className="hidden font-mono text-[13px] text-ink-muted md:inline">
                {formatSentOn(c.submittedAt)}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
