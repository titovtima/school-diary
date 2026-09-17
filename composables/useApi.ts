import type {
  SchoolClass, Student, ScheduleItem, Grade, Homework,
  GradeType, Subject, NewGrade, NewHomework, MatrixRow, Term,
  StudentGradesResponse,
} from '~/types'

export const useApi = () => ({
  fetchClasses:  () => $fetch<SchoolClass[]>('/api/classes'),
  fetchStudents: (classId: number) => $fetch<Student[]>(`/api/classes/${classId}/students`),
  fetchSchedule: (classId: number) => $fetch<ScheduleItem[]>(`/api/classes/${classId}/schedule`),

  fetchStudentGrades: (studentId: number) =>
    $fetch<StudentGradesResponse>(`/api/students/${studentId}/grades`),

  fetchHomework: (studentId: number) => $fetch<Homework[]>(`/api/students/${studentId}/homework`),
  fetchGradeTypes: () => $fetch<GradeType[]>('/api/grade-types'),
  fetchSubjects:   () => $fetch<Subject[]>('/api/subjects'),
  fetchTerms:      () => $fetch<Term[]>('/api/terms'),

  createGrade:    (payload: NewGrade) => $fetch('/api/grades', { method: 'POST', body: payload }),
  deleteGrade:    (id: number) => $fetch(`/api/grades/${id}`, { method: 'DELETE' }),
  updateGrade:    (id: number, payload: { value?: number; grade_type_id?: number; comment?: string }) =>
    $fetch(`/api/grades/${id}`, { method: 'PATCH', body: payload }),

  createHomework: (payload: NewHomework) => $fetch('/api/homework', { method: 'POST', body: payload }),
  updateHomework: (id: number, payload: { subject_id?: number; due_date?: string; description?: string }) =>
    $fetch(`/api/homework/${id}`, { method: 'PATCH', body: payload }),
  deleteHomework: (id: number) => $fetch(`/api/homework/${id}`, { method: 'DELETE' }),

  fetchClassSubjects: (classId: number) =>
    $fetch<{ id: number; name: string }[]>(`/api/teacher/class/${classId}/subjects`),

  fetchClassHomework: (classId: number, params?: { subject_id?: number; from?: string; to?: string }) => {
    const q = new URLSearchParams()
    if (params?.subject_id) q.set('subject_id', String(params.subject_id))
    if (params?.from) q.set('from', params.from)
    if (params?.to) q.set('to', params.to)
    const suffix = q.toString() ? `?${q.toString()}` : ''
    return $fetch<Homework[]>(`/api/teacher/class/${classId}/homework${suffix}`)
  },

  fetchGradesMatrix: (classId: number, termId?: number) => {
    const q = new URLSearchParams()
    if (termId) q.set('term_id', String(termId))
    const suffix = q.toString() ? `?${q.toString()}` : ''
    return $fetch<{ dates: string[]; rows: MatrixRow[]; term: Term | null }>(
      `/api/teacher/class/${classId}/grades-matrix${suffix}`
    )
  },
})
