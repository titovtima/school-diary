-- =============================================================
-- 0007_absences
--
-- Отдельная таблица для отсутствий ученика на уроке.
-- Оценки (grades) не трогаем: value NOT NULL, grade_type_id NOT NULL.
-- Одна запись = один ученик + один урок (предмет + дата + номер).
-- =============================================================

CREATE TABLE IF NOT EXISTS absences (
    id          SERIAL PRIMARY KEY,
    student_id  INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id  INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    lesson_date DATE NOT NULL,
    lesson_num  SMALLINT NOT NULL CHECK (lesson_num BETWEEN 1 AND 8),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, subject_id, lesson_date, lesson_num)
);

CREATE INDEX IF NOT EXISTS idx_absences_student_date
    ON absences (student_id, lesson_date);

CREATE INDEX IF NOT EXISTS idx_absences_class_date
    ON absences (subject_id, lesson_date, lesson_num);
