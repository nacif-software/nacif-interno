import { Button } from '@/ui';

export function BatchBar({
  count,
  onApprove,
  onClear,
  loading,
}: {
  count: number;
  onApprove: () => void;
  onClear: () => void;
  loading: boolean;
}) {
  if (count === 0) return null;
  return (
    <div
      className="hidden items-center justify-between gap-4 rounded-control border border-brand bg-brand-wash px-[18px] py-3 md:flex"
      role="region"
      aria-label="Seleção em lote"
    >
      <span className="text-[14px] font-semibold text-ink">
        {count} {count === 1 ? 'selecionada' : 'selecionadas'}
      </span>
      <div className="flex gap-3">
        <Button
          variant="accent"
          size="sm"
          className="px-4 py-[9px]"
          loading={loading}
          onClick={onApprove}
        >
          Aprovar em lote
        </Button>
        <Button
          variant="outline-dark"
          size="sm"
          className="px-4 py-[9px]"
          disabled={loading}
          onClick={onClear}
        >
          Limpar seleção
        </Button>
      </div>
    </div>
  );
}
