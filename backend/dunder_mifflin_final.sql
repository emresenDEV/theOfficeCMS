
-- Drop and recreate tables for Dunder Mifflin database with corrected relationships

-- Drop tables if they exist
DROP TABLE IF EXISTS tasks, notes, events, employees, users, roles, departments CASCADE;

-- Create departments table
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL
);

-- Create roles table
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL,
    department_id INT REFERENCES departments(department_id)
);

-- Create users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50),
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create employees table
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(user_id),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(100),
    role VARCHAR(50),
    reports_to INT REFERENCES employees(employee_id),
    department VARCHAR(50),
    salary NUMERIC(10,2),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    commission_rate NUMERIC(5,2),
    is_active BOOLEAN DEFAULT TRUE,
    role_id INT REFERENCES roles(role_id),
    department_id INT REFERENCES departments(department_id),
    is_department_lead BOOLEAN DEFAULT FALSE,
    receives_commission BOOLEAN DEFAULT FALSE
);

-- Create notes table
CREATE TABLE notes (
    note_id SERIAL PRIMARY KEY,
    account_id INT,
    invoice_id INT,
    user_id INT REFERENCES users(user_id),
    note_text TEXT NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tasks table
CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    assigned_to INT REFERENCES employees(employee_id),
    task_description TEXT NOT NULL,
    due_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create events table
CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    account_id INT DEFAULT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location VARCHAR(255),
    contact_name VARCHAR(255),
    contact_phone VARCHAR(20),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert departments
INSERT INTO departments (department_name) VALUES
('Sales'),
('Accounting'),
('HR'),
('Customer Support'),
('Reception'),
('Quality Control'),
('Temporary Workers');

-- Insert roles
INSERT INTO roles (role_name, department_id) VALUES
('Salesman', 1),
('Manager', 1),
('Accountant', 2),
('Junior Accountant', 2),
('HR Specialist', 3),
('Customer Support', 4),
('Receptionist', 5),
('Quality Inspector', 6),
('Temp Worker', 7);

-- Insert employees with user_id references
INSERT INTO users (
    user_id, username, password_hash, first_name, last_name, role, reports_to, department, salary, 
    commission_rate, is_active, role_id, department_id, is_department_lead, receives_commission
) VALUES
(1, 'mscott', 'hashed_password_1', 'Michael', 'Scott', 'Regional Manager', NULL, 'Sales', 70000.00, 5.00, TRUE, 2, 1, TRUE, FALSE),
(2, 'jhalpe', 'hashed_password_2', 'Jim', 'Halpert', 'Salesman', 1, 'Sales', 50000.00, 20.00, TRUE, 1, 1, FALSE, TRUE),
(3, 'dschru', 'hashed_password_3', 'Dwight', 'Schrute', 'Salesman', 1, 'Sales', 55000.00, 20.00, TRUE, 1, 1, FALSE, TRUE),
(4, 'shudso', 'hashed_password_4', 'Stanley', 'Hudson', 'Salesman', 1, 'Sales', 48000.00, 20.00, TRUE, 1, 1, FALSE, TRUE),
(5, 'pvance', 'hashed_password_5', 'Phyllis', 'Vance', 'Salesman', 1, 'Sales', 47000.00, 20.00, TRUE, 1, 1, FALSE, TRUE),
(6, 'amarti', 'hashed_password_6', 'Angela', 'Martin', 'Accountant', NULL, 'Accounting', 55000.00, 0.00, TRUE, 3, 2, TRUE, FALSE),
(7, 'omarti', 'hashed_password_7', 'Oscar', 'Martinez', 'Accountant', 6, 'Accounting', 53000.00, 0.00, TRUE, 3, 2, FALSE, FALSE),
(8, 'kmalon', 'hashed_password_8', 'Kevin', 'Malone', 'Junior Accountant', 6, 'Accounting', 46000.00, 0.00, TRUE, 4, 2, FALSE, FALSE),
(9, 'tflend', 'hashed_password_9', 'Toby', 'Flenderson', 'HR Specialist', NULL, 'HR', 58000.00, 0.00, TRUE, 5, 3, TRUE, FALSE),
(10, 'kkapoo', 'hashed_password_10', 'Kelly', 'Kapoor', 'Customer Support', NULL, 'Customer Support', 45000.00, 0.00, TRUE, 6, 4, TRUE, FALSE),
(11, 'pbeesl', 'hashed_password_11', 'Pam', 'Beesly', 'Receptionist', NULL, 'Reception', 42000.00, 0.00, TRUE, 7, 5, TRUE, FALSE),
(12, 'cbratt', 'hashed_password_12', 'Creed', 'Bratton', 'Quality Inspector', NULL, 'Quality Control', 40000.00, 0.00, TRUE, 8, 6, TRUE, FALSE),
(13, 'rhowar', 'hashed_password_13', 'Ryan', 'Howard', 'Temp Worker', NULL, 'Temporary Workers', 30000.00, 0.00, TRUE, 9, 7, TRUE, FALSE);


trigger:

-- Create a function to update `date_updated` before an update
CREATE OR REPLACE FUNCTION update_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to execute the function on UPDATE
CREATE TRIGGER users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();


To generate the schema mapping (SQL):
SELECT 
    conrelid::regclass AS table_name,
    a.attname AS column_name,
    format_type(a.atttypid, a.atttypmod) AS data_type,
    conname AS constraint_name,
    confrelid::regclass AS foreign_table
FROM 
    pg_attribute a
JOIN 
    pg_constraint c ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE 
    c.contype = 'f' 
    AND NOT a.attisdropped
ORDER BY 
    table_name, column_name;

"table_name"	"column_name"	"data_type"	"constraint_name"	"foreign_table"
"invoices"	"sales_user_id"	"integer"	"invoices_sales_user_id_fkey"	"users"
"user_roles"	"reports_to_user_id"	"integer"	"user_roles_reports_to_fkey"	"users"
"commissions"	"user_id"	"integer"	"commissions_user_id_fkey"	"users"
"users"	"department_id"	"integer"	"fk_users_department"	"departments"
"users"	"reports_to"	"integer"	"fk_users_reports_to"	"users"
"users"	"role_id"	"integer"	"fk_users_role"	"roles"
"calendar_events"	"account_id"	"integer"	"calendar_events_account_id_fkey"	"accounts"
"calendar_events"	"user_id"	"integer"	"calendar_events_user_id_fkey"	"users"