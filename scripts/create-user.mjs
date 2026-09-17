// Использование:
//   node scripts/create-user.mjs teacher teacher123 "Смирнова А.П."
//   node scripts/create-user.mjs student student123 "Иванов Иван" 1
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const [,, login, password, fullName, studentIdArg] = process.argv
if (!login || !password || !fullName) {
  console.error('Usage: node scripts/create-user.mjs <login> <password> <fullName> [studentId]')
  process.exit(1)
}

const isStudent = studentIdArg && studentIdArg !== 'null'
const role = isStudent ? 'student' : 'teacher'
const student_id = isStudent ? Number(studentIdArg) : null

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'school_diary',
})

const hash = bcrypt.hashSync(password, 10)
await pool.query(
  `INSERT INTO users (login, password_hash, role, full_name, student_id)
   VALUES ($1, $2, $3, $4, $5)
   ON CONFLICT (login) DO UPDATE
     SET password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         full_name = EXCLUDED.full_name,
         student_id = EXCLUDED.student_id`,
  [login, hash, role, fullName, student_id]
)
console.log(`✅ ${login} (${role}) создан/обновлён`)
await pool.end()
