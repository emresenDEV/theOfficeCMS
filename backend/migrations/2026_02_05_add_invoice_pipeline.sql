CREATE TABLE IF NOT EXISTS invoice_pipelines (
    invoice_id INTEGER PRIMARY KEY REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    current_stage VARCHAR(32) NOT NULL DEFAULT 'order_placed',
    start_date DATE,
    contacted_at TIMESTAMP,
    order_placed_at TIMESTAMP,
    payment_not_received_at TIMESTAMP,
    payment_received_at TIMESTAMP,
    order_packaged_at TIMESTAMP,
    order_shipped_at TIMESTAMP,
    order_delivered_at TIMESTAMP,
    payment_issue_notified_at TIMESTAMP,
    payment_issue_escalated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_pipeline_history (
    history_id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    stage VARCHAR(32),
    action VARCHAR(32) NOT NULL DEFAULT 'status_change',
    note TEXT,
    actor_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoice_pipeline_history_invoice_id ON invoice_pipeline_history(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_pipeline_history_created_at ON invoice_pipeline_history(created_at);

INSERT INTO invoice_pipelines (invoice_id, current_stage, start_date, order_placed_at)
SELECT invoices.invoice_id,
       'order_placed',
       invoices.date_created::date,
       invoices.date_created
FROM invoices
WHERE NOT EXISTS (
    SELECT 1 FROM invoice_pipelines WHERE invoice_pipelines.invoice_id = invoices.invoice_id
);
