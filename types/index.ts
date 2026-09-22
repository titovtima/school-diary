export interface SchoolClass { id: number; name: string; year: number }
export interface Student { id: number; class_id: number; full_name: string; birth_date: string | null }
export interface Subject { id: number; name: string }
export interface GradeType { id: number; name: string; weight: number }

export interface ScheduleItem {
  id: number; class_id: number; subject_id: number; subject_name: string
  teacher: string | null; day_of_week: number; lesson_num: number
}

export interface Grade {
  id: number; student_id: number; subject_id: number; subject_name: string
  grade_type_id: number; grade_type_name: string; weight: number
  value: number; lesson_date: string; comment: string | null
}

export interface Homework {
  id: number; class_id: number; subject_id: number; subject_name: string
  due_date: string; description: string
}

export interface NewGrade {
  student_id: number; subject_id: number; grade_type_id: number
  value: number; lesson_date: string; comment?: string
}

export interface NewHomework {
  class_id: number; subject_id: number; due_date: string; description: string
}

export interface AuthUser {
  id: number
  login: string
  role: 'teacher' | 'student'
  full_name: string
  student_id: number | null
  is_admin?: boolean
}

export interface Term {
  id: number; name: string; start_date: string; end_date: string; year: number
}

export interface MatrixCellGrade {
  id: number; value: number; weight: number
  grade_type_id: number; grade_type_name: string
}

export interface MatrixRow {
  student_id: number
  student_name: string
  grades_by_subject: Record<string, Record<string, MatrixCellGrade[]>>
}

export interface StudentGradesResponse {
  grades: Grade[]
  subjects: { id: number; name: string }[]
}
