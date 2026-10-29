import { defineConfig } from 'drizzle-kit';

// Só gera migrações SQL (`pnpm migrate:new`); aplicar é com `wrangler d1 migrations apply`.
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
