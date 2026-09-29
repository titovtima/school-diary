-- =============================================================
-- 0005_grade_types_and_student_logins
--
-- 1. Заменяет типы оценок на 4 новых:
--      работа на уроке        1.0
--      домашнее задание       1.0
--      самостоятельная работа 2.0
--      контрольная работа     2.5
--    Старые типы удаляются. Все существующие оценки стираются.
--
-- 2. Создаёт ученикам-пользователям новые логины:
--      student + YY + NN
--    где YY — две цифры года окончания 11 класса
--             (8 класс → 30, 7 → 31, 6 → 32, 5 → 33, 4 → 34, 3 → 35),
--    NN — номер ученика в классе по списку (01, 02, ...).
--
--    Пароли временно устанавливаются в 'CHANGE_ME'.
--    Их генерирует отдельный скрипт:
--      npm run db:student-passwords
--    Он печатает логины и пароли в stdout и в student-credentials.txt.
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- 1. Типы оценок
-- -------------------------------------------------------------
DELETE FROM grades;
DELETE FROM grade_types;

INSERT INTO grade_types (name, weight) VALUES
    ('Работа на уроке',        1.0),
    ('Домашнее задание',       1.0),
    ('Самостоятельная работа', 2.0),
    ('Контрольная работа',     2.5);

-- -------------------------------------------------------------
-- 2. Логины учеников
-- -------------------------------------------------------------
CREATE TEMP TABLE student_numbered AS
SELECT
    s.id AS student_id,
    s.class_id,
    s.full_name,
    c.name AS class_name,
    (ROW_NUMBER() OVER (PARTITION BY s.class_id ORDER BY s.id))::int AS n,
    (38 - c.name::int) AS year_end
FROM students s
JOIN classes c ON c.id = s.class_id;

CREATE TEMP TABLE student_logins AS
SELECT
    student_id,
    class_id,
    class_name,
    full_name,
    year_end,
    n,
    'student'
      || lpad(year_end::text, 2, '0')
      || lpad(n::text, 2, '0') AS login
FROM student_numbered;

-- Удаляем всех старых учеников-пользователей
DELETE FROM users WHERE role = 'student';

-- Создаём с плейсхолдерным паролем. Реальный пароль поставит
-- scripts/reset-student-passwords.mjs (вызывает bcryptjs).
INSERT INTO users (login, password_hash, role, full_name, student_id, is_admin)
SELECT
    sl.login,
    'CHANGE_ME',
    'student',
    sl.full_name,
    sl.student_id,
    FALSE
FROM student_logins sl;

COMMIT;
