CREATE TABLE IF NOT EXISTS terms (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date   DATE NOT NULL,
    year       INT  NOT NULL,
    CHECK (end_date >= start_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_terms_year_name ON terms(year, name);

INSERT INTO terms (name, start_date, end_date, year) VALUES
    ('I четверть',   '2025-09-01', '2025-10-26', 2025),
    ('II четверть',  '2025-11-05', '2025-12-28', 2025),
    ('III четверть', '2026-01-12', '2026-03-22', 2026),
    ('IV четверть',  '2026-04-01', '2026-05-30', 2026)
ON CONFLICT (year, name) DO NOTHING;
