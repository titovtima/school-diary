-- =============================================================
-- Логины учителей, админы, расписание
-- =============================================================
BEGIN;

-- 1. Колонка «админ» у пользователей
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Убираем старых учителей, кроме трёх админов
DELETE FROM users WHERE role = 'teacher' AND is_admin = FALSE;

-- 3. Пересоздаём учителей с логинами teacher200..teacher299
--    и назначаем админов
DO $$
DECLARE
    rec RECORD;
    idx INT := 200;
    admin_names TEXT[] := ARRAY['Олеся Андреевна', 'Халум Зурабовна', 'Тимофей Андреевич'];
BEGIN
    FOR rec IN
        SELECT DISTINCT teacher AS full_name
        FROM schedule
        WHERE teacher IS NOT NULL
        UNION
        SELECT unnest(admin_names)
    LOOP
        IF rec.full_name = '' THEN CONTINUE; END IF;

        -- если пользователь уже существует — обновим
        IF EXISTS (SELECT 1 FROM users WHERE full_name = rec.full_name AND role = 'teacher') THEN
            UPDATE users
            SET is_admin = (rec.full_name = ANY(admin_names))
            WHERE full_name = rec.full_name AND role = 'teacher';
        ELSE
            INSERT INTO users (login, password_hash, role, full_name, student_id, is_admin)
            VALUES (
                'teacher' || idx,
                crypt('teacher123', gen_salt('bf', 10)),
                'teacher',
                rec.full_name,
                NULL,
                (rec.full_name = ANY(admin_names))
            );
            idx := idx + 1;
        END IF;
    END LOOP;

    -- Олеся Андреевна должна быть админом и вести все предметы без учителя
    UPDATE users SET is_admin = TRUE WHERE full_name = 'Олеся Андреевна' AND role = 'teacher';
END$$;

-- 4. Где в расписании учитель не указан — ставим Олесю Андреевну
UPDATE schedule
SET teacher = 'Олеся Андреевна'
WHERE teacher IS NULL OR teacher = '';

-- 5. Халум Зурабовна и Тимофей Андреевич — админы
UPDATE users SET is_admin = TRUE
WHERE full_name IN ('Халум Зурабовна', 'Тимофей Андреевич') AND role = 'teacher';

COMMIT;

-- Проверка
SELECT login, full_name, is_admin
FROM users
WHERE role = 'teacher'
ORDER BY login;
