import type { D1Migration } from 'cloudflare:test';

declare global {
  namespace Cloudflare {
    /** Binding só de teste, definido em `vitest.config.ts` (migrações lidas no Node). */
    interface Env {
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}
