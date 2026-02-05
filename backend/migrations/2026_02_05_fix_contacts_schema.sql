-- Ensure account contact split exists
ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS contact_first_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS contact_last_name VARCHAR(100);

-- Ensure contacts table exists
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

ALTER TABLE contacts
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS title VARCHAR(100),
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS email VARCHAR(100),
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS do_not_call BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS do_not_call_date TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS email_opt_out BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS email_opt_out_date TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS contact_owner_user_id INTEGER REFERENCES users(user_id),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

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

ALTER TABLE account_contacts
    ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_account_contacts_account_id ON account_contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_account_contacts_contact_id ON account_contacts(contact_id);

-- Followers table
CREATE TABLE IF NOT EXISTS contact_followers (
    contact_id INTEGER REFERENCES contacts(contact_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (contact_id, user_id)
);

ALTER TABLE contact_followers
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Contact interactions
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

ALTER TABLE contact_interactions
    ADD COLUMN IF NOT EXISTS contact_id INTEGER REFERENCES contacts(contact_id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(account_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS interaction_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS subject VARCHAR(255),
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
    ADD COLUMN IF NOT EXISTS email_address VARCHAR(100),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_contact_interactions_contact ON contact_interactions(contact_id);

-- Backfill contacts from accounts when links are missing
DO $$
DECLARE
    rec RECORD;
    new_contact_id INTEGER;
    first_name TEXT;
    last_name TEXT;
BEGIN
    FOR rec IN
        SELECT
            account_id,
            contact_first_name,
            contact_last_name,
            contact_name,
            phone_number,
            email,
            sales_rep_id,
            updated_by_user_id
        FROM accounts
        WHERE (
            contact_first_name IS NOT NULL
            OR contact_last_name IS NOT NULL
            OR contact_name IS NOT NULL
            OR email IS NOT NULL
            OR phone_number IS NOT NULL
        )
        AND NOT EXISTS (
            SELECT 1 FROM account_contacts ac WHERE ac.account_id = accounts.account_id
        )
    LOOP
        first_name := rec.contact_first_name;
        last_name := rec.contact_last_name;

        IF first_name IS NULL AND last_name IS NULL AND rec.contact_name IS NOT NULL THEN
            first_name := split_part(rec.contact_name, ' ', 1);
            last_name := NULLIF(trim(substring(rec.contact_name from position(' ' in rec.contact_name) + 1)), '');
        END IF;

        INSERT INTO contacts (first_name, last_name, phone, email, status, contact_owner_user_id)
        VALUES (
            first_name,
            last_name,
            rec.phone_number,
            rec.email,
            'active',
            COALESCE(rec.sales_rep_id, rec.updated_by_user_id)
        )
        RETURNING contact_id INTO new_contact_id;

        INSERT INTO account_contacts (account_id, contact_id, is_primary)
        VALUES (rec.account_id, new_contact_id, TRUE);
    END LOOP;
END $$;
