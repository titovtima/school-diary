// ---------------------------------------------------------------------------
// db-init:
//   • Если в БД нет ХОТЯ БЫ ОДНОЙ из наших CORE_TABLES — применяем
//     sql/schema.sql целиком (свежая или недоприменённая установка).
//   • Иначе — прогоняем недостающие миграции из sql/migrations/, помечая
//     применённые в таблице schema_migrations.
//
// Флаг --force-schema: всегда применяет sql/schema.sql (перезапишет).
// ---------------------------------------------------------------------------

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const url = process.env.DATABASE_URL
  || `postgres://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'school_diary'}`

const forceSchema = process.argv.includes('--force-schema')

// Полный набор таблиц, которые должны существовать после schema.sql.
// Если хотя бы одной нет — считаем, что нужна свежая установка.
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

  await client.query(CREATE_MIGRATIONS_TABLE)

  // Каких CORE_TABLES не хватает?
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
    await client.query(sql)

    // После schema.sql пересоздаём служебную таблицу
    await client.query(CREATE_MIGRATIONS_TABLE)

    // Помечаем все существующие миграции как применённые
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
