-- =============================================================
-- Учебный год 2026/2027
-- =============================================================
BEGIN;

-- 1. Обновляем год в классах
UPDATE classes SET year = 2026;

-- 2. Обновляем четверти
TRUNCATE terms RESTART IDENTITY;

INSERT INTO terms (name, start_date, end_date, year) VALUES
    ('I четверть',   '2026-09-01', '2026-10-25', 2026),
    ('II четверть',  '2026-11-05', '2026-12-28', 2026),
    ('III четверть', '2027-01-11', '2027-03-22', 2027),
    ('IV четверть',  '2027-04-01', '2027-05-31', 2027);

-- 3. Обновляем даты уроков у оценок: переносим год на 2026/2027
--    Сохраняем день/месяц, меняем год.
--    Сентябрь–декабрь → 2026, январь–август → 2027
UPDATE grades
SET lesson_date = make_date(
    CASE WHEN EXTRACT(MONTH FROM lesson_date) >= 9 THEN 2026 ELSE 2027 END,
    EXTRACT(MONTH FROM lesson_date)::int,
    EXTRACT(DAY   FROM lesson_date)::int
);

UPDATE homework
SET due_date = make_date(
    CASE WHEN EXTRACT(MONTH FROM due_date) >= 9 THEN 2026 ELSE 2027 END,
    EXTRACT(MONTH FROM due_date)::int,
    EXTRACT(DAY   FROM due_date)::int
);

COMMIT;

-- Проверка
SELECT id, name, start_date, end_date, year FROM terms ORDER BY start_date;
SELECT MIN(lesson_date) AS min_grade, MAX(lesson_date) AS max_grade FROM grades;
SELECT MIN(due_date)    AS min_hw,    MAX(due_date)    AS max_hw    FROM homework;
SELECT DISTINCT year FROM classes ORDER BY year;
