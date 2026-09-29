// ---------------------------------------------------------------------------
// reset-all-passwords.mjs
//
// Генерирует новые пароли формата xxx-xxx-xxx-xxx всем пользователям
// (ученикам и учителям), обновляет bcrypt-хеши и печатает две таблицы:
//   • Ученики: login | full_name | password
//   • Учителя: login | full_name | password | admin
//
// Сохраняет всё в local/:
//   • local/student-credentials.txt — только ученики
//   • local/teacher-credentials.txt — только учителя
//   • local/credentials.txt         — все вместе
//
// Папка local/ должна быть в .gitignore (чтобы пароли не улетели в репо).
//
// Запуск:  node scripts/reset-all-passwords.mjs
// ---------------------------------------------------------------------------

import 'dotenv/config'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomInt } from 'node:crypto'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const LOCAL_DIR = resolve(ROOT, 'local')

const url = process.env.DATABASE_URL
  || `postgres://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'school_diary'}`

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

function generatePassword() {
  const groups = []
  for (let g = 0; g < 4; g++) {
    let s = ''
    for (let i = 0; i < 3; i++) s += ALPHABET[randomInt(0, ALPHABET.length)]
    groups.push(s)
  }
  return groups.join('-')
}

function padEnd(s, w) { return s + ' '.repeat(Math.max(0, w - s.length)) }

// Убедимся, что local/ существует
mkdirSync(LOCAL_DIR, { recursive: true })

const client = new pg.Client({ connectionString: url })
await client.connect()

try {
  console.log('→ Подключение к БД:', url.replace(/:[^:@]+@/, ':***@'))

  const { rows: users } = await client.query(
    `SELECT id, login, full_name, role, is_admin
     FROM users
     ORDER BY role, login`
  )

  if (!users.length) {
    console.error('❌ Нет ни одного пользователя. Сначала запусти: npm run db:init && npm run db:seed')
    process.exit(1)
  }

  const students = users.filter(u => u.role === 'student')
  const teachers = users.filter(u => u.role === 'teacher')

  const studentResults = []
  const teacherResults = []

  await client.query('BEGIN')
  for (const u of students) {
    const password = generatePassword()
    const hash = bcrypt.hashSync(password, 10)
    await client.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, u.id])
    studentResults.push({ login: u.login, full_name: u.full_name, password })
  }
  for (const u of teachers) {
    const password = generatePassword()
    const hash = bcrypt.hashSync(password, 10)
    await client.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, u.id])
    teacherResults.push({ login: u.login, full_name: u.full_name, password, is_admin: u.is_admin })
  }
  await client.query('COMMIT')

  // ---------- Вывод в терминал ----------
  function printTable(title, rows, withAdmin = false) {
    console.log('')
    console.log(`=== ${title} (${rows.length}) ===`)
    if (!rows.length) { console.log('  (пусто)'); return }
    const loginW = Math.max(9, ...rows.map(r => r.login.length))
    const nameW  = Math.max(9, ...rows.map(r => r.full_name.length))
    const passW  = 15
    const header = padEnd('login', loginW) + ' | ' + padEnd('full_name', nameW) + ' | password' + (withAdmin ? ' | admin' : '')
    console.log(header)
    console.log('-'.repeat(loginW) + '-+-' + '-'.repeat(nameW) + '-+-' + '-'.repeat(passW) + (withAdmin ? '-+------' : ''))
    for (const r of rows) {
      let line = padEnd(r.login, loginW) + ' | ' + padEnd(r.full_name, nameW) + ' | ' + r.password
      if (withAdmin) line += ' | ' + (r.is_admin ? 'да' : 'нет')
      console.log(line)
    }
  }

  printTable('УЧЕНИКИ', studentResults, false)
  printTable('УЧИТЕЛЯ', teacherResults, true)

  // ---------- Файлы в local/ ----------
  const now = new Date().toISOString()

  const studentFile = resolve(LOCAL_DIR, 'student-credentials.txt')
  const teacherFile = resolve(LOCAL_DIR, 'teacher-credentials.txt')
  const combinedFile = resolve(LOCAL_DIR, 'credentials.txt')

  const studentBody =
    `# Логины и пароли учеников\n# Сгенерировано: ${now}\n\n` +
    studentResults.map(r => `${r.login}\t${r.full_name}\t${r.password}`).join('\n') + '\n'
  writeFileSync(studentFile, studentBody, 'utf8')

  const teacherBody =
    `# Логины и пароли учителей\n# Сгенерировано: ${now}\n\n` +
    teacherResults.map(r => `${r.login}\t${r.full_name}\t${r.password}\t${r.is_admin ? 'admin' : ''}`).join('\n') + '\n'
  writeFileSync(teacherFile, teacherBody, 'utf8')

  const combinedBody =
    `# Логины и пароли — ${now}\n\n` +
    `## Ученики (${studentResults.length})\n` +
    studentResults.map(r => `${r.login}\t${r.full_name}\t${r.password}`).join('\n') + '\n\n' +
    `## Учителя (${teacherResults.length})\n` +
    teacherResults.map(r => `${r.login}\t${r.full_name}\t${r.password}\t${r.is_admin ? 'admin' : ''}`).join('\n') + '\n'
  writeFileSync(combinedFile, combinedBody, 'utf8')

  console.log('')
  console.log('✓ Сохранено в local/:')
  console.log('  • local/student-credentials.txt — только ученики')
  console.log('  • local/teacher-credentials.txt — только учителя')
  console.log('  • local/credentials.txt         — все вместе')
} catch (e) {
  try { await client.query('ROLLBACK') } catch {}
  console.error('❌', e)
  process.exit(1)
} finally {
  await client.end()
}
