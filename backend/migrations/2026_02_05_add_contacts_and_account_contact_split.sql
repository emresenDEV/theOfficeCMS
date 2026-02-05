-- Account contact split
ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS contact_first_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS contact_last_name VARCHAR(100);

-- Backfill from contact_name if present and new columns are empty
UPDATE accounts
SET contact_first_name = split_part(contact_name, ' ', 1),
    contact_last_name = CASE
        WHEN position(' ' in contact_name) > 0
            THEN trim(substring(contact_name from position(' ' in contact_name) + 1))
        ELSE NULL
    END
WHERE contact_name IS NOT NULL
  AND (contact_first_name IS NULL AND contact_last_name IS NULL);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    contact_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    title VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    do_not_call BOOLEAN DEFAULT FALSE,
    do_not_call_date TIMESTAMP NULL,
    email_opt_out BOOLEAN DEFAULT FALSE,
    email_opt_out_date TIMESTAMP NULL,
    contact_owner_user_id INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(contact_owner_user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);

-- Join table for contacts <-> accounts
CREATE TABLE IF NOT EXISTS account_contacts (
    account_id INTEGER REFERENCES accounts(account_id) ON DELETE CASCADE,
    contact_id INTEGER REFERENCES contacts(contact_id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (account_id, contact_id)
);

-- Followers table
CREATE TABLE IF NOT EXISTS contact_followers (
    contact_id INTEGER REFERENCES contacts(contact_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (contact_id, user_id)
);

-- Contact interactions (calls/emails)
CREATE TABLE IF NOT EXISTS contact_interactions (
    interaction_id SERIAL PRIMARY KEY,
    contact_id INTEGER REFERENCES contacts(contact_id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(account_id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    interaction_type VARCHAR(20) NOT NULL,
    subject VARCHAR(255),
    notes TEXT,
    phone_number VARCHAR(20),
    email_address VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_interactions_contact ON contact_interactions(contact_id);

-- Tasks: contact linking + overdue notification tracking
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS contact_id INTEGER REFERENCES contacts(contact_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS overdue_notified_at DATE;

CREATE INDEX IF NOT EXISTS idx_tasks_contact_id ON tasks(contact_id);

-- Audit logs: contact linkage
ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS contact_id INTEGER REFERENCES contacts(contact_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_contact_id ON audit_logs(contact_id);
