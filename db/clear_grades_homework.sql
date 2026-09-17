-- =============================================================
-- Очистка оценок и домашних заданий.
-- Справочники, классы, ученики, расписание и пользователи не трогаем.
-- =============================================================
BEGIN;

TRUNCATE TABLE grades   RESTART IDENTITY CASCADE;
TRUNCATE TABLE homework RESTART IDENTITY CASCADE;

COMMIT;

-- Проверка
SELECT 'grades'   AS t, COUNT(*) FROM grades
UNION ALL SELECT 'homework', COUNT(*) FROM homework;
