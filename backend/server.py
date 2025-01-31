from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

# Initialize Flask App
app = Flask(__name__)
CORS(app, supports_credentials=True) # Allow CORS for all domains on all routes

# Database Configuration (Update for your PostgreSQL settings)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Alaska2013!@localhost/dunderdata'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize Database
db = SQLAlchemy(app)

# Define Models

class Account(db.Model): 
    __tablename__ = 'accounts'
    account_id = db.Column(db.Integer, primary_key=True)
    business_name = db.Column(db.String(100))
    contact_name = db.Column(db.String(100))
    phone_number = db.Column(db.String(20))
    email = db.Column(db.String(100))
    address = db.Column(db.String(255))
    city = db.Column(db.String(30))
    state = db.Column(db.String(2))
    zip_code = db.Column(db.String(10))
    industry = db.Column(db.String(100))
    notes = db.Column(db.Text)
    date_created = db.Column(db.DateTime)
    date_updated = db.Column(db.DateTime)
    industry_id = db.Column(db.Integer)

    
class Commissions(db.Model):
    __table_name__ = 'commissions'
    commission_id = db.Column(db.Integer, primary_key=True)
    commission_amount = db.Column(db.Numeric)
    service_commission_rate = db.Column(db.Numeric)

class Departments(db.Model):
    __table_name__ = 'departments'
    department_id = db.Column(db.Integer, primary_key=True)
    department_name = db.Column(db.String(50))
    description = db.Column(db.Text)
    
class EmployeeRegions(db.Model):
    employee_region_id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer)
    region_id = db.Column(db.Integer)    
    
class Employee(db.Model):
    __tablename__ = 'employees'
    employee_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    phone_number = db.Column(db.String(20))
    email = db.Column(db.String(100))
    role = db.Column(db.String(50))
    reports_to = db.Column(db.Integer)
    department = db.Column(db.String(50))
    salary = db.Column(db.Numeric)
    date_created = db.Column(db.DateTime)
    date_updated = db.Column(db.DateTime)
    commission_rate = db.Column(db.Numeric)
    is_active = db.Column(db.Boolean)
    role_id = db.Column(db.Integer)
    department_id = db.Column(db.Integer)
    is_department_lead = db.Column(db.Boolean)
    receives_commission = db.Column(db.Boolean)
    
class Industry(db.Model):
    __table_name__ = 'industries'
    industry_id = db.Column(db.Integer, primary_key = True)
    industry_name = db.Column(db.String(100))

class Invoice(db.Model):
    __tablename__ = 'invoices'
    invoice_id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer)
    service = db.Column(db.String(100))
    amount = db.Column(db.Numeric)
    tax_amount = db.Column(db.Numeric)
    discount_percent = db.Column(db.Numeric)
    discount_amount = db.Column(db.Numeric)
    final_total = db.Column(db.Numeric)
    status = db.Column(db.String(20))
    paid = db.Column(db.Boolean)
    payment_method = db.Column(db.String(30))
    last_four_payment_method = db.Column(db.Numeric)
    total_paid = db.Column(db.Numeric)
    date_paid = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    date_created = db.Column(db.DateTime)
    date_updated = db.Column(db.DateTime)
    payment_method_id = db.Column(db.Integer)
    sales_employee_id = db.Column(db.Integer)
    commission_amount = db.Column(db.Numeric)

class InvoiceServices(db.Model):
    invoice_service_id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer)
    service_id = db.Column(db.Integer)
    quantity = db.Column(db.Integer)
    price = db.Column(db.Numeric)
    total_price = db.Column(db.Numeric)

class Notes(db.Model): 
    __table_name__ = 'notes'
    note_id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer)
    invoice_id = db.Column(db.Integer)
    user_id = db.Column(db.Integer)
    note_text = db.Column(db.Integer)
    date_created = db.Column(db.DateTime)
    note_type = db.Column(db.String(50))
    assigned_to = db.Column(db.Integer)
    
class PaymentMethods(db.Model):
    __table_name__ = 'payment_methods'
    method_id = db.Column(db.Integer, primary_key=True)
    method_name = db.Column(db.String(50))
    
class RegionZipcodes(db.Model):
    __table_name__ = 'region_zipcodes'
    region_zip_id = db.Column(db.Integer, primary_key=True)
    region_id = db.Column(db.Integer)
    zipcode = db.Column(db.Numeric)

class Region(db.Model):
    __table_name__ = 'regions'
    region_id = db.Column(db.Integer, primary_key=True)
    region_name = db.Column(db.String(50))
    
class Role(db.Model):
    __table_name__ = 'roles'
    role_id = db.Column(db.Integer, primary_key=True)
    role_name = db.Column(db.String(50))
    department_id = db.Column(db.Integer)
    
class Service(db.Model):
    __table_name__ = 'services'
    service_id = db.Column(db.Integer, primary_key=True)
    service_name = db.Column(db.String(50))
    price = db.Column(db.Numeric)
    discount = db.Column(db.Numeric)
    service_commission_rate = db.Column(db.Numeric)
    discount_percent = db.Column(db.Numeric)

class TaxRates(db.Model):
    __table_name__ = 'tax_rates'
    state = db.Column(db.String(2))
    zip_code = db.Column(db.Numeric, primary_key=True)
    rate = db.Column(db.Numeric)

class UserRoles(db.Model):
    __table_name__ = 'user_roles'
    role_id = db.Column(db.Integer, primary_key=True)
    role_name = db.Column(db.String(50))
    reports_to = db.Column(db.Integer)
    description = db.Column(db.Text)

class Users(db.Model):
    __table_name__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50))
    password = db.Column(db.String(50))
    role = db.Column(db.String(50))
    date_updated = db.Column(db.DateTime)
    date_created = db.Column(db.DateTime)

# Create Tables
with app.app_context():
    db.create_all()

# Test Route
@app.route('/')
def home():
    return jsonify({'message': 'Flask Backend Running!'})

if __name__ == '__main__':
    app.run(debug=True)