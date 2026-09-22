-- =============================================================
-- 0002_grades_lesson_num
-- Добавляем к оценкам номер урока в дне, чтобы можно было
-- различать две оценки за один день по одному предмету.
-- Старые оценки получают lesson_num = 1.
-- =============================================================

ALTER TABLE grades
  ADD COLUMN IF NOT EXISTS lesson_num SMALLINT NOT NULL DEFAULT 1;

-- Дополнительный индекс для быстрого поиска оценок за конкретный урок
CREATE INDEX IF NOT EXISTS idx_grades_student_subject_date_lesson
  ON grades (student_id, subject_id, lesson_date, lesson_num);
