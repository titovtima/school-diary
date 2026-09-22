-- Олеся Андреевна ведёт математику и русский язык в 3 классе
BEGIN;

UPDATE schedule
SET teacher = 'Олеся Андреевна'
WHERE class_id = (SELECT id FROM classes WHERE name = '3')
  AND subject_id IN (
    SELECT id FROM subjects WHERE name IN ('Математика', 'Русский язык')
  );

COMMIT;

-- Проверка
SELECT s.day_of_week, s.lesson_num, sub.name AS subject, s.teacher
FROM schedule s
JOIN classes c ON c.id = s.class_id
JOIN subjects sub ON sub.id = s.subject_id
WHERE c.name = '3' AND s.teacher = 'Олеся Андреевна'
ORDER BY s.day_of_week, s.lesson_num;
