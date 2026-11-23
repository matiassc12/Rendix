import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/cne-api': {
        target: 'https://api.cne.cl',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/cne-api/, '')
      }
    }
  }
});