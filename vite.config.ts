import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'zustand'],
          'vendor-chart': ['lightweight-charts'],
          'vendor-web3': ['viem', '@supabase/supabase-js'],
          'vendor-media': ['html-to-image', 'canvas-confetti'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
