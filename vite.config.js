import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas para que el build funcione en GitHub Pages
  // (que sirve el juego desde /<nombre-del-repo>/).
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
  },
});
