/*
  Nombre del archivo: vite.config.js
  Propósito: Proxy de desarrollo con imitación de cabeceras de navegador real
  para bypassear el firewall de CNE Bencina en Línea.
*/

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/cne-api': {
        target: 'https://www.bencinaenlinea.cl',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/cne-api/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
            proxyReq.setHeader('Accept', 'application/json, text/plain, */*');
            proxyReq.setHeader('Accept-Language', 'es-CL,es;q=0.9,en-US;q=0.8,en;q=0.7');
            proxyReq.setHeader('Referer', 'https://www.bencinaenlinea.cl/web2/');
            proxyReq.setHeader('Origin', 'https://www.bencinaenlinea.cl');
            proxyReq.setHeader('Sec-Fetch-Dest', 'empty');
            proxyReq.setHeader('Sec-Fetch-Mode', 'cors');
            proxyReq.setHeader('Sec-Fetch-Site', 'same-origin');
          });
        }
      }
    }
  }
});