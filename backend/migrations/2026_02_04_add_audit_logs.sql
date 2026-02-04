CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    action VARCHAR(20) NOT NULL,
    user_id INTEGER REFERENCES users(user_id),
    user_email VARCHAR(100),
    account_id INTEGER REFERENCES accounts(account_id),
    invoice_id INTEGER REFERENCES invoices(invoice_id),
    before_data JSONB,
    after_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON audit_logs (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_account
    ON audit_logs (account_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_invoice
    ON audit_logs (invoice_id);
