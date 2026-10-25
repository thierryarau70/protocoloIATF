// Aplica as migrações (mesma tabela drizzle.__drizzle_migrations do drizzle-kit),
// mas mostra o erro quando falha: o drizzle-kit migrate às vezes sai sem mensagem.
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL não está definida.')
  process.exit(1)
}

const ocultar = texto => String(texto).replace(/postgres(ql)?:\/\/\S+/g, '<DATABASE_URL>')
const pool = new pg.Pool({ connectionString: url, max: 1 })
try {
  await migrate(drizzle(pool), { migrationsFolder: 'server/database/migrations' })
  console.log('Migrações aplicadas.')
}
catch (e) {
  console.error(`Falha ao migrar: ${e.code ?? ''} ${ocultar(e.message)}`)
  if (e.cause) console.error(`Causa: ${e.cause.code ?? ''} ${ocultar(e.cause.message)}`)
  process.exitCode = 1
}
finally {
  await pool.end()
}
