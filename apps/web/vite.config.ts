import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

const apiProxy = {
  '/api': {
    target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3000',
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
  // não durante o primeiro carregamento da página. Sem isso, um ambiente frio (primeiro
  // `make up`, CI) responde "504 Outdated Optimize Dep" e a página fica em branco.
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
  // `vite preview` serve o build de produção; usado pelo e2e no CI.
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
    proxy: apiProxy,
  },
});
