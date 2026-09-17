-- Никаких структурных изменений не требуется:
-- таблица grades уже допускает несколько записей
-- с одинаковыми (student_id, subject_id, lesson_date).

-- Ускоряем выборку по этим полям:
CREATE INDEX IF NOT EXISTS idx_grades_student_subject_date
    ON grades (student_id, subject_id, lesson_date);

-- Для ДЗ полезно быстро находить по классу и дате:
CREATE INDEX IF NOT EXISTS idx_homework_class_subject_date
    ON homework (class_id, subject_id, due_date);
