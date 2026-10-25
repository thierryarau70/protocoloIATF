import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '#shared': fileURLToPath(new URL('./shared', import.meta.url)) } },
  // DATABASE_URL vazio: os testes nunca tocam no banco de produção, mesmo no build da Vercel
  test: { include: ['tests/**/*.test.ts'], env: { PGLITE_DIR: 'memory://', DATABASE_URL: '' } },
})
