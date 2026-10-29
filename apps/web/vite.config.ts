import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

// Em dev o Vite serve o web e repassa /api para o Worker local (`wrangler dev`, porta 8787).
const apiProxy = {
  '/api': {
    target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8787',
    changeOrigin: false,
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Lista explícita + warmup: as dependências são pré-otimizadas na subida do servidor,
  // não durante o primeiro carregamento da página. Sem isso, um ambiente frio responde
  // "504 Outdated Optimize Dep" e a página fica em branco.
  optimizeDeps: {
    include: [
      'react',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom',
      'react-dom/client',
      'react-router',
      '@tanstack/react-query',
      'zustand',
      'react-hook-form',
      '@hookform/resolvers/zod',
      'zod',
      'clsx',
      'tailwind-merge',
    ],
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: apiProxy,
    warmup: { clientFiles: ['./src/main.tsx'] },
  },
  // `vite preview` serve só o build estático; em produção e no e2e quem serve é o Worker.
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
    proxy: apiProxy,
  },
});
