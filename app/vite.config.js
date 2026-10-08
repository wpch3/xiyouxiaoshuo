import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    // The browser calls same-origin /api routes only. Local model APIs and
    // provider credentials are handled by the Python gateway behind this proxy.
    proxy: {
      '/api': {
        target: process.env.PET_API_TARGET || 'http://127.0.0.1:8765',
        changeOrigin: true,
      },
    },
  },
});
