import type { PushConfig } from '@nacif/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';
import {
  getCurrentSubscription,
  isPushSupported,
  needsHomeScreen,
  subscriptionBody,
  urlBase64ToUint8Array,
  writePromptState,
} from './push';

export type PushDeviceStatus =
  'unsupported' | 'unconfigured' | 'needs-home-screen' | 'blocked' | 'off' | 'on';

export function usePushConfig() {
  return useQuery({
    queryKey: qk.push.config,
    queryFn: () => apiFetch<PushConfig>('/push/config'),
    staleTime: Infinity,
  });
}

async function deviceStatus(config: PushConfig | undefined): Promise<PushDeviceStatus> {
  if (!isPushSupported()) return 'unsupported';
  if (!config?.enabled) return 'unconfigured';
  if (needsHomeScreen()) return 'needs-home-screen';
  if (Notification.permission === 'denied') return 'blocked';
  const sub = await getCurrentSubscription();
  return sub ? 'on' : 'off';
}

/** Estado do push neste navegador (permissão + assinatura), dado o config do servidor. */
export function usePushStatus() {
  const config = usePushConfig();
  const query = useQuery({
    queryKey: [...qk.push.device, config.data?.enabled ?? null],
    queryFn: () => deviceStatus(config.data),
    enabled: config.isSuccess,
    staleTime: Infinity,
  });
  return { status: query.data, isLoading: config.isPending || query.isPending };
}

export class PushBlockedError extends Error {}

export function useEnablePush(userId: string) {
  const qc = useQueryClient();
  const config = usePushConfig();
  return useMutation({
    mutationFn: async () => {
      const publicKey = config.data?.publicKey;
      if (!publicKey) throw new Error('Push não configurado');
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      // Precisa vir de um clique: os navegadores ignoram o pedido fora de um gesto do usuário.
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new PushBlockedError('Permissão negada');
      const ready = await navigator.serviceWorker.ready;
      const sub =
        (await ready.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));
      await apiFetch('/push/subscriptions', { method: 'POST', body: subscriptionBody(sub) });
      writePromptState(userId, 'enabled');
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.push.device }),
  });
}

export function useDisablePush() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const sub = await getCurrentSubscription();
      if (!sub) return;
      await apiFetch('/push/subscriptions', { method: 'DELETE', body: { endpoint: sub.endpoint } });
      await sub.unsubscribe();
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.push.device }),
  });
}

/**
 * Mantém a assinatura deste navegador registrada para a pessoa logada (upsert por endpoint):
 * cobre troca de conta no mesmo navegador e o iOS, que não dispara `pushsubscriptionchange`.
 */
export function usePushResync(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !isPushSupported() || Notification.permission !== 'granted') return;
    let cancelled = false;
    void getCurrentSubscription().then((sub) => {
      if (!sub || cancelled) return;
      void apiFetch('/push/subscriptions', { method: 'POST', body: subscriptionBody(sub) }).catch(
        () => undefined,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
