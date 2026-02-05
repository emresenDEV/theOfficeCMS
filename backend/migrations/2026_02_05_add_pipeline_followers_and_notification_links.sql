ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(account_id) ON DELETE SET NULL;

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS invoice_id INTEGER REFERENCES invoices(invoice_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_account_id ON notifications(account_id);
CREATE INDEX IF NOT EXISTS idx_notifications_invoice_id ON notifications(invoice_id);

CREATE TABLE IF NOT EXISTS invoice_pipeline_followers (
    invoice_id INTEGER REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (invoice_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_followers_invoice_id ON invoice_pipeline_followers(invoice_id);
