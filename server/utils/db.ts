import { Pool } from 'pg'

let pool: Pool | null = null

export function useDb(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'school_diary',
      max: 10,
    })
  }
  return pool
}

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const res = await useDb().query(text, params)
  return res.rows as T[]
}
