-- =============================================================
-- school_diary — полная схема БД (создание с нуля)
-- Учебный год 2026/2027.
--
-- Состав:
--   • структура таблиц и индексов;
--   • справочные данные: классы, предметы, ученики,
--     четверти, типы оценок, привязка предметов к классам.
--
-- НЕ входит (применяется отдельно через db/seed.sql):
--   • пользователи (учителя и ученики с паролями);
--   • расписание;
--   • оценки;
--   • домашние задания.
--
-- Применение:
--   node scripts/db-init.js
--   или: psql $DATABASE_URL -f sql/schema.sql
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- ---------- Роли пользователей ----------
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('teacher', 'student');

-- ---------- Очистка (для повторного применения) ----------
DROP TABLE IF EXISTS sessions          CASCADE;
DROP TABLE IF EXISTS users             CASCADE;
DROP TABLE IF EXISTS homework          CASCADE;
DROP TABLE IF EXISTS grades            CASCADE;
DROP TABLE IF EXISTS schedule          CASCADE;
DROP TABLE IF EXISTS subject_classes   CASCADE;
DROP TABLE IF EXISTS grade_types       CASCADE;
DROP TABLE IF EXISTS subjects          CASCADE;
DROP TABLE IF EXISTS students          CASCADE;
DROP TABLE IF EXISTS terms             CASCADE;
DROP TABLE IF EXISTS classes           CASCADE;

-- ---------- Классы ----------
CREATE TABLE classes (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(20) NOT NULL UNIQUE,
    year  INT NOT NULL
);

-- ---------- Ученики ----------
CREATE TABLE students (
    id          SERIAL PRIMARY KEY,
    class_id    INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    full_name   VARCHAR(150) NOT NULL,
    birth_date  DATE
);

-- ---------- Предметы ----------
CREATE TABLE subjects (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(100) NOT NULL UNIQUE
);

-- ---------- Привязка предметов к классам ----------
CREATE TABLE subject_classes (
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id   INT NOT NULL REFERENCES classes(id)   ON DELETE CASCADE,
    PRIMARY KEY (subject_id, class_id)
);

-- ---------- Типы оценок с весами ----------
CREATE TABLE grade_types (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(50) NOT NULL UNIQUE,
    weight  NUMERIC(3,2) NOT NULL DEFAULT 1.0
);

-- ---------- Расписание ----------
CREATE TABLE schedule (
    id          SERIAL PRIMARY KEY,
    class_id    INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id  INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher     VARCHAR(150),
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
    lesson_num  SMALLINT NOT NULL CHECK (lesson_num BETWEEN 1 AND 8),
    UNIQUE (class_id, day_of_week, lesson_num)
);

-- ---------- Оценки ----------
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

-- ---------- Домашние задания ----------
CREATE TABLE homework (
    id           SERIAL PRIMARY KEY,
    class_id     INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id   INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    due_date     DATE NOT NULL,
    description  TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Пользователи ----------
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    login         VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          user_role NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    student_id    INT REFERENCES students(id) ON DELETE CASCADE,
    is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (role = 'student' AND student_id IS NOT NULL) OR
        (role = 'teacher' AND student_id IS NULL)
    )
);

-- ---------- Сессии ----------
CREATE TABLE sessions (
    token      TEXT PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- ---------- Четверти ----------
CREATE TABLE terms (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date   DATE NOT NULL,
    year       INT  NOT NULL,
    CHECK (end_date >= start_date)
);

-- ---------- Индексы ----------
CREATE INDEX idx_students_class              ON students(class_id);
CREATE INDEX idx_subject_classes_class       ON subject_classes(class_id);
CREATE INDEX idx_schedule_class              ON schedule(class_id);
CREATE INDEX idx_schedule_teacher            ON schedule(teacher);
CREATE INDEX idx_grades_student              ON grades(student_id);
CREATE INDEX idx_grades_date                 ON grades(lesson_date);
CREATE INDEX idx_grades_student_subject_date ON grades(student_id, subject_id, lesson_date);
CREATE INDEX idx_homework_class_date         ON homework(class_id, due_date);
CREATE INDEX idx_homework_class_subject_date ON homework(class_id, subject_id, due_date);
CREATE INDEX idx_users_login                 ON users(login);
CREATE INDEX idx_users_student               ON users(student_id);
CREATE INDEX idx_sessions_user               ON sessions(user_id);
CREATE UNIQUE INDEX idx_terms_year_name      ON terms(year, name);

-- =============================================================
-- СПРАВОЧНЫЕ ДАННЫЕ
-- =============================================================

-- ---------- Четверти 2026/2027 ----------
INSERT INTO terms (name, start_date, end_date, year) VALUES
    ('I четверть',   '2026-09-01', '2026-10-25', 2026),
    ('II четверть',  '2026-11-05', '2026-12-28', 2026),
    ('III четверть', '2027-01-11', '2027-03-22', 2027),
    ('IV четверть',  '2027-04-01', '2027-05-31', 2027);

-- ---------- Классы ----------
INSERT INTO classes (name, year) VALUES
    ('3', 2026), ('4', 2026), ('5', 2026),
    ('6', 2026), ('7', 2026), ('8', 2026);

-- ---------- Предметы (унифицированные названия) ----------
-- ВАЖНО: Труд и Технология объединены в один предмет «Технология».
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
    ('Химия'),
    ('Чтение'),
    ('Письмо'),
    ('Шахматы'),
    ('Нейрогимнастика'),
    ('Внеклассное чтение'),
    ('Развитие речи'),
    ('Театральная студия'),
    ('Вероятность и статистика');

-- ---------- Привязка предметов к классам ----------
-- 3 класс
INSERT INTO subject_classes (subject_id, class_id)
SELECT s.id, c.id FROM subjects s, classes c
WHERE c.name = '3' AND s.name IN (
    'Русский язык','Чтение','Письмо','Математика','История',
    'Английский язык','Технология','Шахматы','Нейрогимнастика',
    'Изобразительное искусство','Внеклассное чтение','Развитие речи',
    'Окружающий мир'
);

-- 4 класс
INSERT INTO subject_classes (subject_id, class_id)
SELECT s.id, c.id FROM subjects s, classes c
WHERE c.name = '4' AND s.name IN (
    'Русский язык','Чтение','Математика','История','Английский язык',
    'Технология','Шахматы','Нейрогимнастика','Изобразительное искусство',
    'Внеклассное чтение','Окружающий мир','Литературное чтение'
);

-- 5 класс
INSERT INTO subject_classes (subject_id, class_id)
SELECT s.id, c.id FROM subjects s, classes c
WHERE c.name = '5' AND s.name IN (
    'Русский язык','Литература','Математика','История','Английский язык',
    'География','Биология','Информатика','Черчение',
    'Изобразительное искусство','Технология','Шахматы','Химия',
    'Внеклассное чтение'
);

-- 6 класс
INSERT INTO subject_classes (subject_id, class_id)
SELECT s.id, c.id FROM subjects s, classes c
WHERE c.name = '6' AND s.name IN (
    'Русский язык','Литература','Математика','История','Английский язык',
    'География','Биология','Информатика','Черчение',
    'Изобразительное искусство','Технология','Шахматы','Химия',
    'Внеклассное чтение'
);

-- 7 класс
INSERT INTO subject_classes (subject_id, class_id)
SELECT s.id, c.id FROM subjects s, classes c
WHERE c.name = '7' AND s.name IN (
    'Русский язык','Литература','Алгебра','Геометрия','Физика',
    'История','Английский язык','Информатика','Биология','Химия',
    'Черчение','Вероятность и статистика'
);

-- 8 класс
INSERT INTO subject_classes (subject_id, class_id)
SELECT s.id, c.id FROM subjects s, classes c
WHERE c.name = '8' AND s.name IN (
    'Русский язык','Литература','Алгебра','Геометрия','Физика',
    'История','Английский язык','Информатика','Биология','Химия',
    'Черчение','Вероятность и статистика'
);

-- ---------- Ученики ----------
INSERT INTO students (class_id, full_name)
SELECT c.id, x.name FROM classes c, (VALUES
    ('Бычков Никита'),
    ('Джус Давид'),
    ('Кисилев Захар'),
    ('Рудин Даниил'),
    ('Шатрова Ника'),
    ('Шатрова Эвелина')
) AS x(name) WHERE c.name = '3';

INSERT INTO students (class_id, full_name)
SELECT c.id, x.name FROM classes c, (VALUES
    ('Журавлев Арсений'),
    ('Коптелева Ева'),
    ('Радковец Георгий'),
    ('Семенова Руфь'),
    ('Шатрова Каролина')
) AS x(name) WHERE c.name = '4';

INSERT INTO students (class_id, full_name)
SELECT c.id, x.name FROM classes c, (VALUES
    ('Гримач Максимилиан'),
    ('Еременко Мария'),
    ('Кузьмин Иван'),
    ('Щербакова Милана')
) AS x(name) WHERE c.name = '5';

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
) AS x(name) WHERE c.name = '6';

INSERT INTO students (class_id, full_name)
SELECT c.id, x.name FROM classes c, (VALUES
    ('Егоров Дмитрий'),
    ('Езус Роман'),
    ('Костиков Артур'),
    ('Шатрова Яна')
) AS x(name) WHERE c.name = '7';

INSERT INTO students (class_id, full_name)
SELECT c.id, x.name FROM classes c, (VALUES
    ('Максимов Богдан'),
    ('Мерзлякова Дарья'),
    ('Семенов Александр')
) AS x(name) WHERE c.name = '8';

-- ---------- Типы оценок с весами ----------
INSERT INTO grade_types (name, weight) VALUES
    ('Работа на уроке',        1.0),
    ('Домашнее задание',       1.0),
    ('Ответ на уроке',         1.0),
    ('Самостоятельная работа', 1.5),
    ('Контрольная работа',     2.0),
    ('Проект',                 1.5);

COMMIT;

-- =============================================================
-- Служебная таблица для миграций (используется db-init.js).
-- Создаём её здесь, чтобы после ручного применения schema.sql
-- через psql всё тоже было готово.
-- =============================================================
CREATE TABLE IF NOT EXISTS schema_migrations (
    name       TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
