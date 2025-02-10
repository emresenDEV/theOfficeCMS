
DROP DATABASE IF EXISTS dunderdata;
CREATE DATABASE dunderdata;

\c dunderdata;

-- Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role_id INTEGER REFERENCES user_roles(role_id),
    reports_to INTEGER REFERENCES users(user_id),
    department_id INTEGER REFERENCES departments(department_id),
    salary NUMERIC,
    commission_rate NUMERIC,
    is_active BOOLEAN DEFAULT TRUE,
    is_department_lead BOOLEAN DEFAULT FALSE,
    receives_commission BOOLEAN DEFAULT FALSE,
    phone_number VARCHAR(20),
    extension VARCHAR(5),
    email VARCHAR(100),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Roles Table
CREATE TABLE user_roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50),
    reports_to INTEGER,
    description TEXT
);

-- Departments Table
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(50)
);

-- Accounts Table
CREATE TABLE accounts (
    account_id SERIAL PRIMARY KEY,
    business_name VARCHAR(100),
    contact_name VARCHAR(100),
    phone_number VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(255),
    city VARCHAR(30),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    industry_id INTEGER REFERENCES industries(industry_id),
    sales_employee_id INTEGER REFERENCES users(user_id),
    notes TEXT,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Industries Table
CREATE TABLE industries (
    industry_id SERIAL PRIMARY KEY,
    industry_name VARCHAR(100)
);

-- Invoices Table FIXME: 
CREATE TABLE invoices (
    invoice_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(account_id),
    service VARCHAR(100),
    amount NUMERIC,
    tax_rate NUMERIC,
    tax_amount NUMERIC,
    discount_percent NUMERIC,
    discount_amount NUMERIC,
    final_total NUMERIC,
    status VARCHAR(20),
    paid BOOLEAN,
    payment_method VARCHAR(30),
    last_four_payment_method NUMERIC,
    total_paid NUMERIC,
    date_paid TIMESTAMP,
    notes TEXT,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    payment_method_id INTEGER REFERENCES payment_methods(method_id),
    sales_user_id INTEGER REFERENCES users(user_id),
    commission_amount NUMERIC,
    due_date DATE
);

-- Invoice Services Table
CREATE TABLE invoice_services (
    invoice_service_id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(invoice_id),
    service_id INTEGER REFERENCES services(service_id),
    quantity INTEGER,
    price NUMERIC,
    total_price NUMERIC
);

-- Payment Methods Table
CREATE TABLE payment_methods (
    method_id SERIAL PRIMARY KEY,
    method_name VARCHAR(50)
);

-- Services Table
CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    service_name VARCHAR(50),
    price NUMERIC,
    discount NUMERIC,
    service_commission_rate NUMERIC,
    discount_percent NUMERIC
);

-- Tax Rates Table
CREATE TABLE tax_rates (
    state VARCHAR(2),
    zip_code NUMERIC PRIMARY KEY,
    rate NUMERIC
);

-- Tasks Table
CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    assigned_to INTEGER REFERENCES users(user_id),
    task_description TEXT,
    due_date TIMESTAMP,
    is_completed BOOLEAN,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id INTEGER REFERENCES users(user_id),
    assigned_to_user_id INTEGER REFERENCES users(user_id)
);

-- Notes Table
CREATE TABLE notes (
    note_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(account_id),
    invoice_id INTEGER REFERENCES invoices(invoice_id),
    user_id INTEGER REFERENCES users(user_id),
    note_text TEXT NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calendar Events Table
CREATE TABLE calendar_events (
    event_id SERIAL PRIMARY KEY,
    event_title VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    notes TEXT,
    account_id INTEGER REFERENCES accounts(account_id),
    user_id INTEGER REFERENCES users(user_id),
    contact_name VARCHAR(100),
    phone_number VARCHAR(20)
);

-- Commissions Table
CREATE TABLE commissions (
    commission_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    invoice_id INTEGER REFERENCES invoices(invoice_id),
    commission_rate NUMERIC,
    commission_amount NUMERIC,
    date_paid TIMESTAMP,
    employee_commission_rate NUMERIC,
    service_commission_rate NUMERIC
);

-- Automatic Updates to Date Updated TRIGGER
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_timestamp
BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION update_timestamp();