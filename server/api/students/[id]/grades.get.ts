import type { Grade } from '~/types'
import { requireUser } from '~/server/utils/auth'

export interface StudentGradesResponse {
  grades: Grade[]
  subjects: { id: number; name: string }[]
}

export default defineEventHandler(async (event): Promise<StudentGradesResponse> => {
  const user = await requireUser(event)
  const id = Number(getRouterParam(event, 'id'))

  if (user.role === 'student' && user.student_id !== id)
    throw createError({ statusCode: 403, message: 'Нет доступа' })

  const subjects = await query<{ id: number; name: string }>(
    `SELECT sub.id, sub.name
     FROM students st
     JOIN subject_classes sc ON sc.class_id = st.class_id
     JOIN subjects sub ON sub.id = sc.subject_id
     WHERE st.id = $1
     ORDER BY sub.name`,
    [id]
  )

  const rawGrades = await query<any>(
    `SELECT g.id, g.student_id, g.subject_id, sub.name AS subject_name,
            g.grade_type_id, gt.name AS grade_type_name, gt.weight,
            g.value, to_char(g.lesson_date, 'YYYY-MM-DD') AS lesson_date,
            g.lesson_num, g.comment
     FROM grades g
     JOIN subjects sub ON sub.id = g.subject_id
     JOIN grade_types gt ON gt.id = g.grade_type_id
     WHERE g.student_id = $1
     ORDER BY g.lesson_date DESC, g.lesson_num DESC, g.id DESC`,
    [id]
  )

  const grades: Grade[] = rawGrades.map(g => ({
    id: Number(g.id),
    student_id: Number(g.student_id),
    subject_id: Number(g.subject_id),
    subject_name: String(g.subject_name),
    grade_type_id: Number(g.grade_type_id),
    grade_type_name: String(g.grade_type_name),
    weight: Number(g.weight) || 1,
    value: Number(g.value),
    lesson_date: String(g.lesson_date),
    lesson_num: Number(g.lesson_num) || 1,
    comment: g.comment ?? null,
  }))

  return { grades, subjects }
})
