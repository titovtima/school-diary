import { requireTeacher } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireTeacher(event)

  // В БД учитель хранится в поле schedule.teacher как «Имя Отчество»
  const rows = await query<{
    day_of_week: number; lesson_num: number
    class_id: number; class_name: string
    subject_id: number; subject_name: string
  }>(
    `SELECT s.day_of_week, s.lesson_num,
            c.id AS class_id, c.name AS class_name,
            sub.id AS subject_id, sub.name AS subject_name
     FROM schedule s
     JOIN classes  c ON c.id = s.class_id
     JOIN subjects sub ON sub.id = s.subject_id
     WHERE s.teacher = $1
     ORDER BY s.day_of_week, s.lesson_num`,
    [user.full_name]
  )

  return rows
})
