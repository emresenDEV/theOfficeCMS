from database import db
from werkzeug.security import generate_password_hash, check_password_hash

# =========================================
#  DATABASE MODELS (Alphabetized)
# =========================================

class Account(db.Model): 
    __tablename__ = 'accounts'
    account_id = db.Column(db.Integer, primary_key=True)
    business_name = db.Column(db.String(100), nullable=False)
    contact_name = db.Column(db.String(100))
    phone_number = db.Column(db.String(20))
    email = db.Column(db.String(100))
    address = db.Column(db.String(255))
    city = db.Column(db.String(30))
    state = db.Column(db.String(2))
    zip_code = db.Column(db.String(10), db.ForeignKey('tax_rates.zip_code'))
    industry_id = db.Column(db.Integer, db.ForeignKey('industries.industry_id'))
    sales_rep_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    notes = db.Column(db.Text)
    date_created = db.Column(db.DateTime, default=db.func.current_timestamp())
    date_updated = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.branch_id'), nullable=True)
    updated_by_user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=True)
    
    # Relationships
    invoices = db.relationship('Invoice', back_populates='account')
    # sales_rep = db.relationship('Users', back_populates='accounts', foreign_keys=[sales_rep_id])
    sales_rep = db.relationship('Users', back_populates='accounts', foreign_keys=[sales_rep_id],  overlaps="accounts_assigned")
    updated_by_user = db.relationship('Users', backref='updated_accounts', foreign_keys=[updated_by_user_id], overlaps="accounts_updated")
    payments = db.relationship("Payment", back_populates="account", foreign_keys='Payment.account_id')

    # Convert object to dictionary for JSON responses
    def to_dict(self):
        return {
            "account_id": self.account_id,
            "business_name": self.business_name,
            "contact_name": self.contact_name,
            "phone_number": self.phone_number,
            "email": self.email,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "zip_code": self.zip_code,
            "industry_id": self.industry_id,
            "sales_rep_id": self.sales_rep_id,
            "branch_id": self.branch_id,
            "notes": self.notes,
            "date_created": self.date_created.strftime("%Y-%m-%d %H:%M:%S") if self.date_created else None,
            "date_updated": self.date_updated.strftime("%Y-%m-%d %H:%M:%S") if self.date_updated else None,
            "updated_by_user_id": self.updated_by_user_id,
        }

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
    sales_rep_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.invoice_id'), nullable=False)
    commission_rate = db.Column(db.Numeric, nullable=False) #RATE SHOULD BE BASED ON USER ID set commission rate. 
    commission_amount = db.Column(db.Numeric, nullable=False)
    date_paid = db.Column(db.DateTime)
    
    # Relationships
    sales_rep = db.relationship('Users', back_populates='commissions', foreign_keys=[sales_rep_id])
    invoice = db.relationship('Invoice', back_populates='commissions', foreign_keys=[invoice_id])
# Commissions table stores all of the commissions for each invoice. Commissions have an ID, a user_id they are linked to, and an invoice_id they are linked to. The invoice_id links to commission to a specific account (which is connected to the invoice via na account_id). The rate is determined by the user_id and the rate associated with said user. The commission amount is calculated by multiplying the com rate by the amount of the invoice (not total_due, because we dont earn commission on taxes). The date_paid is the date the commission was paid out. This table simply stores commission data. 

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
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.account_id'), nullable=False)
    sales_rep_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)

    tax_rate = db.Column(db.Numeric, db.ForeignKey('tax_rates.rate'))
    tax_amount = db.Column(db.Numeric)
    discount_percent = db.Column(db.Numeric)
    discount_amount = db.Column(db.Numeric)
    final_total = db.Column(db.Numeric)
    
    status = db.Column(db.String(20))  # Computed dynamically in service or frontend

    date_created = db.Column(db.DateTime, default=db.func.current_timestamp())
    date_updated = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    due_date = db.Column(db.Date)

    # ✅ Relationships
    account = db.relationship('Account', back_populates='invoices', foreign_keys=[account_id])
    commissions = db.relationship('Commissions', back_populates='invoice', foreign_keys='Commissions.invoice_id')
    sales_rep = db.relationship('Users', back_populates='invoices', foreign_keys=[sales_rep_id])
    invoice_services = db.relationship('InvoiceServices', back_populates='invoice', cascade="all, delete-orphan", overlaps="services")
    services = db.relationship('Service', secondary='invoice_services', back_populates='invoices', overlaps="invoice,invoice_services")
    payments = db.relationship('Payment', back_populates='invoice', cascade="all, delete-orphan")



class InvoiceServices(db.Model):
    __tablename__ = 'invoice_services'
    invoice_service_id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.invoice_id'))
    service_id = db.Column(db.Integer, db.ForeignKey('services.service_id'))
    quantity = db.Column(db.Integer, nullable=False, default=1)
    price_per_unit = db.Column(db.Numeric, nullable=False)
    total_price = db.Column(db.Numeric, nullable=False) #subtotal after discount
    discount_percent = db.Column(db.Numeric, nullable=True) #0.10 for 10%
    discount_total = db.Column(db.Numeric, nullable=True) #amount saved ($00.00)

    
    # Relationships
    invoice = db.relationship('Invoice', back_populates='invoice_services', foreign_keys=[invoice_id], overlaps="services")
    service = db.relationship('Service', back_populates='invoice_services', foreign_keys=[service_id], overlaps="invoices")


class Notes(db.Model): 
    __tablename__ = 'notes'
    note_id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.account_id'), nullable=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.invoice_id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    note_text = db.Column(db.Text, nullable=False)
    date_created = db.Column(db.DateTime, default=db.func.current_timestamp())
    
class Payment(db.Model):
    __tablename__ = 'payments'

    payment_id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.invoice_id'), nullable=False)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.account_id'), nullable=False)
    sales_rep_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    logged_by = db.Column(db.String, nullable=False)
    payment_method = db.Column(db.Integer, db.ForeignKey('payment_methods.method_id'), nullable=False)
    last_four_payment_method = db.Column(db.String(4), nullable=True)
    total_paid = db.Column(db.Numeric, nullable=False)
    date_paid = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)

    # Relationship fix
    invoice = db.relationship("Invoice", back_populates="payments", foreign_keys=[invoice_id])
    account = db.relationship("Account", back_populates="payments", foreign_keys=[account_id])
    sales_rep = db.relationship("Users", back_populates="payments", foreign_keys=[sales_rep_id])

class PaymentMethods(db.Model):
    __tablename__ = 'payment_methods'
    method_id = db.Column(db.Integer, primary_key=True)
    method_name = db.Column(db.String(50))

class Service(db.Model):
    __tablename__ = 'services'
    service_id = db.Column(db.Integer, primary_key=True)
    service_name = db.Column(db.String(50))
    price_per_unit = db.Column(db.Numeric)
    
    # Relationships
    invoice_services = db.relationship('InvoiceServices', back_populates='service', cascade="all, delete-orphan", overlaps="invoice")
    invoices = db.relationship('Invoice', secondary='invoice_services', back_populates='services', overlaps="service,invoice_services")

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
    role_name = db.Column(db.String(50), nullable=False)
    reports_to = db.Column(db.Integer, db.ForeignKey('user_roles.role_id'))
    description = db.Column(db.Text)
    is_lead = db.Column(db.Boolean)

    # Relationships
    users = db.relationship(
        "Users",
        back_populates="role",
        primaryjoin="UserRoles.role_id == Users.role_id",
        foreign_keys="[Users.role_id]"  # Explicitly define foreign key
    )
    
    managers = db.relationship(
        "UserRoles",
        backref=db.backref("subordinates", remote_side=[role_id]),
        foreign_keys=[reports_to]  # Explicitly define foreign key for hierarchy
    )

class Users(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    role_id = db.Column(db.Integer, db.ForeignKey('user_roles.role_id'), nullable=False)
    reports_to = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.department_id'), nullable=True)
    salary = db.Column(db.Numeric)
    commission_rate = db.Column(db.Numeric) # Commission rate is set and stored here
    is_active = db.Column(db.Boolean, default=True)
    is_department_lead = db.Column(db.Boolean, db.ForeignKey('user_roles.is_lead'))
    receives_commission = db.Column(db.Boolean, default=False)
    phone_number = db.Column(db.String(20))
    extension = db.Column(db.String(5))
    email = db.Column(db.String(100))
    date_created = db.Column(db.DateTime, default=db.func.current_timestamp())
    date_updated = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.branch_id'))
    
    # Relationships
    accounts = db.relationship(
    'Account',
    back_populates='sales_rep',
    foreign_keys='Account.sales_rep_id',
    overlaps="accounts_assigned"
    )

    accounts_assigned = db.relationship(
        'Account',
        foreign_keys=[Account.sales_rep_id],
        overlaps="accounts"
    )

    accounts_updated = db.relationship(
        'Account',
        foreign_keys=[Account.updated_by_user_id],
        overlaps="updated_by_user"
    )

    payments = db.relationship("Payment", back_populates="sales_rep", foreign_keys="Payment.sales_rep_id")

    invoices = db.relationship("Invoice", back_populates="sales_rep")
    commissions = db.relationship("Commissions", back_populates="sales_rep")
    department = db.relationship("Departments", back_populates="users")
    role = db.relationship(
        "UserRoles",
        back_populates="users",
        foreign_keys=[role_id] 
    )
    manager = db.relationship(
        "Users",
        remote_side=[user_id],
        backref="subordinates"
    )
    
    # Password Hashing
    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method="pbkdf2:sha256", salt_length=16)
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

