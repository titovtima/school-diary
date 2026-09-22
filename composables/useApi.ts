import type {
  SchoolClass, Student, ScheduleItem, Grade, Homework,
  GradeType, Subject, NewGrade, NewHomework, MatrixRow, Term,
  StudentGradesResponse,
} from '~/types'

/** Тихая обёртка над $fetch: не логирует 401, если пользователь не авторизован. */
async function safeFetch<T>(url: string, opts: any = {}): Promise<T> {
  try {
    return await useRequestFetch()<T>(url, opts)
  } catch (e: any) {
    const status = e?.statusCode || e?.response?.status
    if (status === 401) {
      // пользователь вышел — не шумим
      return (opts.default ?? ([] as unknown as T))
    }
    throw e
  }
}

export const useApi = () => {
  const fetch = useRequestFetch()

  return {
    fetchClasses:  () => fetch<SchoolClass[]>('/api/classes'),
    fetchStudents: (classId: number) => fetch<Student[]>(`/api/classes/${classId}/students`),
    fetchSchedule: (classId: number) => fetch<ScheduleItem[]>(`/api/classes/${classId}/schedule`),

    fetchStudentGrades: (studentId: number) =>
      fetch<StudentGradesResponse>(`/api/students/${studentId}/grades`),

    fetchHomework: (studentId: number) => fetch<Homework[]>(`/api/students/${studentId}/homework`),
    fetchGradeTypes: () => fetch<GradeType[]>('/api/grade-types'),
    fetchSubjects:   () => fetch<Subject[]>('/api/subjects'),
    fetchTerms:      () => fetch<Term[]>('/api/terms'),

    createGrade:    (payload: NewGrade) => fetch('/api/grades', { method: 'POST', body: payload }),
    deleteGrade:    (id: number) => fetch(`/api/grades/${id}`, { method: 'DELETE' }),
    updateGrade:    (id: number, payload: { value?: number; grade_type_id?: number; comment?: string }) =>
      fetch(`/api/grades/${id}`, { method: 'PATCH', body: payload }),

    createHomework: (payload: NewHomework) => fetch('/api/homework', { method: 'POST', body: payload }),
    updateHomework: (id: number, payload: { subject_id?: number; due_date?: string; description?: string }) =>
      fetch(`/api/homework/${id}`, { method: 'PATCH', body: payload }),
    deleteHomework: (id: number) => fetch(`/api/homework/${id}`, { method: 'DELETE' }),

    fetchMyClasses: (showAll = false) =>
      fetch<SchoolClass[]>(`/api/teacher/my-classes${showAll ? '?all=1' : ''}`),

    fetchClassSubjects: (classId: number, showAll = false) =>
      fetch<{ id: number; name: string }[]>(
        `/api/teacher/class/${classId}/subjects${showAll ? '?all=1' : ''}`
      ),

    // Это — самое главное место, где раньше шумел 401.
    // После logout watch в TeacherHomeworkList вызывает этот метод
    // с уже удалённой cookie. Возвращаем [] и не бросаем ошибку.
    fetchClassHomework: async (
      classId: number,
      params?: { subject_id?: number; from?: string; to?: string; showAll?: boolean },
    ): Promise<Homework[]> => {
      const q = new URLSearchParams()
      if (params?.subject_id) q.set('subject_id', String(params.subject_id))
      if (params?.from) q.set('from', params.from)
      if (params?.to) q.set('to', params.to)
      if (params?.showAll) q.set('all', '1')
      const suffix = q.toString() ? `?${q.toString()}` : ''
      return safeFetch<Homework[]>(
        `/api/teacher/class/${classId}/homework${suffix}`,
        { default: [] as Homework[] },
      )
    },

    fetchGradesMatrix: async (
      classId: number,
      termId?: number,
      showAll = false,
      subjectId?: number,
    ) => {
      const q = new URLSearchParams()
      if (termId) q.set('term_id', String(termId))
      if (showAll) q.set('all', '1')
      if (subjectId) q.set('subject_id', String(subjectId))
      const suffix = q.toString() ? `?${q.toString()}` : ''
      return safeFetch<{
        columns: { date: string; lesson_num: number; multiLesson: boolean }[]
        rows: MatrixRow[]
        term: Term | null
      }>(
        `/api/teacher/class/${classId}/grades-matrix${suffix}`,
        { default: { columns: [], rows: [], term: null } },
      )
    },

    fetchStudentWeekSchedule: (studentId: number, weekStartISO: string) =>
      fetch<import('~/server/api/students/[id]/week-schedule.get').LessonWithExtras[]>(
        `/api/students/${studentId}/week-schedule?week_start=${weekStartISO}`
      ),
    fetchTeacherWeekSchedule: (weekStartISO: string) =>
      fetch<{
        day_of_week: number; lesson_num: number
        date: string
        class_id: number; class_name: string
        subject_id: number; subject_name: string
        grades: { value: number; weight: number; grade_type_name: string }[]
        homework: { due_date: string; description: string }[]
      }[]>(`/api/teacher/my-week-schedule?week_start=${weekStartISO}`),
  }
}
