ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS invoice_id INTEGER REFERENCES invoices(invoice_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_invoice_id ON tasks(invoice_id);
