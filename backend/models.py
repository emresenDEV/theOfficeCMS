from database import db
from werkzeug.security import generate_password_hash, check_password_hash

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
    zip_code = db.Column(db.String(10), db.ForeignKey('tax_rates.zip_code'))
    industry_id = db.Column(db.Integer, db.ForeignKey('industries.industry_id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    notes = db.Column(db.Text)
    date_created = db.Column(db.DateTime, default=db.func.current_timestamp())
    date_updated = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.branch_id'))
    

class Branches(db.Model):
    __tablename__ = 'branches'
    branch_id = db.Column(db.Integer, primary_key=True)
    branch_name = db.Column(db.String(50))
    address = db.Column(db.String(255))
    city = db.Column(db.String(50))
    state = db.Column(db.String(2))
    zip_code = db.Column(db.String(10))
    phone_number = db.Column(db.String(20))
    

class CalendarEvent(db.Model):
    __tablename__ = 'calendar_events'
    event_id = db.Column(db.Integer, primary_key=True)
    event_title = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(255))
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.account_id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    contact_name = db.Column(db.String(100))
    phone_number = db.Column(db.String(20))
    
class Commissions(db.Model):
    __tablename__ = 'commissions'
    commission_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.invoice_id'))
    commission_rate = db.Column(db.Numeric) #RATE SHOULD BE BASED ON USER ID set commission rate. 
    commission_amount = db.Column(db.Numeric)
    date_paid = db.Column(db.DateTime)
    user_commission_rate = db.Column(db.Numeric, db.ForeignKey('users.commission_rate'))


class Departments(db.Model):
    __tablename__ = 'departments'
    department_id = db.Column(db.Integer, primary_key=True)
    department_name = db.Column(db.String(50))
    
    users = db.relationship("Users", back_populates="department")
    
class Industry(db.Model):
    __tablename__ = 'industries'
    industry_id = db.Column(db.Integer, primary_key = True)
    industry_name = db.Column(db.String(100))

class Invoice(db.Model):
    __tablename__ = 'invoices'
    invoice_id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.account_id'))
    service = db.Column(db.String(100), db.ForeignKey('services.service_name'))
    amount = db.Column(db.Numeric)
    tax_rate = db.Column(db.Numeric, db.ForeignKey('tax_rates.rate'))
    tax_amount = db.Column(db.Numeric)
    discount_percent = db.Column(db.Numeric, db.ForeignKey('services.discount_percent')) 
    discount_amount = db.Column(db.Numeric)
    final_total = db.Column(db.Numeric)
    status = db.Column(db.String(20))
    paid = db.Column(db.Boolean)
    payment_method = db.Column(db.String(30), db.ForeignKey('payment_methods.method_name'))
    last_four_payment_method = db.Column(db.Numeric)
    total_paid = db.Column(db.Numeric)
    date_paid = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    date_created = db.Column(db.DateTime)
    date_updated = db.Column(db.DateTime)
    payment_method_id = db.Column(db.Integer, db.ForeignKey('payment_methods.method_id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    commission_amount = db.Column(db.Numeric, db.ForeignKey('commissions.commission_amount'))
    due_date = db.Column(db.Date)

class InvoiceServices(db.Model):
    __tablename__ = 'invoice_services'
    invoice_service_id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.invoice_id'))
    service_id = db.Column(db.Integer, db.ForeignKey('services.service_id'))
    quantity = db.Column(db.Integer)
    price = db.Column(db.Numeric, db.ForeignKey('services.price')) 
    total_price = db.Column(db.Numeric)

class Notes(db.Model): 
    __tablename__ = 'notes'
    note_id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.account_id'), nullable=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.invoice_id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    note_text = db.Column(db.Text, nullable=False)
    date_created = db.Column(db.DateTime, default=db.func.current_timestamp())
    
class PaymentMethods(db.Model):
    __tablename__ = 'payment_methods'
    method_id = db.Column(db.Integer, primary_key=True)
    method_name = db.Column(db.String(50))

class Service(db.Model):
    __tablename__ = 'services'
    service_id = db.Column(db.Integer, primary_key=True)
    service_name = db.Column(db.String(50))
    price = db.Column(db.Numeric)
    discount = db.Column(db.Numeric)
    discount_percent = db.Column(db.Numeric)

class TaxRates(db.Model):
    __tablename__ = 'tax_rates'
    state = db.Column(db.String(2))
    zip_code = db.Column(db.Numeric, primary_key=True)
    rate = db.Column(db.Numeric)
    
class Tasks(db.Model):
    __tablename__ = 'tasks'
    task_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.account_id'))
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    task_description = db.Column(db.Text)
    due_date = db.Column(db.DateTime)
    is_completed = db.Column(db.Boolean)
    date_created = db.Column(db.DateTime, default=db.func.current_timestamp())

class UserRoles(db.Model):
    __tablename__ = 'user_roles'
    role_id = db.Column(db.Integer, primary_key=True)
    role_name = db.Column(db.String(50))
    reports_to = db.Column(db.Integer, db.ForeignKey('user_roles.role_id'))
    description = db.Column(db.Text)
    is_lead = db.Column(db.Boolean)

class Users(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    role_id = db.Column(db.Integer, db.ForeignKey('user_roles.role_id'))
    reports_to = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.department_id'), nullable=True)
    salary = db.Column(db.Numeric)
    commission_rate = db.Column(db.Numeric)
    is_active = db.Column(db.Boolean, default=True)
    is_department_lead = db.Column(db.Boolean, db.ForeignKey('user_roles.is_lead'))
    receives_commission = db.Column(db.Boolean, default=False)
    phone_number = db.Column(db.String(20))
    extension = db.Column(db.String(5))
    email = db.Column(db.String(100))
    date_created = db.Column(db.DateTime, default=db.func.current_timestamp())
    date_updated = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.branch_id'))
    
    department = db.relationship("Departments", back_populates="users")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method="pbkdf2:sha256", salt_length=16)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

