import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Mirror dist to dict so Netlify builds succeed whether publish directory
// is configured as 'dist' or accidentally typed as 'dict'.
function mirrorDistPlugin() {
  return {
    name: 'mirror-dist-to-dict',
    closeBundle() {
      try {
        const distPath = path.resolve('dist');
        const dictPath = path.resolve('dict');
        if (fs.existsSync(distPath)) {
          fs.cpSync(distPath, dictPath, { recursive: true, force: true });
        }
      } catch (err) {
        console.warn('Could not mirror dist to dict:', err);
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mirrorDistPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
