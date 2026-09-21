import { defineConfig } from 'vite';

export default defineConfig({
  root: 'demo',
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: 'demo.js', inlineDynamicImports: true, assetFileNames: 'demo.[ext]' } },
  },
  server: {
    proxy: { '/api': `http://localhost:${process.env.JEV_PROXY_PORT ?? 8787}` },
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
    root: '.',
  },
});
