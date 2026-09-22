-- =============================================================
-- 0003_holidays_and_terms
-- Каникулы + новые границы четвертей.
-- =============================================================

CREATE TABLE IF NOT EXISTS holidays (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date   DATE NOT NULL,
    CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_holidays_range ON holidays(start_date, end_date);

-- Новые четверти
TRUNCATE terms RESTART IDENTITY;

INSERT INTO terms (name, start_date, end_date, year) VALUES
    ('I четверть',   '2026-09-01', '2026-10-30', 2026),
    ('II четверть',  '2026-11-02', '2026-12-25', 2026),
    ('III четверть', '2027-01-11', '2027-03-26', 2027),
    ('IV четверть',  '2027-04-05', '2027-05-28', 2027);

-- Каникулы
TRUNCATE holidays RESTART IDENTITY;

INSERT INTO holidays (name, start_date, end_date) VALUES
    ('Осенние каникулы I',   '2026-10-05', '2026-10-11'),
    ('Осенние каникулы II',  '2026-11-16', '2026-11-22'),
    ('Зимние каникулы',      '2026-12-28', '2027-01-10'),
    ('Весенние каникулы I',  '2027-02-22', '2027-02-28'),
    ('Весенние каникулы II', '2027-03-29', '2027-04-04');

-- Летние каникулы для явности
INSERT INTO holidays (name, start_date, end_date) VALUES
    ('Летние каникулы',      '2027-05-29', '2027-08-31');
