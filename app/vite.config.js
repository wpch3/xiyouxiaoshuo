import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// build 产物（pywebview 通过 file:// 打开 dist）使用相对路径 './'；开发服务器使用 '/'
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true
  }
}));
