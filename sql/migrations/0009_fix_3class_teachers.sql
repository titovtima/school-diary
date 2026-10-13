-- =============================================================
-- 0009_fix_3class_teachers
--
-- У 3 класса:
--   Русский язык → Олеся Андреевна
--   Чтение       → Олеся Андреевна
--
-- Остальные классы и предметы не трогаем.
-- =============================================================

BEGIN;

UPDATE schedule s
SET teacher = 'Олеся Андреевна'
FROM classes c, subjects sub
WHERE s.class_id = c.id
  AND s.subject_id = sub.id
  AND c.name = '3'
  AND sub.name IN ('Русский язык', 'Чтение');

COMMIT;

-- Проверка
SELECT s.day_of_week, s.lesson_num, sub.name AS subject, s.teacher
FROM schedule s
JOIN classes c ON c.id = s.class_id
JOIN subjects sub ON sub.id = s.subject_id
WHERE c.name = '3'
  AND sub.name IN ('Русский язык', 'Чтение')
ORDER BY sub.name, s.day_of_week, s.lesson_num;
