import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { allowedHosts: ['terminal.local'] },
  resolve:
    process.env.TECHSAVY_LOCAL_PREVIEW === '1'
      ? {
          alias: {
            '@appdeploy/client': new URL(
              './scripts/local-client.ts',
              import.meta.url,
            ).pathname,
          },
        }
      : undefined,
  base: './',
  build: {
    outDir: process.env.APPDEPLOY_VITE_OUT_DIR || 'dist',
    sourcemap:
      process.env.APPDEPLOY_VITE_SOURCEMAP === 'hidden' ? 'hidden' : false,
    rollupOptions: {
      maxParallelFileOps: 128,
    },
  },
});
