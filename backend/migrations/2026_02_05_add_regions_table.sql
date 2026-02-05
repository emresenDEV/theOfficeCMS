CREATE TABLE IF NOT EXISTS regions (
    region_id SERIAL PRIMARY KEY,
    region_name VARCHAR(100) UNIQUE NOT NULL
);

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS region VARCHAR(50);

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS region_id INTEGER REFERENCES regions(region_id);

CREATE INDEX IF NOT EXISTS idx_accounts_region_id ON accounts(region_id);

INSERT INTO regions (region_name)
SELECT DISTINCT region
FROM accounts
WHERE region IS NOT NULL AND region <> ''
ON CONFLICT (region_name) DO NOTHING;

UPDATE accounts a
SET region_id = r.region_id
FROM regions r
WHERE a.region_id IS NULL
  AND a.region IS NOT NULL
  AND a.region = r.region_name;
