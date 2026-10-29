/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApp } from '../app';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface TestResponse {
  status: number;
  /** JSON já decodificado (ou texto cru quando a resposta não é JSON). */
  body: any;
  /** Cabeçalhos em minúsculas; `set-cookie` vem como lista. */
  headers: Record<string, any> & { 'set-cookie'?: string[] };
}

/** Guarda os cookies entre requisições, como o `supertest.agent`. */
class CookieJar {
  private readonly cookies = new Map<string, string>();

  store(setCookies: string[]): void {
    for (const header of setCookies) {
      const [pair = '', ...attrs] = header.split(';');
      const eq = pair.indexOf('=');
      if (eq < 0) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      const expired = attrs.some((a) => /^\s*max-age=0\s*$/i.test(a));
      if (value === '' || expired) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  header(): string | null {
    if (this.cookies.size === 0) return null;
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

/** Requisição encadeável no estilo do supertest: `.send(body)`, `.query(obj)`, `await`. */
class RequestBuilder implements PromiseLike<TestResponse> {
  private payload: unknown;
  private readonly params = new URLSearchParams();

  constructor(
    private readonly app: ReturnType<typeof createApp>,
    private readonly jar: CookieJar,
    private readonly method: Method,
    private readonly path: string,
  ) {}

  send(body: unknown): this {
    this.payload = body;
    return this;
  }

  query(values: Record<string, string | number | boolean>): this {
    for (const [key, value] of Object.entries(values)) this.params.set(key, String(value));
    return this;
  }

  then<R1 = TestResponse, R2 = never>(
    onFulfilled?: ((value: TestResponse) => R1 | PromiseLike<R1>) | null,
    onRejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.execute().then(onFulfilled, onRejected);
  }

  private async execute(): Promise<TestResponse> {
    const url = new URL(this.path, 'http://localhost');
    for (const [key, value] of this.params) url.searchParams.set(key, value);

    const headers = new Headers();
    const cookie = this.jar.header();
    if (cookie) headers.set('cookie', cookie);
    let body: string | undefined;
    if (this.payload !== undefined) {
      headers.set('content-type', 'application/json');
      // string vai crua (como no supertest), para testar JSON malformado
      body = typeof this.payload === 'string' ? this.payload : JSON.stringify(this.payload);
    }

    const res = await this.app.request(url.toString(), { method: this.method, headers, body });
    const setCookies = res.headers.getSetCookie();
    this.jar.store(setCookies);

    const text = await res.text();
    let parsed: unknown;
    if (text !== '') {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    const responseHeaders: TestResponse['headers'] = {};
    res.headers.forEach((value, key) => {
      responseHeaders[key.toLowerCase()] = value;
    });
    if (setCookies.length > 0) responseHeaders['set-cookie'] = setCookies;

    return { status: res.status, body: parsed, headers: responseHeaders };
  }
}

export function buildTestApp() {
  const app = createApp();
  const jar = new CookieJar();
  const request = (method: Method) => (path: string) => new RequestBuilder(app, jar, method, path);
  return {
    get: request('GET'),
    post: request('POST'),
    patch: request('PATCH'),
    put: request('PUT'),
    delete: request('DELETE'),
  };
}

export type TestAgent = ReturnType<typeof buildTestApp>;
