-- =============================================================
-- 0010_zachet
--
-- Добавляет тип оценки «Зачёт» с весом 2.5 и своим цветом.
-- Старые типы и оценки не трогаются.
-- =============================================================

INSERT INTO grade_types (name, weight, color) VALUES
    ('Зачёт', 2.5, '#7c3aed')
ON CONFLICT (name) DO UPDATE
    SET weight = EXCLUDED.weight,
        color  = EXCLUDED.color;
