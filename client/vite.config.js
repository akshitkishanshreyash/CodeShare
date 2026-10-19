import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API = process.env.VITE_DEV_API_TARGET || 'http://localhost:5000';

function quietAbortedSocket() {
  return {
    name: 'quiet-aborted-socket',
    configResolved(config) {
      const original = config.logger.error.bind(config.logger);
      config.logger.error = (msg, ...rest) => {
        if (
          typeof msg === 'string'
          && msg.includes('ws proxy socket error')
          && /\b(ECONNABORTED|ECONNRESET|EPIPE)\b/.test(msg)
        ) return;
        original(msg, ...rest);
      };
    },
  };
}

export default defineConfig({
  plugins: [react(), quietAbortedSocket()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API, changeOrigin: true, secure: false },
      '/socket.io': {
        target: API,
        ws: true,
        changeOrigin: true,
        secure: false,
        timeout: 120000,
        proxyTimeout: 120000,
        configure: (proxy, _options) => {
          proxy.on('error', (err) => {
            console.warn('[vite] ws proxy error:', err.code || err.message);
          });
        },
      },
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 4000, // Monaco is large by nature
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['monaco-editor'],
          yjs: ['yjs', 'y-monaco'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'socket.io-client'],
        },
      },
    },
  },
});
