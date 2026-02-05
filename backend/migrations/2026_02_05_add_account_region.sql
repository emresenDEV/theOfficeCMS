ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS region VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_accounts_region ON accounts(region);
