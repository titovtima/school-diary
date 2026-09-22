import { requireTeacher } from '~/server/utils/auth'

export interface MatrixCellGrade {
  id: number; value: number; weight: number
  grade_type_id: number; grade_type_name: string
}
export interface MatrixRow {
  student_id: number; student_name: string
  grades_by_subject: Record<string, Record<string, MatrixCellGrade[]>>
}
interface MatrixResponse {
  dates: string[]
  rows: MatrixRow[]
  term: { id: number; name: string; start_date: string; end_date: string } | null
}

export default defineEventHandler(async (event): Promise<MatrixResponse> => {
  const user = await requireTeacher(event)
  const classId = Number(getRouterParam(event, 'id'))
  const url = getRequestURL(event)
  const termId = url.searchParams.get('term_id')
  const showAll = url.searchParams.get('all') === '1'

  const adminRows = await query<{ is_admin: boolean }>(
    `SELECT is_admin FROM users WHERE id = $1`, [user.id]
  )
  const isAdmin = adminRows[0]?.is_admin ?? false
  const restrict = !(isAdmin && showAll)

  let term: MatrixResponse['term'] = null
  if (termId) {
    const rows = await query<any>(
      `SELECT id, name,
              to_char(start_date,'YYYY-MM-DD') AS start_date,
              to_char(end_date,'YYYY-MM-DD') AS end_date
       FROM terms WHERE id = $1`,
      [Number(termId)]
    )
    term = rows[0] ?? null
  }

  const from = term?.start_date ?? url.searchParams.get('from')
  const to   = term?.end_date   ?? url.searchParams.get('to')

  let dates: string[] = []
  if (from && to) {
    const rows = await query<{ d: string }>(
      `SELECT to_char(d,'YYYY-MM-DD') AS d
       FROM generate_series($1::date,$2::date,INTERVAL '1 day') AS d
       WHERE EXTRACT(ISODOW FROM d) BETWEEN 1 AND 5
       ORDER BY d`,
      [from, to]
    )
    dates = rows.map(r => r.d)
  }

  // --- Параметры ---
  // $1 = classId
  // $2 = teacher full_name (если restrict)
  // затем from/to
  const params: any[] = [classId]
  let teacherParam = ''
  if (restrict) {
    params.push(user.full_name)
    teacherParam = `$${params.length}`
  }
  let dateFilter = ''
  if (from) { params.push(from); dateFilter += ` AND g.lesson_date >= $${params.length}` }
  if (to)   { params.push(to);   dateFilter += ` AND g.lesson_date <= $${params.length}` }

  // --- ВАЖНО: restrict-условие кладём в LEFT JOIN grades, чтобы ученики
  // без оценок по предметам учителя оставались в выборке (со NULL-оценками)
  const restrictJoin = restrict
    ? ` AND g.subject_id IN (
          SELECT DISTINCT s.subject_id FROM schedule s
          WHERE s.class_id = st.class_id AND s.teacher = ${teacherParam}
        )`
    : ''

  const gradeRows = await query<any>(
    `SELECT st.id AS student_id, st.full_name AS student_name,
            g.subject_id, g.value,
            to_char(g.lesson_date,'YYYY-MM-DD') AS lesson_date,
            gt.weight, g.id, g.grade_type_id, gt.name AS grade_type_name
     FROM students st
     LEFT JOIN grades g
            ON g.student_id = st.id
           ${dateFilter}
           ${restrictJoin}
     LEFT JOIN grade_types gt ON gt.id = g.grade_type_id
     WHERE st.class_id = $1
     ORDER BY st.full_name, g.lesson_date, g.id`,
    params
  )

  const map = new Map<number, MatrixRow>()
  for (const r of gradeRows) {
    if (!map.has(r.student_id)) {
      map.set(r.student_id, {
        student_id: Number(r.student_id),
        student_name: String(r.student_name),
        grades_by_subject: {},
      })
    }
    if (r.subject_id == null || r.lesson_date == null || r.value == null || r.id == null) continue
    const row = map.get(r.student_id)!
    const sid = String(r.subject_id)
    const dt = String(r.lesson_date)
    row.grades_by_subject[sid] ??= {}
    row.grades_by_subject[sid][dt] ??= []
    row.grades_by_subject[sid][dt].push({
      id: Number(r.id),
      value: Number(r.value),
      weight: Number(r.weight) || 1,
      grade_type_id: Number(r.grade_type_id),
      grade_type_name: String(r.grade_type_name),
    })
  }

  return { dates, rows: Array.from(map.values()), term }
})
