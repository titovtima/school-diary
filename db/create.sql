-- =============================================================
-- school_diary — создание БД с нуля + заполнение
-- Учебный год 2026/2027. Без оценок и домашних заданий.
-- Запуск: psql school_diary -f schema_and_seed.sql
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- =============================================================
-- 1. СХЕМА
-- =============================================================

-- ---------- Роли пользователей ----------
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('teacher', 'student');

-- ---------- Классы ----------
DROP TABLE IF EXISTS sessions        CASCADE;
DROP TABLE IF EXISTS users           CASCADE;
DROP TABLE IF EXISTS homework        CASCADE;
DROP TABLE IF EXISTS grades          CASCADE;
DROP TABLE IF EXISTS schedule        CASCADE;
DROP TABLE IF EXISTS subject_classes CASCADE;
DROP TABLE IF EXISTS grade_types     CASCADE;
DROP TABLE IF EXISTS subjects        CASCADE;
DROP TABLE IF EXISTS students        CASCADE;
DROP TABLE IF EXISTS terms           CASCADE;
DROP TABLE IF EXISTS classes         CASCADE;

CREATE TABLE classes (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(20) NOT NULL UNIQUE,
    year  INT NOT NULL
);

CREATE TABLE students (
    id          SERIAL PRIMARY KEY,
    class_id    INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    full_name   VARCHAR(150) NOT NULL,
    birth_date  DATE
);

CREATE TABLE subjects (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(100) NOT NULL UNIQUE
);

-- Предметы могут относиться к нескольким классам
CREATE TABLE subject_classes (
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id   INT NOT NULL REFERENCES classes(id)   ON DELETE CASCADE,
    PRIMARY KEY (subject_id, class_id)
);

CREATE TABLE grade_types (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(50) NOT NULL UNIQUE,
    weight  NUMERIC(3,2) NOT NULL DEFAULT 1.0
);

CREATE TABLE schedule (
    id          SERIAL PRIMARY KEY,
    class_id    INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id  INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher     VARCHAR(150),
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
    lesson_num  SMALLINT NOT NULL CHECK (lesson_num BETWEEN 1 AND 8),
    UNIQUE (class_id, day_of_week, lesson_num)
);

CREATE TABLE grades (
    id            SERIAL PRIMARY KEY,
    student_id    INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id    INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    grade_type_id INT NOT NULL REFERENCES grade_types(id),
    value         SMALLINT NOT NULL CHECK (value BETWEEN 1 AND 5),
    lesson_date   DATE NOT NULL,
    comment       TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE homework (
    id           SERIAL PRIMARY KEY,
    class_id     INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id   INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    due_date     DATE NOT NULL,
    description  TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    login         VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          user_role NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    student_id    INT REFERENCES students(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (role = 'student' AND student_id IS NOT NULL) OR
        (role = 'teacher' AND student_id IS NULL)
    )
);

CREATE TABLE sessions (
    token      TEXT PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE terms (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date   DATE NOT NULL,
    year       INT  NOT NULL,
    CHECK (end_date >= start_date)
);

-- ---------- Индексы ----------
CREATE INDEX idx_students_class             ON students(class_id);
CREATE INDEX idx_subject_classes_class      ON subject_classes(class_id);
CREATE INDEX idx_schedule_class             ON schedule(class_id);
CREATE INDEX idx_grades_student             ON grades(student_id);
CREATE INDEX idx_grades_date                ON grades(lesson_date);
CREATE INDEX idx_grades_student_subject_date ON grades(student_id, subject_id, lesson_date);
CREATE INDEX idx_homework_class_date        ON homework(class_id, due_date);
CREATE INDEX idx_homework_class_subject_date ON homework(class_id, subject_id, due_date);
CREATE INDEX idx_users_login                ON users(login);
CREATE INDEX idx_users_student              ON users(student_id);
CREATE INDEX idx_sessions_user              ON sessions(user_id);
CREATE UNIQUE INDEX idx_terms_year_name     ON terms(year, name);

-- =============================================================
-- 2. ЗАПОЛНЕНИЕ
-- =============================================================

-- ---------- Четверти 2026/2027 ----------
INSERT INTO terms (name, start_date, end_date, year) VALUES
    ('I четверть',   '2026-09-01', '2026-10-25', 2026),
    ('II четверть',  '2026-11-05', '2026-12-28', 2026),
    ('III четверть', '2027-01-11', '2027-03-22', 2027),
    ('IV четверть',  '2027-04-01', '2027-05-31', 2027);

-- ---------- Классы ----------
INSERT INTO classes (name, year) VALUES
    ('3', 2026),
    ('4', 2026),
    ('5', 2026),
    ('6', 2026),
    ('7', 2026),
    ('8', 2026);

-- ---------- Предметы (унифицированные названия) ----------
INSERT INTO subjects (name) VALUES
    ('Русский язык'),
    ('Литературное чтение'),
    ('Литература'),
    ('Математика'),
    ('Окружающий мир'),
    ('История'),
    ('Английский язык'),
    ('Изобразительное искусство'),
    ('Технология'),
    ('География'),
    ('Биология'),
    ('Информатика'),
    ('Черчение'),
    ('Алгебра'),
    ('Геометрия'),
    ('Физика'),
    ('Химия');

-- ---------- Привязка предметов к классам ----------
-- 3 класс
INSERT INTO subject_classes (subject_id, class_id)
SELECT s.id, c.id FROM subjects s, classes c
WHERE c.name = '3' AND s.name IN (
    'Русский язык', 'Литературное чтение', 'Математика',
    'Окружающий мир', 'История', 'Английский язык',
    'Изобразительное искусство', 'Технология'
);

-- 4 класс
INSERT INTO subject_classes (subject_id, class_id)
SELECT s.id, c.id FROM subjects s, classes c
WHERE c.name = '4' AND s.name IN (
    'Русский язык', 'Литературное чтение', 'Математика',
    'Окружающий мир', 'Английский язык',
    'Изобразительное искусство', 'Технология', 'История'
);

-- 5 класс
INSERT INTO subject_classes (subject_id, class_id)
SELECT s.id, c.id FROM subjects s, classes c
WHERE c.name = '5' AND s.name IN (
    'Русский язык', 'Литература', 'Математика', 'История',
    'Английский язык', 'География', 'Биология', 'Информатика',
    'Черчение', 'Изобразительное искусство', 'Технология'
);

-- 6 класс
INSERT INTO subject_classes (subject_id, class_id)
SELECT s.id, c.id FROM subjects s, classes c
WHERE c.name = '6' AND s.name IN (
    'Русский язык', 'Литература', 'Математика', 'История',
    'Английский язык', 'География', 'Биология', 'Информатика',
    'Черчение', 'Изобразительное искусство', 'Технология'
);

-- 7 класс
INSERT INTO subject_classes (subject_id, class_id)
SELECT s.id, c.id FROM subjects s, classes c
WHERE c.name = '7' AND s.name IN (
    'Русский язык', 'Литература', 'Алгебра', 'Геометрия',
    'Физика', 'История', 'Английский язык', 'Информатика'
);

-- 8 класс
INSERT INTO subject_classes (subject_id, class_id)
SELECT s.id, c.id FROM subjects s, classes c
WHERE c.name = '8' AND s.name IN (
    'Русский язык', 'Литература', 'Алгебра', 'Геометрия',
    'Физика', 'История', 'Английский язык', 'Информатика',
    'Биология', 'Химия'
);

-- ---------- Ученики ----------
-- 3 класс
INSERT INTO students (class_id, full_name)
SELECT c.id, x.name FROM classes c, (VALUES
    ('Бычков Никита'),
    ('Джус Давид'),
    ('Кисилев Захар'),
    ('Рудин Даниил'),
    ('Шатрова Ника'),
    ('Шатрова Эвелина')
) AS x(name)
WHERE c.name = '3';

-- 4 класс
INSERT INTO students (class_id, full_name)
SELECT c.id, x.name FROM classes c, (VALUES
    ('Журавлев Арсений'),
    ('Коптелева Ева'),
    ('Радковец Георгий'),
    ('Семенова Руфь'),
    ('Шатрова Каролина')
) AS x(name)
WHERE c.name = '4';

-- 5 класс
INSERT INTO students (class_id, full_name)
SELECT c.id, x.name FROM classes c, (VALUES
    ('Гримач Максимилиан'),
    ('Еременко Мария'),
    ('Кузьмин Иван'),
    ('Щербакова Милана')
) AS x(name)
WHERE c.name = '5';

-- 6 класс
INSERT INTO students (class_id, full_name)
SELECT c.id, x.name FROM classes c, (VALUES
    ('Березин Богослав'),
    ('Еременко Лидия'),
    ('Мерзлякова Анастасия'),
    ('Обухов Сергей'),
    ('Рафалюк Демид'),
    ('Салишев Роман'),
    ('Семенов Артур'),
    ('Яковлев Марк')
) AS x(name)
WHERE c.name = '6';

-- 7 класс
INSERT INTO students (class_id, full_name)
SELECT c.id, x.name FROM classes c, (VALUES
    ('Егоров Дмитрий'),
    ('Езус Роман'),
    ('Костиков Артур'),
    ('Шатрова Яна')
) AS x(name)
WHERE c.name = '7';

-- 8 класс
INSERT INTO students (class_id, full_name)
SELECT c.id, x.name FROM classes c, (VALUES
    ('Максимов Богдан'),
    ('Мерзлякова Дарья'),
    ('Семенов Александр')
) AS x(name)
WHERE c.name = '8';

-- ---------- Типы оценок с весами ----------
INSERT INTO grade_types (name, weight) VALUES
    ('Работа на уроке',        1.0),
    ('Домашнее задание',       1.0),
    ('Ответ на уроке',         1.0),
    ('Самостоятельная работа', 1.5),
    ('Контрольная работа',     2.0),
    ('Проект',                 1.5);

-- ---------- Расписание (пн–пт, 5 уроков в день) ----------
INSERT INTO schedule (class_id, subject_id, teacher, day_of_week, lesson_num)
SELECT
    sc.class_id,
    sc.subject_id,
    CASE s.name
        WHEN 'Русский язык'              THEN 'Смирнова Анна Петровна'
        WHEN 'Литература'                THEN 'Смирнова Анна Петровна'
        WHEN 'Литературное чтение'       THEN 'Смирнова Анна Петровна'
        WHEN 'Математика'                THEN 'Иванов Сергей Николаевич'
        WHEN 'Алгебра'                   THEN 'Иванов Сергей Николаевич'
        WHEN 'Геометрия'                 THEN 'Иванов Сергей Николаевич'
        WHEN 'Английский язык'           THEN 'Петрова Ольга Владимировна'
        WHEN 'История'                   THEN 'Кузнецов Дмитрий Андреевич'
        WHEN 'Биология'                  THEN 'Морозова Елена Игоревна'
        WHEN 'Окружающий мир'            THEN 'Морозова Елена Игоревна'
        WHEN 'География'                 THEN 'Морозова Елена Игоревна'
        WHEN 'Физика'                    THEN 'Волков Игорь Олегович'
        WHEN 'Химия'                     THEN 'Волков Игорь Олегович'
        WHEN 'Информатика'               THEN 'Соколова Марина Юрьевна'
        WHEN 'Изобразительное искусство' THEN 'Никитин Павел Сергеевич'
        WHEN 'Технология'                THEN 'Никитин Павел Сергеевич'
        WHEN 'Черчение'                  THEN 'Никитин Павел Сергеевич'
    END,
    ((n - 1) / 5)::int + 1,
    ((n - 1) % 5)::int + 1
FROM subject_classes sc
JOIN subjects s ON s.id = sc.subject_id
CROSS JOIN generate_series(1, 25) AS n
WHERE ((n - 1) % 5)::int + 1 = (
    SELECT COUNT(*) + 1
    FROM subject_classes sc2
    JOIN subjects s2 ON s2.id = sc2.subject_id
    WHERE sc2.class_id = sc.class_id
      AND s2.name <= s.name
);

-- ---------- Пользователи ----------
-- Общий учитель + учителя-предметники (пароль teacher123)
INSERT INTO users (login, password_hash, role, full_name, student_id) VALUES
    ('teacher',  crypt('teacher123', gen_salt('bf', 10)), 'teacher', 'Смирнова Анна Петровна',     NULL),
    ('teacher1', crypt('teacher123', gen_salt('bf', 10)), 'teacher', 'Смирнова Анна Петровна',     NULL),
    ('teacher2', crypt('teacher123', gen_salt('bf', 10)), 'teacher', 'Иванов Сергей Николаевич',   NULL),
    ('teacher3', crypt('teacher123', gen_salt('bf', 10)), 'teacher', 'Петрова Ольга Владимировна', NULL),
    ('teacher4', crypt('teacher123', gen_salt('bf', 10)), 'teacher', 'Кузнецов Дмитрий Андреевич', NULL),
    ('teacher5', crypt('teacher123', gen_salt('bf', 10)), 'teacher', 'Морозова Елена Игоревна',    NULL),
    ('teacher6', crypt('teacher123', gen_salt('bf', 10)), 'teacher', 'Волков Игорь Олегович',      NULL),
    ('teacher7', crypt('teacher123', gen_salt('bf', 10)), 'teacher', 'Соколова Марина Юрьевна',    NULL),
    ('teacher8', crypt('teacher123', gen_salt('bf', 10)), 'teacher', 'Никитин Павел Сергеевич',    NULL);

-- По одному ученику каждой параллели (пароль student123)
INSERT INTO users (login, password_hash, role, full_name, student_id)
SELECT
    'student' || c.name,
    crypt('student123', gen_salt('bf', 10)),
    'student',
    s.full_name,
    s.id
FROM classes c
JOIN LATERAL (
    SELECT id, full_name FROM students
    WHERE class_id = c.id
    ORDER BY id
    LIMIT 1
) s ON true;

COMMIT;

-- =============================================================
-- 3. ПРОВЕРКА
-- =============================================================
SELECT 'classes'         AS table_name, COUNT(*) FROM classes
UNION ALL SELECT 'students',         COUNT(*) FROM students
UNION ALL SELECT 'subjects',         COUNT(*) FROM subjects
UNION ALL SELECT 'subject_classes',  COUNT(*) FROM subject_classes
UNION ALL SELECT 'grade_types',      COUNT(*) FROM grade_types
UNION ALL SELECT 'schedule',         COUNT(*) FROM schedule
UNION ALL SELECT 'terms',            COUNT(*) FROM terms
UNION ALL SELECT 'users',            COUNT(*) FROM users
UNION ALL SELECT 'grades',           COUNT(*) FROM grades
UNION ALL SELECT 'homework',         COUNT(*) FROM homework;
