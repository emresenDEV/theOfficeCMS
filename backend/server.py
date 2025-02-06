from flask import Flask, jsonify, request, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# Initialize Flask App
app = Flask(__name__)
app.secret_key = "secret_key" # TODO: Change this to a random value for production
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
    date_created = db.Column(db.DateTime, default=db.func.current_timestamp())
    date_updated = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
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
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), unique=True, nullable=False)
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
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.account_id'), nullable=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.invoice_id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    note_text = db.Column(db.Text, nullable=False)
    date_created = db.Column(db.DateTime, default=db.func.current_timestamp())
    note_type = db.Column(db.String(50), default="Task")
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    completed = db.Column(db.Boolean, default=False)
    
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
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50))
    date_updated = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    date_created = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    employee = db.relationship("Employee", backref="user", uselist=False, primaryjoin="Users.user_id == Employee.user_id")
    
    def set_password(self, password):
        """Hashes the password before storing it using PBKDF2-SHA256"""
        self.password_hash = generate_password_hash(password, method="pbkdf2:sha256", salt_length=16)

    def check_password(self, password):
        """Checks a hashed password against the stored hash."""
        return check_password_hash(self.password_hash, password)

# Create Tables
with app.app_context():
    db.create_all()

# Test Route
@app.route('/')
def home():
    return jsonify({'message': 'Flask Backend Running!'})

# Routes

# Employees API
@app.route("/employees", methods=["GET"])
def get_employees():
    employees = Employee.query.all()
    employee_list = [
        {"id": emp.employee_id, "name": f"{emp.first_name} {emp.last_name}", "role": emp.role}
        for emp in employees
    ]
    return jsonify(employee_list), 200

# Invoices API
@app.route("/invoices", methods=["GET"])
def get_invoices():
    invoices = Invoice.query.all()
    invoice_list = [
        {"id": inv.invoice_id, "amount": float(inv.amount), "status": inv.status}
        for inv in invoices
    ]
    return jsonify(invoice_list), 200

# Commissions API
@app.route("/commissions", methods=["GET"])
def get_commissions():
    commissions = Commissions.query.all()
    commission_list = [
        {"id": com.commission_id, "amount": float(com.commission_amount)}
        for com in commissions
    ]
    return jsonify(commission_list), 200

# Get Accounts API
@app.route("/accounts", methods=["GET"])
def get_accounts():
    accounts = Account.query.all()
    account_list = [
        {
            "account_id": acc.account_id,
            "business_name": acc.business_name,
            "contact_name": acc.contact_name,
            "phone_number": acc.phone_number,
            "email": acc.email,
            "address": acc.address,
            "city": acc.city,
            "state": acc.state,
            "zip_code": acc.zip_code,
            "industry": acc.industry,
            "date_created": acc.date_created,
            "date_updated": acc.date_updated,
            "invoice_number": acc.invoice_number if hasattr(acc, 'invoice_number') else None,
            "notes": acc.notes,
        }
        for acc in accounts
    ]
    return jsonify(account_list), 200

# Get Notes API
@app.route("/notes", methods=["GET"])
def get_notes():
    assigned_to = request.args.get("assigned_to")
    if assigned_to:
        notes = Notes.query.filter_by(assigned_to=assigned_to).all()
    else:
        notes = Notes.query.all()
    
    return jsonify([
        {
            "id": note.note_id,
            "text": note.note_text,
            "completed": note.completed
        } for note in notes
    ])

#Create Notes API
@app.route("/notes", methods=["POST"])
def create_note():
    data = request.json
    
    if not data.get("text") or not data.get("user_id"):
        return jsonify({"message": "Missing required fields"}), 400
    
    new_note = Notes(
        user_id=data["user_id"],  
        account_id=data.get("account_id"),
        invoice_id=data.get("invoice_id"),
        note_text=data["text"], 
        note_type=data.get("note_type", "Task"),
        assigned_to=data.get("assigned_to"),
        completed=data.get("completed", False),
    )
    db.session.add(new_note)
    db.session.commit()

    return jsonify({"message": "Task created successfully", "note_id": new_note.note_id}), 201



# User Authentication API (LOGIN)
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = Users.query.filter_by(username=data["username"]).first()

    if user and check_password_hash(user.password_hash, data["password"]):
        session["user_id"] = user.user_id
        return jsonify({"message": "Login successful", "user": {
            "id": user.user_id,
            "username": user.username,
            "role": user.role
        }}), 200
    return jsonify({"message": "Invalid username or password"}), 401



if __name__ == '__main__':
    app.run(debug=True)

