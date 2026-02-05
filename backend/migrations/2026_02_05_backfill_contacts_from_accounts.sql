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
            sales_rep_id
        FROM accounts
        WHERE contact_first_name IS NOT NULL
           OR contact_last_name IS NOT NULL
           OR contact_name IS NOT NULL
           OR email IS NOT NULL
           OR phone_number IS NOT NULL
    LOOP
        IF EXISTS (SELECT 1 FROM account_contacts WHERE account_id = rec.account_id) THEN
            CONTINUE;
        END IF;

        first_name := rec.contact_first_name;
        last_name := rec.contact_last_name;

        IF first_name IS NULL AND last_name IS NULL AND rec.contact_name IS NOT NULL THEN
            first_name := split_part(rec.contact_name, ' ', 1);
            last_name := NULLIF(trim(substring(rec.contact_name from position(' ' in rec.contact_name) + 1)), '');
        END IF;

        INSERT INTO contacts (first_name, last_name, phone, email, status, contact_owner_user_id)
        VALUES (first_name, last_name, rec.phone_number, rec.email, 'active', rec.sales_rep_id)
        RETURNING contact_id INTO new_contact_id;

        INSERT INTO account_contacts (account_id, contact_id, is_primary)
        VALUES (rec.account_id, new_contact_id, TRUE);
    END LOOP;
END $$;
