// ---------------------------------------------------------------------------
// db-init:
//   • Свежая установка → применяется sql/schema.sql.
//   • Существующая БД → применяются недостающие миграции из sql/migrations/.
//   • Флаг --force-schema: всегда применяет schema.sql.
//
// Запуск:  node scripts/db-init.mjs [--force-schema]
//
// Подключение:
//   DATABASE_URL=postgres://user:pass@host:port/db
//   или PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE
// ---------------------------------------------------------------------------

import 'dotenv/config'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const url = process.env.DATABASE_URL
  || `postgres://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'school_diary'}`

const forceSchema = process.argv.includes('--force-schema')

const CORE_TABLES = [
  'classes', 'students', 'subjects', 'subject_classes',
  'grade_types', 'schedule', 'grades', 'homework',
  'users', 'sessions', 'terms',
]

const CREATE_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name       TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`

const client = new pg.Client({ connectionString: url })
await client.connect()

try {
  console.log('→ Подключение к БД:', url.replace(/:[^:@]+@/, ':***@'))

  const who = await client.query('SELECT current_user, current_database()')
  console.log(`→ Пользователь: ${who.rows[0].current_user}, БД: ${who.rows[0].current_database}`)

  await client.query(CREATE_MIGRATIONS_TABLE)

  const { rows: presentRows } = await client.query(`
    SELECT table_name
      FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = ANY($1::text[])
  `, [CORE_TABLES])

  const present = new Set(presentRows.map(r => r.table_name))
  const missing = CORE_TABLES.filter(t => !present.has(t))
  const needsSchema = forceSchema || missing.length > 0

  if (needsSchema) {
    if (missing.length && !forceSchema) {
      console.log('→ Не хватает таблиц:', missing.join(', '))
    }
    console.log('→ Применяю sql/schema.sql')

    const sql = readFileSync(join(ROOT, 'sql', 'schema.sql'), 'utf8')

    try {
      await client.query(sql)
    } catch (e) {
      if (e.code === '42501') {
        console.error('\n❌ Недостаточно прав для применения схемы.')
        console.error('   Postgres вернул: ' + e.message)
        console.error('')
        console.error('   Варианты решения:')
        console.error('')
        console.error('   А) Запустить db-init от владельца таблиц:')
        console.error('      PGUSER=postgres PGPASSWORD=... node scripts/db-init.mjs --force-schema')
        console.error('')
        console.error('   Б) Сменить владельца объектов на текущего пользователя:')
        console.error(`      psql -U postgres -d ${who.rows[0].current_database} -v new_owner=${who.rows[0].current_user} -f scripts/make-me-owner.sql`)
        console.error('')
        console.error('   В) Выдать текущему пользователю SUPERUSER (только для dev):')
        console.error(`      ALTER ROLE ${who.rows[0].current_user} SUPERUSER;`)
        process.exit(2)
      }
      throw e
    }

    await client.query(CREATE_MIGRATIONS_TABLE)

    const migrations = listMigrations()
    for (const m of migrations) {
      await client.query(
        `INSERT INTO schema_migrations (name) VALUES ($1)
         ON CONFLICT (name) DO NOTHING`,
        [m]
      )
    }
    console.log('✓ Схема применена, миграций помечено:', migrations.length)
  } else {
    console.log('→ Схема на месте, применяю недостающие миграции')
    const applied = new Set(
      (await client.query(`SELECT name FROM schema_migrations`))
        .rows.map(r => r.name)
    )
    const pending = listMigrations().filter(m => !applied.has(m))

    if (!pending.length) {
      console.log('✓ Все миграции уже применены')
    } else {
      for (const name of pending) {
        const sql = readFileSync(join(ROOT, 'sql', 'migrations', name), 'utf8')
        console.log('  →', name)
        await client.query('BEGIN')
        try {
          await client.query(sql)
          await client.query(CREATE_MIGRATIONS_TABLE)
          await client.query(
            `INSERT INTO schema_migrations (name) VALUES ($1)`,
            [name]
          )
          await client.query('COMMIT')
        } catch (e) {
          await client.query('ROLLBACK')
          if (e.code === '42501') {
            console.error(`\n❌ Миграция ${name} требует прав владельца.`)
            console.error('   Причина: ' + e.message)
            console.error('   Запусти: PGUSER=postgres node scripts/db-init.mjs')
            process.exit(2)
          }
          throw e
        }
      }
      console.log('✓ Применено миграций:', pending.length)
    }
  }
} finally {
  await client.end()
}

function listMigrations() {
  const dir = join(ROOT, 'sql', 'migrations')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .sort()
}
