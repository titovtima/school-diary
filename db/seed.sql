-- =============================================================
-- Заполнение БД школы (учебный год 2026/2027)
-- Запуск: psql school_diary -f db/seed.sql
-- =============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- ---------- Таблица связи предмет ↔ классы ----------
CREATE TABLE IF NOT EXISTS subject_classes (
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id   INT NOT NULL REFERENCES classes(id)   ON DELETE CASCADE,
    PRIMARY KEY (subject_id, class_id)
);
CREATE INDEX IF NOT EXISTS idx_subject_classes_class ON subject_classes(class_id);

-- ---------- Очистка ----------
TRUNCATE sessions, users, homework, grades, schedule,
         subject_classes, grade_types, subjects, students, classes
RESTART IDENTITY CASCADE;

TRUNCATE terms RESTART IDENTITY;

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

-- ---------- Предметы ----------
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
INSERT INTO subject_classes (subject_id, class_id)
SELECT s.id, c.id FROM subjects s, classes c
WHERE c.name = '3' AND s.name IN (
    'Русский язык','Литературное чтение','Математика',
    'Окружающий мир','История','Английский язык',
    'Изобразительное искусство','Технология');

INSERT INTO subject_classes (subject_id, class_id)
SELECT s.id, c.id FROM subjects s, classes c
WHERE c.name = '4' AND s.name IN (
    'Русский язык','Литературное чтение','Математика',
    'Окружающий мир','Английский язык',
    'Изобразительное искусство','Технология','История');

INSERT INTO subject_classes (subject_id, class_id)
SELECT s.id, c.id FROM subjects s, classes c
WHERE c.name = '5' AND s.name IN (
    'Русский язык','Литература','Математика','История',
    'Английский язык','География','Биология','Информатика',
    'Черчение','Изобразительное искусство','Технология');

INSERT INTO subject_classes (subject_id, class_id)
SELECT s.id, c.id FROM subjects s, classes c
WHERE c.name = '6' AND s.name IN (
    'Русский язык','Литература','Математика','История',
    'Английский язык','География','Биология','Информатика',
    'Черчение','Изобразительное искусство','Технология');

INSERT INTO subject_classes (subject_id, class_id)
SELECT s.id, c.id FROM subjects s, classes c
WHERE c.name = '7' AND s.name IN (
    'Русский язык','Литература','Алгебра','Геометрия',
    'Физика','История','Английский язык','Информатика');

INSERT INTO subject_classes (subject_id, class_id)
SELECT s.id, c.id FROM subjects s, classes c
WHERE c.name = '8' AND s.name IN (
    'Русский язык','Литература','Алгебра','Геометрия',
    'Физика','История','Английский язык','Информатика',
    'Биология','Химия');

-- ---------- Ученики ----------
INSERT INTO students (class_id, full_name)
SELECT c.id, x.name FROM classes c, (VALUES
    ('Бычков Никита'),('Джус Давид'),('Кисилев Захар'),
    ('Рудин Даниил'),('Шатрова Ника'),('Шатрова Эвелина')
) AS x(name) WHERE c.name = '3';

INSERT INTO students (class_id, full_name)
SELECT c.id, x.name FROM classes c, (VALUES
    ('Журавлев Арсений'),('Коптелева Ева'),('Радковец Георгий'),
    ('Семенова Руфь'),('Шатрова Каролина')
) AS x(name) WHERE c.name = '4';

INSERT INTO students (class_id, full_name)
SELECT c.id, x.name FROM classes c, (VALUES
    ('Гримач Максимилиан'),('Еременко Мария'),
    ('Кузьмин Иван'),('Щербакова Милана')
) AS x(name) WHERE c.name = '5';

INSERT INTO students (class_id, full_name)
SELECT c.id, x.name FROM classes c, (VALUES
    ('Березин Богослав'),('Еременко Лидия'),('Мерзлякова Анастасия'),
    ('Обухов Сергей'),('Рафалюк Демид'),('Салишев Роман'),
    ('Семенов Артур'),('Яковлев Марк')
) AS x(name) WHERE c.name = '6';

INSERT INTO students (class_id, full_name)
SELECT c.id, x.name FROM classes c, (VALUES
    ('Егоров Дмитрий'),('Езус Роман'),
    ('Костиков Артур'),('Шатрова Яна')
) AS x(name) WHERE c.name = '7';

INSERT INTO students (class_id, full_name)
SELECT c.id, x.name FROM classes c, (VALUES
    ('Максимов Богдан'),('Мерзлякова Дарья'),('Семенов Александр')
) AS x(name) WHERE c.name = '8';

-- ---------- Типы оценок ----------
INSERT INTO grade_types (name, weight) VALUES
    ('Работа на уроке',        1.0),
    ('Домашнее задание',       1.0),
    ('Ответ на уроке',         1.0),
    ('Самостоятельная работа', 1.5),
    ('Контрольная работа',     2.0),
    ('Проект',                 1.5);

-- ---------- Расписание (5 дней × 5 уроков) ----------
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
    WHERE sc2.class_id = sc.class_id AND s2.name <= s.name
);

-- ---------- Оценки (в текущей IV четверти 2027-04-01…2027-05-31) ----------
SELECT setseed(0.42);

INSERT INTO grades (student_id, subject_id, grade_type_id, value, lesson_date)
SELECT
    st.id,
    sc.subject_id,
    gt.id,
    CASE
        WHEN random() < 0.55 THEN 5
        WHEN random() < 0.85 THEN 4
        WHEN random() < 0.97 THEN 3
        ELSE 2
    END,
    d::date
FROM students st
JOIN subject_classes sc ON sc.class_id = st.class_id
CROSS JOIN generate_series('2027-04-01'::date, '2027-05-31'::date, INTERVAL '1 day') AS d
CROSS JOIN LATERAL (
    SELECT id, weight FROM grade_types ORDER BY random() LIMIT 1
) gt
WHERE EXTRACT(ISODOW FROM d) BETWEEN 1 AND 5
  AND random() < 0.30;

-- ---------- Домашние задания ----------
INSERT INTO homework (class_id, subject_id, due_date, description)
SELECT
    sc.class_id,
    sc.subject_id,
    d::date,
    '§ по теме «' || s.name || '», выполнить задания в рабочей тетради.'
FROM subject_classes sc
JOIN subjects s ON s.id = sc.subject_id
CROSS JOIN generate_series('2027-04-05'::date, '2027-05-31'::date, INTERVAL '1 day') AS d
WHERE EXTRACT(ISODOW FROM d) BETWEEN 1 AND 5
  AND random() < 0.20;

-- ---------- Пользователи ----------
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
    WHERE class_id = c.id ORDER BY id LIMIT 1
) s ON true;

COMMIT;

-- Проверка
SELECT 'classes' AS t, COUNT(*) FROM classes
UNION ALL SELECT 'students',   COUNT(*) FROM students
UNION ALL SELECT 'subjects',   COUNT(*) FROM subjects
UNION ALL SELECT 'schedule',   COUNT(*) FROM schedule
UNION ALL SELECT 'grades',     COUNT(*) FROM grades
UNION ALL SELECT 'homework',   COUNT(*) FROM homework
UNION ALL SELECT 'terms',      COUNT(*) FROM terms
UNION ALL SELECT 'users',      COUNT(*) FROM users;
