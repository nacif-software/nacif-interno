import { formatProseRange, MESSAGES, type ConflictsResult } from '@nacif/shared';
import { Alert } from '@/ui';

export function ConflictAlert({ result }: { result: ConflictsResult | undefined }) {
  if (!result || result.conflicts.length === 0 || !result.projectName) return null;
  const first = result.conflicts[0]!;
  const range = formatProseRange(first.startDate, first.endDate);
  const others = result.conflicts.length - 1;
  return (
    <>
      <Alert
        variant="warning"
        title={MESSAGES.conflictTitle(result.projectName)}
        className="max-md:hidden"
      >
        {MESSAGES.conflictBody(first.name, range)}
        {others > 0 &&
          ` Outras ${others} pessoa${others > 1 ? 's' : ''} do projeto também ${others > 1 ? 'têm' : 'tem'} indisponibilidade aprovada no período.`}
      </Alert>
      <Alert variant="warning" compact className="md:hidden">
        <span className="font-semibold text-ink">
          {MESSAGES.conflictTitle(result.projectName)}.
        </span>{' '}
        {MESSAGES.conflictBodyShort(first.name, range)}
      </Alert>
    </>
  );
}
