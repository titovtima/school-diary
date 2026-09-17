// scripts/seed.mjs — учебный год 2026/2027
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'school_diary',
})

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randomGrade = () => {
  const r = Math.random()
  if (r < 0.55) return 5
  if (r < 0.85) return 4
  if (r < 0.97) return 3
  return 2
}

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`)

    console.log('ℹ️  Используйте db/seed.sql для полной перезаливки под 2026/2027')
    console.log('   (этот .mjs оставлен как резервный вариант)')

    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('❌', e)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
