import type {
  SchoolClass, Student, ScheduleItem, Grade, Homework,
  GradeType, Subject, NewGrade, NewHomework, MatrixRow, Term,
  StudentGradesResponse,
} from '~/types'

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

    // my-classes: showAll=true → все классы (только для админа), иначе свои
    fetchMyClasses: (showAll = false) =>
      fetch<SchoolClass[]>(`/api/teacher/my-classes${showAll ? '?all=1' : ''}`),

    fetchClassSubjects: (classId: number, showAll = false) =>
      fetch<{ id: number; name: string }[]>(
        `/api/teacher/class/${classId}/subjects${showAll ? '?all=1' : ''}`
      ),

    fetchClassHomework: (
      classId: number,
      params?: { subject_id?: number; from?: string; to?: string; showAll?: boolean },
    ) => {
      const q = new URLSearchParams()
      if (params?.subject_id) q.set('subject_id', String(params.subject_id))
      if (params?.from) q.set('from', params.from)
      if (params?.to) q.set('to', params.to)
      if (params?.showAll) q.set('all', '1')
      const suffix = q.toString() ? `?${q.toString()}` : ''
      return fetch<Homework[]>(`/api/teacher/class/${classId}/homework${suffix}`)
    },

    fetchGradesMatrix: (classId: number, termId?: number, showAll = false) => {
      const q = new URLSearchParams()
      if (termId) q.set('term_id', String(termId))
      if (showAll) q.set('all', '1')
      const suffix = q.toString() ? `?${q.toString()}` : ''
      return fetch<{ dates: string[]; rows: MatrixRow[]; term: Term | null }>(
        `/api/teacher/class/${classId}/grades-matrix${suffix}`
      )
    },

    // Расписание
    fetchStudentWeekSchedule: (studentId: number) =>
      fetch<import('~/server/api/students/[id]/week-schedule.get').LessonWithExtras[]>(
        `/api/students/${studentId}/week-schedule`
      ),
    fetchTeacherWeekSchedule: () =>
      fetch<{
        day_of_week: number; lesson_num: number
        class_id: number; class_name: string
        subject_id: number; subject_name: string
      }[]>('/api/teacher/my-week-schedule'),
  }
}
