from flask import Flask, jsonify, request, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS, cross_origin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# =========================================
#  APP INITIALIZATION
# =========================================
app = Flask(__name__)
app.secret_key = "secret_key" # TODO: Change this to a random value for production

# CORS(
#     app, 
#     resources={r"/*": {"origins": ["http://localhost:5173"]}}, #only allows frontend
#     supports_credentials=True
# )

CORS(app, supports_credentials=True)  # ✅ Allows requests from any frontend


# Access-Control-Allow-Origin Headers
@app.after_request
def add_cors_headers(response):
    """✅ Ensure every response includes CORS headers"""
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    
    print(f"✅ CORS Headers Applied: {response.headers['Access-Control-Allow-Origin']}")
    return response

# Database Configuration (Update for your PostgreSQL settings)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Alaska2013!@localhost/dunderdata'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize Database
db = SQLAlchemy(app)

# =========================================
#  DATABASE MODELS (Alphabetized)
# =========================================

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
    industry_id = db.Column(db.Integer, db.ForeignKey('industries.industry_id'))
    sales_employee_id = db.Column(db.Integer, db.ForeignKey('employees.employee_id')) 

    
class Commissions(db.Model):
    __table_name__ = 'commissions'
    commission_id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.employee_id'))
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.invoice_id'))
    commission_rate = db.Column(db.Numeric)
    commission_amount = db.Column(db.Numeric)
    date_paid = db.Column(db.DateTime)
    employee_commission_rate = db.Column(db.Numeric)
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
    due_date = db.Column(db.Date)

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

# =========================================
# API ROUTES (Grouped & Alphabetized)
# =========================================

# Test Route
@app.route('/')
def home():
    return jsonify({'message': 'Flask Backend Running!'})


# ----------------------------
# 📌 ACCOUNTS API
# ----------------------------

#  GET Assigned Accounts API
@app.route("/accounts/assigned", methods=["GET"])
# @cross_origin(origin="http://localhost:5173", supports_credentials=True)
@cross_origin()
def get_assigned_accounts():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    employee = Employee.query.filter_by(user_id=user_id).first()
    if not employee:
        return jsonify({"error": "No employee found for this user"}), 404

    print(f"🔍 Employee ID for User {user_id}: {employee.employee_id}")  # ✅ Debug

    assigned_accounts = Account.query.filter_by(sales_employee_id=employee.employee_id).all()

    print(f"✅ Assigned Accounts API Response: {assigned_accounts}")  # ✅ Debug

    return jsonify([
        {
            "account_id": acc.account_id,
            "business_name": acc.business_name,
            "contact_name": acc.contact_name,
            "phone_number": acc.phone_number,
        } for acc in assigned_accounts
    ]), 200

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

# Get Accounts By ID API
@app.route("/accounts/<int:account_id>", methods=["GET"])
def get_account_by_id(account_id):
    account = Account.query.get(account_id)
    if not account:
        return jsonify({"error": "Account not found"}), 404

    return jsonify({
        "account_id": account.account_id,
        "business_name": account.business_name,
        "contact_name": account.contact_name,
        "email": account.email,
        "phone_number": account.phone_number,
    })

# ----------------------------
# 📌 COMMISSIONS API
# ----------------------------


# Commissions API
@app.route("/commissions", methods=["GET"])
# @cross_origin(origin="http://localhost:5173", supports_credentials=True)
@cross_origin()
# OLD VERSION IS COMMENTED OUT=======================
# def get_commissions():
#     user_id = request.args.get("user_id")
#     filter_by = request.args.get("filter")

#     if not user_id:
#         return jsonify({"error": "User ID is required"}), 400

#     employee = Employee.query.filter_by(user_id=user_id).first()
#     if not employee:
#         return jsonify({"error": "No employee found for this user"}), 404

#     employee_id = employee.employee_id
#     query = Commissions.query.filter(Commissions.employee_id == employee_id)

#     if filter_by == "month":
#         current_month = datetime.utcnow().strftime("%Y-%m")
#         query = query.filter(Commissions.date_paid.like(f"{current_month}%"))
#     elif filter_by == "year":
#         current_year = datetime.utcnow().strftime("%Y")
#         query = query.filter(Commissions.date_paid.like(f"{current_year}%"))

#     commissions = query.all()
#     return jsonify([
#         {
#             "id": com.commission_id,
#             "invoice_id": com.invoice_id,
#             "commission_rate": float(com.commission_rate),
#             "commission_amount": float(com.commission_amount),
#             "date_paid": com.date_paid.strftime("%Y-%m-%d") if com.date_paid else "N/A",
#         }
#         for com in commissions
#     ])

def get_commissions():
    user_id = request.args.get("user_id")
    filter_by = request.args.get("filter")

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    # Get employee ID for this user
    employee = Employee.query.filter_by(user_id=user_id).first()
    if not employee:
        return jsonify({"error": "No employee found for this user"}), 404

    employee_id = employee.employee_id

    # 🗓 Filter commissions based on request
    query = Commissions.query.filter(Commissions.employee_id == employee_id)

    if filter_by == "month":
        start_date = datetime(datetime.now().year, datetime.now().month, 1)
        query = query.filter(Commissions.date_paid >= start_date)
    elif filter_by == "year":
        start_date = datetime(datetime.now().year, 1, 1)
        query = query.filter(Commissions.date_paid >= start_date)

    commissions = query.all()

    return jsonify([
        {
            "id": com.commission_id,
            "invoice_id": com.invoice_id,
            "commission_amount": float(com.commission_amount),
            "date_paid": com.date_paid.strftime("%Y-%m-%d") if com.date_paid else "N/A",
        }
        for com in commissions
    ]), 200
# ----------------------------
# 📌 INVOICES API
# ----------------------------
# Invoices API
@app.route("/invoices", methods=["GET"])
def get_invoices():
    account_id = request.args.get("account_id")

    if account_id:
        invoices = Invoice.query.filter_by(account_id=account_id).all()
    else:
        invoices = Invoice.query.all()

    return jsonify([
        {
            "invoice_id": inv.invoice_id,
            "account_id": inv.account_id,
            "amount": float(inv.amount),
            "status": inv.status,
            "due_date": inv.due_date.strftime('%Y-%m-%d') if inv.due_date else None
        } for inv in invoices
    ])

#  GET Invoice (SINGLE) By ID API
@app.route("/invoices/<int:invoice_id>", methods=["GET"])
def get_invoice(invoice_id):
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    return jsonify({
        "invoice_id": invoice.invoice_id,
        "account_id": invoice.account_id,
        "service": invoice.service,
        "amount": float(invoice.amount),
        "status": invoice.status,
        "due_date": invoice.due_date.strftime("%Y-%m-%d") if invoice.due_date else None,
        "payment_method": invoice.payment_method
    }), 200

# Update Invoice (SINGLE) API
@app.route("/invoices/<int:invoice_id>", methods=["PUT"])
def update_invoice(invoice_id):
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    data = request.json
    invoice.service = data.get("service", invoice.service)
    invoice.amount = data.get("amount", invoice.amount)
    invoice.status = data.get("status", invoice.status)
    invoice.due_date = datetime.strptime(data["due_date"], "%Y-%m-%d") if "due_date" in data else invoice.due_date

    db.session.commit()
    return jsonify({"message": "Invoice updated successfully"}), 200

# Delete Invoice (SINGLE) API
@app.route("/invoices/<int:invoice_id>", methods=["DELETE"])
def delete_invoice(invoice_id):
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    db.session.delete(invoice)
    db.session.commit()
    return jsonify({"message": "Invoice deleted successfully"}), 200


# GET Paid Invoices API
@app.route("/invoices/paid", methods=["GET"])
def get_paid_invoices():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    paid_invoices = Invoice.query.filter_by(sales_employee_id=user_id, status="Paid").all()

    return jsonify([
        {
            "id": inv.invoice_id,
            "account_id": inv.account_id,
            "amount": float(inv.amount),
            "date_paid": inv.date_paid.strftime('%Y-%m-%d') if inv.date_paid else "N/A",
        } for inv in paid_invoices
    ])

# GET Unpaid Invoices API
@app.route("/invoices/unpaid", methods=["GET"])
def get_unpaid_invoices():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    unpaid_invoices = Invoice.query.filter_by(sales_employee_id=user_id, status="Unpaid").all()

    return jsonify([
        {
            "id": inv.invoice_id,
            "account_id": inv.account_id,
            "amount": float(inv.amount),
            "due_date": inv.due_date.strftime('%Y-%m-%d') if inv.due_date else "N/A",
        } for inv in unpaid_invoices
    ])

# GET Past Due Invoices API
@app.route("/invoices/past_due", methods=["GET"])
def get_past_due_invoices():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    today = datetime.utcnow().date()
    past_due_invoices = Invoice.query.filter(
        Invoice.sales_employee_id == user_id,
        Invoice.due_date < today,
        Invoice.status != "Paid"
    ).all()

    return jsonify([
        {
            "id": inv.invoice_id,
            "account_id": inv.account_id,
            "amount": float(inv.amount),
            "due_date": inv.due_date.strftime('%Y-%m-%d') if inv.due_date else "N/A",
        } for inv in past_due_invoices
    ])

# Create Invoices API
@app.route("/invoices", methods=["POST"])
def create_invoice():
    data = request.json
    new_invoice = Invoice(
        account_id=data["account_id"],
        service=data["service"],
        amount=data["amount"],
        tax_rate=data.get("tax_rate", 0),
        discount_percent=data.get("discount_percent", 0),
        final_total=(data["amount"] * (1 + data["tax_rate"] / 100)) - (data["amount"] * (data["discount_percent"] / 100)),
        status="Unpaid",
        paid=False,
        due_date=datetime.strptime(data["due_date"], "%Y-%m-%d"),
        sales_employee_id=data.get("sales_employee_id"),
        date_created=datetime.utcnow(),
        date_updated=datetime.utcnow(),
    )
    db.session.add(new_invoice)
    db.session.commit()
    return jsonify({"success": True, "invoice_id": new_invoice.invoice_id}), 201

# ----------------------------
# 📌 EMPLOYEES API
# ----------------------------

# Employees API
@app.route("/employees", methods=["GET"])
def get_employees():
    employees = Employee.query.all()
    employee_list = [
        {"id": emp.employee_id, "name": f"{emp.first_name} {emp.last_name}", "role": emp.role}
        for emp in employees
    ]
    return jsonify(employee_list), 200

# ----------------------------
# 📌 NOTES API
# ----------------------------
# Get Notes API
@app.route("/notes", methods=["GET"])
def get_notes():
    account_id = request.args.get("account_id")
    assigned_to = request.args.get("assigned_to")

    if account_id:
        notes = Notes.query.filter_by(account_id=account_id).all()
    elif assigned_to:
        notes = Notes.query.filter_by(assigned_to=assigned_to).all()
    else:
        notes = Notes.query.all()

    if not notes:
        return jsonify([])  # ✅ Ensure empty list instead of error

    return jsonify([
        {
            "id": note.note_id,
            "account_id": note.account_id,
            "invoice_id": note.invoice_id,
            "text": note.note_text,
            "completed": note.completed,
            "assigned_to": note.assigned_to,
            "date_created": note.date_created.strftime('%Y-%m-%d %H:%M:%S')
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



# ----------------------------
# 📌 USER AUTHENTICATION | LOGIN
# ----------------------------
@app.route("/login", methods=["OPTIONS", "POST"])
def login():
    if request.method == "OPTIONS":
        return jsonify({"message": "CORS preflight successful"}), 200

    data = request.json
    user = Users.query.filter_by(username=data["username"]).first()

    if user and check_password_hash(user.password_hash, data["password"]):
        session["user_id"] = user.user_id

        # Fetch employee details
        employee = Employee.query.filter_by(user_id=user.user_id).first()
        employee_info = {
            "firstName": employee.first_name if employee else "Unknown",
            "lastName": employee.last_name if employee else "Unknown",
            "role": employee.role if employee and employee.role else (user.role if user and user.role else "Uknown")
        }

        return jsonify({"message": "Login successful", "user": {
            "id": user.user_id,
            "username": user.username,
            **employee_info
        }}), 200

    return jsonify({"message": "Invalid username or password"}), 401


# =========================================
# ✅ START FLASK SERVER
# =========================================

if __name__ == '__main__':
    app.run(debug=True)

