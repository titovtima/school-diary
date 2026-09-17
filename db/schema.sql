-- =========================================================
-- Электронный дневник школы — схема БД (создание с нуля)
-- =========================================================
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS homework CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS schedule CASCADE;
DROP TABLE IF EXISTS grade_types CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TYPE  IF EXISTS user_role CASCADE;

-- ---------- Роли пользователей ----------
CREATE TYPE user_role AS ENUM ('teacher', 'student');

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

-- ---------- Типы работ с весами ----------
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

-- ---------- Индексы ----------
CREATE INDEX idx_students_class        ON students(class_id);
CREATE INDEX idx_schedule_class        ON schedule(class_id);
CREATE INDEX idx_grades_student        ON grades(student_id);
CREATE INDEX idx_grades_date           ON grades(lesson_date);
CREATE INDEX idx_homework_class_date   ON homework(class_id, due_date);
CREATE INDEX idx_users_login           ON users(login);
CREATE INDEX idx_users_student         ON users(student_id);
CREATE INDEX idx_sessions_user         ON sessions(user_id);

-- ---------- Начальные данные ----------
INSERT INTO grade_types (name, weight) VALUES
    ('Работа на уроке', 1.0),
    ('Домашнее задание', 1.0),
    ('Самостоятельная работа', 1.5),
    ('Контрольная работа', 2.0),
    ('Ответ на уроке', 1.0);

INSERT INTO subjects (name) VALUES
    ('Математика'), ('Русский язык'), ('Физика'),
    ('История'), ('Английский язык');

INSERT INTO classes (name, year) VALUES ('5А', 2025), ('11Б', 2025);

INSERT INTO students (class_id, full_name, birth_date) VALUES
    (1, 'Иванов Иван',    '2014-03-12'),
    (1, 'Петрова Мария',  '2014-07-21'),
    (1, 'Сидоров Пётр',   '2014-01-05'),
    (2, 'Кузнецов Артём', '2008-09-30'),
    (2, 'Морозова Анна',  '2008-12-11');

-- Учитель и ученик создаются скриптом scripts/create-user.mjs
-- (пароли хешируются bcrypt, в SQL их не положить)
