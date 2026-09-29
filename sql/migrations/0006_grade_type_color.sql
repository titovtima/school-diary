-- =============================================================
-- 0006_grade_type_color
-- Добавляет к типам оценок hex-цвет.
-- Заполняет цвета для 4 текущих типов:
--   Работа на уроке        #94a3b8  (серый)
--   Домашнее задание       #22c55e  (зелёный)
--   Самостоятельная работа #0ea5e9  (бирюзовый/голубой)
--   Контрольная работа     #dc2626  (красный)
-- =============================================================

ALTER TABLE grade_types
  ADD COLUMN IF NOT EXISTS color VARCHAR(7) NOT NULL DEFAULT '#94a3b8';

-- Проверка формата: #rrggbb (7 символов, начинается с #)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'grade_types_color_format'
  ) THEN
    ALTER TABLE grade_types
      ADD CONSTRAINT grade_types_color_format
      CHECK (color ~ '^#[0-9a-fA-F]{6}$');
  END IF;
END$$;

-- Конкретные цвета
UPDATE grade_types SET color = '#94a3b8' WHERE name = 'Работа на уроке';
UPDATE grade_types SET color = '#22c55e' WHERE name = 'Домашнее задание';
UPDATE grade_types SET color = '#0ea5e9' WHERE name = 'Самостоятельная работа';
UPDATE grade_types SET color = '#dc2626' WHERE name = 'Контрольная работа';
