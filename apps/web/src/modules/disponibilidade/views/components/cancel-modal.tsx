import { formatDateRange, MESSAGES, type CommunicationDetailDto } from '@nacif/shared';
import { Button, Modal } from '@/ui';

export function CancelModal({
  communication,
  open,
  onClose,
  onConfirm,
  loading,
}: {
  communication: CommunicationDetailDto;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cancelar comunicação"
      description={MESSAGES.cancelModalBody(
        formatDateRange(communication.startDate, communication.endDate),
      )}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Voltar
          </Button>
          <Button onClick={onConfirm} loading={loading} className="px-5 py-3">
            Cancelar comunicação
          </Button>
        </>
      }
    />
  );
}
