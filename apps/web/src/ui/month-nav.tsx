export function MonthNav({
  onPrev,
  onNext,
  prevLabel = 'Mês anterior',
  nextLabel = 'Próximo mês',
}: {
  onPrev: () => void;
  onNext: () => void;
  prevLabel?: string;
  nextLabel?: string;
}) {
  const cls =
    'flex size-8 items-center justify-center rounded-badge border border-line bg-white text-[14px] font-medium text-ink-muted hover:bg-canvas cursor-pointer';
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={cls} onClick={onPrev} aria-label={prevLabel}>
        ‹
      </button>
      <button type="button" className={cls} onClick={onNext} aria-label={nextLabel}>
        ›
      </button>
    </div>
  );
}
