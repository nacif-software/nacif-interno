import { vi } from 'vitest';

type Handler = (url: URL, init?: RequestInit) => { status?: number; body?: unknown } | undefined;

/** Substitui fetch por um roteador simples de respostas JSON. */
export function mockApi(handler: Handler) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
      'http://localhost',
    );
    const res = handler(url, init) ?? {
      status: 404,
      body: { error: { code: 'NOT_FOUND', message: 'não mockado' } },
    };
    const status = res.status ?? 200;
    return Promise.resolve(
      new Response(status === 204 ? null : JSON.stringify(res.body ?? null), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    );
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
