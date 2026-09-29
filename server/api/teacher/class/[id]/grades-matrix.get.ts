import { requireTeacher } from '~/server/utils/auth'

export interface MatrixCellGrade {
  id: number; value: number; weight: number
  grade_type_id: number; grade_type_name: string
  grade_type_color: string
  lesson_num: number
}
export interface MatrixRow {
  student_id: number; student_name: string
  grades_by_subject: Record<string, Record<string, MatrixCellGrade[]>>
}
export interface MatrixColumn {
  date: string
  lesson_num: number
  multiLesson: boolean
}
interface MatrixResponse {
  columns: MatrixColumn[]
  rows: MatrixRow[]
  term: { id: number; name: string; start_date: string; end_date: string } | null
}

export default defineEventHandler(async (event): Promise<MatrixResponse> => {
  const user = await requireTeacher(event)
  const classId = Number(getRouterParam(event, 'id'))
  const url = getRequestURL(event)
  const termId = url.searchParams.get('term_id')
  const subjectId = url.searchParams.get('subject_id')
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

  const slotParams: any[] = [classId]
  let slotFilter = ''
  if (subjectId) {
    slotParams.push(Number(subjectId))
    slotFilter += ` AND s.subject_id = $${slotParams.length}`
  }
  if (restrict) {
    slotParams.push(user.full_name)
    slotFilter += ` AND s.teacher = $${slotParams.length}`
  }
  const slots = await query<{ day_of_week: number; lesson_num: number }>(
    `SELECT DISTINCT s.day_of_week, s.lesson_num
     FROM schedule s
     WHERE s.class_id = $1 ${slotFilter}
     ORDER BY s.day_of_week, s.lesson_num`,
    slotParams
  )

  const slotsByDow = new Map<number, number[]>()
  for (const s of slots) {
    if (!slotsByDow.has(s.day_of_week)) slotsByDow.set(s.day_of_week, [])
    slotsByDow.get(s.day_of_week)!.push(s.lesson_num)
  }

  const columns: MatrixColumn[] = []
  if (from && to && slots.length) {
    const days = await query<{ d: string; dow: number }>(
      `SELECT to_char(d,'YYYY-MM-DD') AS d,
              EXTRACT(ISODOW FROM d)::int AS dow
       FROM generate_series($1::date, $2::date, INTERVAL '1 day') AS d
       WHERE EXTRACT(ISODOW FROM d) BETWEEN 1 AND 5
         AND NOT EXISTS (
           SELECT 1 FROM holidays h
           WHERE h.start_date <= d::date AND h.end_date >= d::date
         )
       ORDER BY d`,
      [from, to]
    )
    for (const day of days) {
      const lessonsForDow = slotsByDow.get(day.dow)
      if (!lessonsForDow) continue
      const multi = lessonsForDow.length > 1
      for (const ln of lessonsForDow) {
        columns.push({ date: day.d, lesson_num: ln, multiLesson: multi })
      }
    }
  }

  const params: any[] = [classId]
  let dateFilter = ''
  if (from) { params.push(from); dateFilter += ` AND g.lesson_date >= $${params.length}::date` }
  if (to)   { params.push(to);   dateFilter += ` AND g.lesson_date <= $${params.length}::date` }

  let restrictJoin = ''
  if (subjectId) {
    params.push(Number(subjectId))
    restrictJoin += ` AND g.subject_id = $${params.length}`
  }
  if (restrict) {
    params.push(user.full_name)
    restrictJoin += ` AND g.subject_id IN (
      SELECT DISTINCT s.subject_id FROM schedule s
      WHERE s.class_id = st.class_id AND s.teacher = $${params.length}
    )`
  }

  const gradeRows = await query<any>(
    `SELECT st.id AS student_id, st.full_name AS student_name,
            g.subject_id, g.value,
            to_char(g.lesson_date,'YYYY-MM-DD') AS lesson_date,
            g.lesson_num,
            gt.weight, gt.color AS grade_type_color,
            g.id, g.grade_type_id, gt.name AS grade_type_name
     FROM students st
     LEFT JOIN grades g
            ON g.student_id = st.id
           ${dateFilter}
           ${restrictJoin}
     LEFT JOIN grade_types gt ON gt.id = g.grade_type_id
     WHERE st.class_id = $1
     ORDER BY st.full_name, g.lesson_date, g.lesson_num, g.id`,
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
    const key = `${r.lesson_date}#${Number(r.lesson_num) || 1}`
    row.grades_by_subject[sid] ??= {}
    row.grades_by_subject[sid][key] ??= []
    row.grades_by_subject[sid][key].push({
      id: Number(r.id),
      value: Number(r.value),
      weight: Number(r.weight) || 1,
      grade_type_id: Number(r.grade_type_id),
      grade_type_name: String(r.grade_type_name),
      grade_type_color: String(r.grade_type_color || '#94a3b8'),
      lesson_num: Number(r.lesson_num) || 1,
    })
  }

  return { columns, rows: Array.from(map.values()), term }
})
