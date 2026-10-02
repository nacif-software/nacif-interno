import type { CommunicationDetailDto } from '@nacif/shared';
import { Timeline } from '@/ui';
import { flowToTimeline } from '../../models';

export function FlowTimeline({ communication }: { communication: CommunicationDetailDto }) {
  return (
    <section
      className="flex flex-col gap-6 rounded-card border border-line bg-card p-7"
      aria-label="Fluxo"
    >
      <h2 className="text-[15px] font-semibold text-ink">Fluxo</h2>
      <Timeline steps={flowToTimeline(communication.flow, communication.status)} />
    </section>
  );
}
