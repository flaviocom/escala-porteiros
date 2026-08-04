/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ `base` NÃO é detalhe: o GitHub Pages serve este projeto sob /escala-porteiros/.
// Sem isto, todo caminho de asset funciona no localhost e quebra no ar.
export default defineConfig({
  base: '/escala-porteiros/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    sourcemap: false,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
