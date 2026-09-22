-- =============================================================
-- 5 класс, среда:
--   1. Черчение
--   2. Русский
--   3. Русский          ← добавляем
--   4. Математика       ← было 3
--   5. Английский       ← было 4
--   6. Математика       ← было 5
-- =============================================================
BEGIN;

-- Сдвигаем уроки 5→6, 4→5, 3→4 (в обратном порядке, чтобы не конфликтовать по UNIQUE)
UPDATE schedule
SET lesson_num = 6
WHERE class_id = (SELECT id FROM classes WHERE name = '5')
  AND day_of_week = 3 AND lesson_num = 5;

UPDATE schedule
SET lesson_num = 5
WHERE class_id = (SELECT id FROM classes WHERE name = '5')
  AND day_of_week = 3 AND lesson_num = 4;

UPDATE schedule
SET lesson_num = 4
WHERE class_id = (SELECT id FROM classes WHERE name = '5')
  AND day_of_week = 3 AND lesson_num = 3;

-- Добавляем Русский язык на 3-й урок
INSERT INTO schedule (class_id, subject_id, teacher, day_of_week, lesson_num)
SELECT
    c.id,
    s.id,
    'Татьяна Николаевна',
    3,
    3
FROM classes c, subjects s
WHERE c.name = '5' AND s.name = 'Русский язык';

COMMIT;

-- Проверка
SELECT s.lesson_num, sub.name AS subject, s.teacher
FROM schedule s
JOIN classes c ON c.id = s.class_id
JOIN subjects sub ON sub.id = s.subject_id
WHERE c.name = '5' AND s.day_of_week = 3
ORDER BY s.lesson_num;
