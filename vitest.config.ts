import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '#shared': fileURLToPath(new URL('./shared', import.meta.url)) } },
  // DATABASE_URL vazio: os testes nunca tocam no banco de produção, mesmo no build da Vercel
  // Cada arquivo abre seu banco em memória (PGlite); em paralelo isso pode levar vários segundos
  test: { include: ['tests/**/*.test.ts'], env: { PGLITE_DIR: 'memory://', DATABASE_URL: '' }, hookTimeout: 60_000, testTimeout: 30_000 },
})
