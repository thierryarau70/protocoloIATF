import { mkdirSync } from 'node:fs'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from '../database/schema'

export const tabelas = schema

type Db = ReturnType<typeof drizzlePg<typeof schema>>

let conexao: Promise<Db> | undefined

export function useDb(): Promise<Db> {
  conexao ??= conectar()
  return conexao
}

/**
 * Com DATABASE_URL (Neon), conecta no Postgres. Sem ela, usa PGlite em .data/
 * e aplica as migrações ao abrir (só para desenvolvimento e testes).
 */
async function conectar(): Promise<Db> {
  const url = process.env.DATABASE_URL
  if (url) return drizzlePg(new pg.Pool({ connectionString: url, max: 3 }), { schema })

  const dir = process.env.PGLITE_DIR ?? '.data/pglite'
  if (dir !== 'memory://') mkdirSync(dir, { recursive: true })
  const [{ PGlite }, { drizzle: drizzlePglite }, { migrate }] = await Promise.all([
    import('@electric-sql/pglite'),
    import('drizzle-orm/pglite'),
    import('drizzle-orm/pglite/migrator'),
  ])
  const db = drizzlePglite(new PGlite(dir), { schema })
  await migrate(db, { migrationsFolder: 'server/database/migrations' })
  return db as unknown as Db
}
