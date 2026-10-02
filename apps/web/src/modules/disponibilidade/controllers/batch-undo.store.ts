import { create } from 'zustand';

interface BatchUndoState {
  pending: { batchId: string; count: number; expiresAt: number } | null;
  arm: (batchId: string, count: number, ttlMs: number) => void;
  disarm: () => void;
}

/** Guarda o último lote aprovado enquanto o toast com "Desfazer" está visível. */
export const useBatchUndo = create<BatchUndoState>((set) => ({
  pending: null,
  arm: (batchId, count, ttlMs) =>
    set({ pending: { batchId, count, expiresAt: Date.now() + ttlMs } }),
  disarm: () => set({ pending: null }),
}));
