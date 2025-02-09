from database import db


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

class CalendarEvents(db.Model):
    event_id = db.Column(db.Integer, primary_key=True)
    event_title = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(255))
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.account_id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    contact_name = db.Column(db.String(100))
    phone_number = db.Column(db.String(20))
    
class Commissions(db.Model):
    __table_name__ = 'commissions'
    commission_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
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
    tax_rate = db.Column(db.Numeric)
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
    payment_method_id = db.Column(db.Integer) #FIXME: always null? should be the method id which the payment method column references for the name of the payment method.
    sales_user_id = db.Column(db.Integer)
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
    
class PaymentMethods(db.Model):
    __table_name__ = 'payment_methods'
    method_id = db.Column(db.Integer, primary_key=True)
    method_name = db.Column(db.String(50))

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
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    role_id = db.Column(db.Integer, db.ForeignKey('user_roles.role_id'))
    reports_to = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True) #FIXME: reports to is based on the department the user is in and who is the lead of the department.
    department_id = db.Column(db.Integer, db.ForeignKey('departments.department_id'))
    salary = db.Column(db.Numeric)
    commission_rate = db.Column(db.Numeric)
    is_active = db.Column(db.Boolean, default=True)
    is_department_lead = db.Column(db.Boolean, default=False)
    receives_commission = db.Column(db.Boolean, default=False)
    phone_number = db.Column(db.String(20))
    extension = db.Column(db.String(5))
    email = db.Column(db.String(100))
    date_created = db.Column(db.DateTime, default=db.func.current_timestamp())
    date_updated = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method="pbkdf2:sha256", salt_length=16)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Create Tables
with app.app_context():
    db.create_all()