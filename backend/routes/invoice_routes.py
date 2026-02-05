from flask import Blueprint, request, jsonify
from models import Invoice, Account, PaymentMethods, InvoiceServices, Service, Payment, Commissions, Users, TaxRates, AccountContacts, Contact, InvoicePipeline, InvoicePipelineHistory
from database import db
from datetime import datetime
import pytz
from pytz import timezone
from decimal import Decimal
from sqlalchemy.sql import func
from notifications import create_notification
from audit import create_audit_log


invoice_bp = Blueprint("invoice", __name__, url_prefix="/invoices")
central = timezone('America/Chicago')


def _serialize_service(service):
    return {
        "invoice_service_id": service.invoice_service_id,
        "service_id": service.service_id,
        "quantity": service.quantity,
        "price_per_unit": float(service.price_per_unit or 0),
        "discount_percent": float(service.discount_percent or 0),
        "discount_total": float(service.discount_total or 0),
        "total_price": float(service.total_price or 0),
    }


def _serialize_invoice(invoice):
    return {
        "invoice_id": invoice.invoice_id,
        "account_id": invoice.account_id,
        "sales_rep_id": invoice.sales_rep_id,
        "tax_rate": float(invoice.tax_rate or 0),
        "tax_amount": float(invoice.tax_amount or 0),
        "discount_percent": float(invoice.discount_percent or 0),
        "discount_amount": float(invoice.discount_amount or 0),
        "final_total": float(invoice.final_total or 0),
        "status": invoice.status,
        "date_created": invoice.date_created.strftime("%Y-%m-%d %H:%M:%S") if invoice.date_created else None,
        "date_updated": invoice.date_updated.strftime("%Y-%m-%d %H:%M:%S") if invoice.date_updated else None,
        "due_date": invoice.due_date.strftime("%Y-%m-%d") if invoice.due_date else None,
        "services": [_serialize_service(s) for s in invoice.invoice_services],
    }

# Update Invoice Status (Pending to Paid, Past Due, etc.)
@invoice_bp.route("/invoices/<int:invoice_id>/update_status", methods=["PUT"])
def update_invoice_status(invoice_id):
    data = request.json
    new_status = data.get("status")

    if not new_status:
        return jsonify({"error": "Status is required"}), 400

    invoice = Invoice.query.get_or_404(invoice_id)
    before_data = _serialize_invoice(invoice)
    invoice.status = new_status
    create_notification(
        user_id=invoice.sales_rep_id,
        notif_type="invoice_status",
        title="Invoice status updated",
        message=f"Invoice #{invoice.invoice_id} marked {new_status}",
        link=f"/invoice/{invoice.invoice_id}",
        source_type="invoice",
        source_id=invoice.invoice_id,
    )
    create_audit_log(
        entity_type="invoice",
        entity_id=invoice.invoice_id,
        action="update_status",
        user_id=data.get("actor_user_id"),
        user_email=data.get("actor_email"),
        before_data=before_data,
        after_data=_serialize_invoice(invoice),
        account_id=invoice.account_id,
        invoice_id=invoice.invoice_id,
    )
    db.session.commit()
    return jsonify({"message": f"Invoice {invoice_id} status updated to {new_status}"}), 200


def get_tax_rate(zip_code):
    from models import TaxRates
    tax = TaxRates.query.filter_by(zip_code=zip_code).first()
    return float(tax.rate) if tax else 0.0

# Invoices (PLURAL) API
@invoice_bp.route("/", methods=["GET"])
def get_invoices():
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    invoices = Invoice.query.filter_by(sales_rep_id=sales_rep_id).all() if sales_rep_id else Invoice.query.all()

    return jsonify([
        {
            "invoice_id": inv.invoice_id,
            "account_id": inv.account_id,
            "final_total": float(inv.final_total or 0),
            "status": get_invoice_status(inv),
            "sales_rep_id": inv.sales_rep_id,
            "due_date": inv.due_date.strftime('%Y-%m-%d') if inv.due_date else None
        } for inv in invoices
    ]), 200

# Fetch Invoice by ID (Include Services)
@invoice_bp.route("/invoice/<int:invoice_id>", methods=["GET"])
def get_invoice_by_id(invoice_id):
    try:
        invoice = Invoice.query.get_or_404(invoice_id)

        # Payments and dynamic status
        payments = Payment.query.filter_by(invoice_id=invoice.invoice_id).all()
        paid_total = sum(float(p.total_paid or 0) for p in payments)
        today = datetime.now(central).date()
        due = invoice.due_date if invoice.due_date else None
        final_total = invoice.final_total or 0

        if paid_total >= final_total:
            current_status = "Paid"
        elif paid_total == 0:
            current_status = "Past Due" if due and today > due else "Pending"
        elif due and today > due:
            current_status = "Past Due"
        else:
            current_status = "Partial"

        account = Account.query.get(invoice.account_id)
        sales_rep = Users.query.get(invoice.sales_rep_id)
        commission = db.session.query(func.sum(Commissions.commission_amount)).filter(Commissions.invoice_id == invoice_id).scalar()
        tax_rate = get_tax_rate(account.zip_code)
        # user = Users.query.filter_by(username=p.logged_by).first()

        services = (
            db.session.query(InvoiceServices, Service)
            .join(Service, InvoiceServices.service_id == Service.service_id)
            .filter(InvoiceServices.invoice_id == invoice_id)
            .all()
        )

        service_list = [
            {
                "service_id": s.service_id,
                "service_name": s.service_name,
                "quantity": i.quantity,
                "price_per_unit": float(i.price_per_unit),
                "total_price": float(i.total_price)
            }
            for i, s in services
        ]

        payment_list = []
        for p in payments:
            user = Users.query.filter_by(username=p.logged_by).first()
            payment_list.append({
                "payment_id": p.payment_id,
                "payment_method": p.payment_method,
                "method_name": PaymentMethods.query.get(p.payment_method).method_name if p.payment_method else None,
                "logged_by": p.logged_by,
                "logged_by_username": user.username if user else None,
                "logged_by_first_name": user.first_name if user else None,
                "logged_by_last_name": user.last_name if user else None,
                "last_four_payment_method": p.last_four_payment_method,
                "total_paid": float(p.total_paid),
                "date_paid": p.date_paid.strftime("%Y-%m-%d %H:%M:%S")
            })

        


        primary_contact_id = None
        primary_contact_name = None
        if account:
            primary_link = AccountContacts.query.filter_by(account_id=account.account_id).order_by(
                AccountContacts.is_primary.desc(),
                AccountContacts.created_at.asc(),
            ).first()
            if primary_link:
                contact = Contact.query.get(primary_link.contact_id)
                if contact:
                    primary_contact_id = contact.contact_id
                    primary_contact_name = f"{contact.first_name or ''} {contact.last_name or ''}".strip() or None

        return jsonify({
            "invoice_id": invoice.invoice_id,
            "account_id": invoice.account_id,
            "sales_rep_id": invoice.sales_rep_id,
            "status": current_status,
            "tax_rate": tax_rate,
            "tax_amount": float(invoice.tax_amount or 0),
            "discount_percent": float(invoice.discount_percent or 0),
            "discount_amount": float(invoice.discount_amount or 0),
            "final_total": float(invoice.final_total or 0),
            "total_paid": paid_total,
            "commission_amount": float(commission or 0),
            "date_paid": max((p.date_paid for p in payments), default=None).strftime("%Y-%m-%d") if payments else None,
            "date_created": invoice.date_created.strftime("%Y-%m-%d %H:%M:%S"),
            "date_updated": invoice.date_updated.strftime("%Y-%m-%d %H:%M:%S"),
            "due_date": invoice.due_date.strftime("%Y-%m-%d") if invoice.due_date else None,
            "services": service_list,
            "payments": payment_list,

            # Account details
            "business_name": account.business_name if account else None,
            "address": account.address if account else None,
            "city": account.city if account else None,
            "state": account.state if account else None,
            "zip_code": account.zip_code if account else None,
            "phone_number": account.phone_number if account else None,
            "email": account.email if account else None,
            "primary_contact_id": primary_contact_id,
            "primary_contact_name": primary_contact_name,
            "contact_name": (
                " ".join([p for p in [account.contact_first_name, account.contact_last_name] if p])
                if account and (account.contact_first_name or account.contact_last_name)
                else (account.contact_name if account else None)
            ),

            # Sales rep details
            "sales_rep_name": f"{getattr(sales_rep, 'first_name', '')} {getattr(sales_rep, 'last_name', '')}".strip() if sales_rep else None,
            "sales_rep_email": getattr(sales_rep, 'email', None),
            "sales_rep_phone": getattr(sales_rep, 'phone_number', None),

        }), 200

    except Exception as e:
        print(f"❌ Error in get_invoice_by_id: {e}")
        return jsonify({"error": "Failed to fetch invoice", "details": str(e)}), 500

# Helper: Determine Invoice Status
def get_invoice_status(invoice):
    payments = Payment.query.filter_by(invoice_id=invoice.invoice_id).count()
    if payments:
        return "Paid"
    if invoice.due_date and invoice.due_date < datetime.now(central).date():
        return "Past Due"
    return "Unpaid"

# Fetch invoices by account ID
@invoice_bp.route("/account/<int:account_id>", methods=["GET"])
def get_invoices_by_account(account_id):
    try:
        status_filter = request.args.get("status")  # optional query param

        payment_totals = (
            db.session.query(
                Payment.invoice_id.label("invoice_id"),
                func.coalesce(func.sum(Payment.total_paid), 0).label("total_paid"),
            )
            .group_by(Payment.invoice_id)
            .subquery()
        )

        query = (
            db.session.query(
                Invoice.invoice_id,
                Invoice.account_id,
                Invoice.sales_rep_id,
                Invoice.tax_rate,
                Invoice.tax_amount,
                Invoice.discount_percent,
                Invoice.discount_amount,
                Invoice.final_total,
                Invoice.status,
                Invoice.date_created,
                Invoice.date_updated,
                Invoice.due_date,
                func.sum(Commissions.commission_amount).label("commission_amount"),
                func.coalesce(payment_totals.c.total_paid, 0).label("total_paid"),
            )
            .outerjoin(Commissions, Commissions.invoice_id == Invoice.invoice_id)
            .outerjoin(payment_totals, payment_totals.c.invoice_id == Invoice.invoice_id)
            .filter(Invoice.account_id == account_id)
        )

        if status_filter:
            query = query.filter(Invoice.status == status_filter)

        invoices = (
            query.group_by(
                Invoice.invoice_id,
                Invoice.account_id,
                Invoice.sales_rep_id,
                Invoice.tax_rate,
                Invoice.tax_amount,
                Invoice.discount_percent,
                Invoice.discount_amount,
                Invoice.final_total,
                Invoice.status,
                Invoice.date_created,
                Invoice.date_updated,
                Invoice.due_date,
                payment_totals.c.total_paid
            )
            .all()
        )

        result = []
        for inv in invoices:
            result.append({
                "invoice_id": inv.invoice_id,
                "account_id": inv.account_id,
                "sales_rep_id": inv.sales_rep_id,
                "tax_rate": float(inv.tax_rate or 0),
                "tax_amount": float(inv.tax_amount or 0),
                "discount_percent": float(inv.discount_percent or 0),
                "discount_amount": float(inv.discount_amount or 0),
                "final_total": float(inv.final_total or 0),
                "status": inv.status,
                "date_created": inv.date_created.strftime('%Y-%m-%d') if inv.date_created else None,
                "date_updated": inv.date_updated.strftime('%Y-%m-%d') if inv.date_updated else None,
                "due_date": inv.due_date.strftime('%Y-%m-%d') if inv.due_date else None,
                "commission_amount": float(inv.commission_amount or 0),
                "total_paid": float(inv.total_paid or 0),
            })

        return jsonify(result), 200

    except Exception as e:
        print(f"❌ Error fetching invoices by account: {e}")
        return jsonify({"error": "Failed to fetch invoices", "details": str(e)}), 500
    
# Fetch invoice by status
@invoice_bp.route("/status/<string:status>", methods=["GET"])
def get_invoices_by_status(status):
    try:
        invoices = Invoice.query.filter(Invoice.status == status).all()
        return jsonify([
            {
                "invoice_id": inv.invoice_id,
                "account_id": inv.account_id,
                "final_total": float(inv.final_total or 0),
                "status": inv.status,
                "sales_rep_id": inv.sales_rep_id,
                "due_date": inv.due_date.strftime('%Y-%m-%d') if inv.due_date else None
            } for inv in invoices
        ]), 200
    except Exception as e:
        print(f"❌ Error fetching invoices by status: {e}")
        return jsonify({"error": str(e)}), 500


# Validate Invoice Belongs to Account
@invoice_bp.route('/validate/<int:account_id>/<int:invoice_id>', methods=["GET"])
def validate_invoice_for_account(account_id, invoice_id):
    try:
        # Query invoice by ID and check if it belongs to the account
        invoice = Invoice.query.filter_by(account_id=account_id, invoice_id=invoice_id).first()

        if invoice:
            return jsonify({"valid": True}), 200
        else:
            return jsonify({"valid": False, "error": "Invoice does not belong to the account"}), 404

    except Exception as e:
        print(f"❌ Error validating invoice for account: {str(e)}")
        return jsonify({"error": "An error occurred while validating the invoice", "details": str(e)}), 500


# Update Invoice (SINGLE) API
@invoice_bp.route("/<int:invoice_id>", methods=["PUT"])
def update_invoice(invoice_id):
    data = request.get_json()
    invoice = Invoice.query.get_or_404(invoice_id)
    before_data = _serialize_invoice(invoice)

    invoice.tax_rate = data.get("tax_rate", invoice.tax_rate)
    invoice.discount_percent = data.get("discount_percent", invoice.discount_percent)
    invoice.sales_rep_id = data.get("sales_rep_id", invoice.sales_rep_id)
    invoice.date_updated = datetime.now(central)

    due_date = data.get("due_date")
    if due_date:
        try:
            invoice.due_date = datetime.strptime(due_date, "%Y-%m-%d")
        except ValueError:
            print("⚠️ Invalid due date format")

    services_data = data.get("services", [])
    existing_services = {s.invoice_service_id: s for s in invoice.invoice_services}
    received_service_ids = set()

    service_total = 0
    service_discount_total = 0

    for s in services_data:
        quantity = s["quantity"]
        price_per_unit = float(s["price_per_unit"])
        discount_percent = float(s.get("discount_percent") or 0)
        discount_total = price_per_unit * quantity * discount_percent
        total_price = price_per_unit * quantity - discount_total

        service_total += price_per_unit * quantity
        service_discount_total += discount_total

        invoice_service_id = s.get("invoice_service_id")
        if invoice_service_id and invoice_service_id in existing_services:
            received_service_ids.add(invoice_service_id)
            existing = existing_services[invoice_service_id]
            existing.quantity = quantity
            existing.price_per_unit = price_per_unit
            existing.discount_percent = discount_percent
            existing.discount_total = discount_total
            existing.total_price = total_price
        else:
            new_service = InvoiceServices(
                invoice_id=invoice_id,
                service_id=s["service_id"],
                quantity=quantity,
                price_per_unit=price_per_unit,
                discount_percent=discount_percent,
                discount_total=discount_total,
                total_price=total_price,
            )
            db.session.add(new_service)

    to_delete_ids = set(existing_services.keys()) - received_service_ids
    print("🗑️ Deleting InvoiceService IDs:", to_delete_ids)
    for invoice_service_id in to_delete_ids:
        to_delete = existing_services[invoice_service_id]
        db.session.delete(to_delete)

    invoice_discount_amount = (service_total - service_discount_total) * float(invoice.discount_percent or 0)
    subtotal_after_discounts = service_total - service_discount_total - invoice_discount_amount
    tax_amount = subtotal_after_discounts * float(invoice.tax_rate or 0)
    final_total = subtotal_after_discounts + tax_amount

    invoice.discount_amount = invoice_discount_amount
    invoice.tax_amount = tax_amount
    invoice.final_total = final_total

    # Recalculate status using payment records
    payments = Payment.query.filter_by(invoice_id=invoice.invoice_id).all()
    paid_total = sum(p.total_paid for p in payments)
    today = datetime.now(central).date()
    due = invoice.due_date if invoice.due_date else None

    if paid_total >= final_total:
        invoice.status = "Paid"
    elif paid_total == 0:
        invoice.status = "Pending"
    elif due and today > due:
        invoice.status = "Past Due"
    else:
        invoice.status = "Partial"

    create_notification(
        user_id=invoice.sales_rep_id,
        notif_type="invoice_updated",
        title="Invoice updated",
        message=f"Invoice #{invoice.invoice_id} updated",
        link=f"/invoice/{invoice.invoice_id}",
        source_type="invoice",
        source_id=invoice.invoice_id,
    )
    create_audit_log(
        entity_type="invoice",
        entity_id=invoice.invoice_id,
        action="update",
        user_id=data.get("actor_user_id"),
        user_email=data.get("actor_email"),
        before_data=before_data,
        after_data=_serialize_invoice(invoice),
        account_id=invoice.account_id,
        invoice_id=invoice.invoice_id,
    )
    db.session.commit()
    return jsonify({
        "message": "Invoice updated successfully",
        "final_total": float(final_total),
        "status": invoice.status
    }), 200



# DELETE invoice service
@invoice_bp.route("/invoice_services/<int:invoice_service_id>", methods=["DELETE"])
def delete_invoice_service(invoice_service_id):
    service = InvoiceServices.query.get(invoice_service_id)
    if not service:
        return jsonify({"error": "Invoice service not found"}), 404

    print(f"🧼 Deleting InvoiceService #{invoice_service_id}")  # Debug logging
    db.session.delete(service)
    db.session.commit()
    return jsonify({"message": "Invoice service deleted successfully"}), 200


# Delete Invoice (SINGLE) API
# @invoice_bp.route("/invoices/<int:invoice_id>", methods=["DELETE"])
@invoice_bp.route("/<int:invoice_id>", methods=["DELETE"])
def delete_invoice(invoice_id):
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    before_data = _serialize_invoice(invoice)
    db.session.delete(invoice)
    create_audit_log(
        entity_type="invoice",
        entity_id=invoice_id,
        action="delete",
        user_id=request.args.get("actor_user_id", type=int),
        user_email=request.args.get("actor_email"),
        before_data=before_data,
        after_data=None,
        account_id=invoice.account_id,
        invoice_id=invoice_id,
    )
    db.session.commit()
    return jsonify({"message": "Invoice deleted successfully"}), 200



@invoice_bp.route("", methods=["POST"])
def create_invoice():
    data = request.json
    central = pytz.timezone("US/Central")

    # Extract invoice-level data
    tax_rate = Decimal(str(data.get("tax_rate", 0)))
    invoice_discount_percent = Decimal(str(data.get("discount_percent", 0)))

    # Create invoice (initially without totals)
    new_invoice = Invoice(
        account_id=data["account_id"],
        sales_rep_id=data["sales_rep_id"],
        tax_rate=tax_rate,
        discount_percent=invoice_discount_percent,
        due_date=datetime.strptime(data["due_date"], "%Y-%m-%d"),
        date_created=datetime.now(central),
        date_updated=datetime.now(central),
    )
    db.session.add(new_invoice)
    db.session.flush()

    pipeline = InvoicePipeline(
        invoice_id=new_invoice.invoice_id,
        current_stage="order_placed",
        start_date=(new_invoice.date_created.date() if new_invoice.date_created else datetime.now(central).date()),
        order_placed_at=new_invoice.date_created or datetime.now(central),
    )
    db.session.add(pipeline)
    db.session.flush()

    actor_user_id = data.get("actor_user_id") or data.get("created_by") or data.get("user_id") or new_invoice.sales_rep_id
    db.session.add(InvoicePipelineHistory(
        invoice_id=new_invoice.invoice_id,
        stage="order_placed",
        action="status_change",
        note="Order placed",
        actor_user_id=actor_user_id,
    ))

    # Totals we’ll calculate from services
    subtotal = Decimal("0.00")
    service_discount_total = Decimal("0.00")

    # Add services to invoice
    for s in data["services"]:
        price = Decimal(str(s["price_per_unit"]))
        discount_percent = Decimal(str(s.get("discount_percent", 0)))
        quantity = int(s["quantity"])
        discount_total = price * quantity * discount_percent
        total_price = price * quantity - discount_total

        subtotal += price * quantity
        service_discount_total += discount_total

        invoice_service = InvoiceServices(
            invoice_id=new_invoice.invoice_id,
            service_id=s["service_id"],
            quantity=quantity,
            price_per_unit=price,
            discount_percent=discount_percent,
            discount_total=discount_total,
            total_price=total_price,
        )
        db.session.add(invoice_service)

    # Calculate totals
    invoice_discount_amount = (subtotal - service_discount_total) * invoice_discount_percent
    taxable_amount = subtotal - service_discount_total - invoice_discount_amount
    tax_amount = taxable_amount * tax_rate
    final_total = taxable_amount + tax_amount

    # Set default status
    status = "Pending" if final_total > 0 else "Paid"

    # Update invoice fields now that we have totals
    new_invoice.tax_amount = round(tax_amount, 2)
    new_invoice.discount_amount = round(invoice_discount_amount, 2)
    new_invoice.final_total = round(final_total, 2)
    new_invoice.status = status

    create_notification(
        user_id=new_invoice.sales_rep_id,
        notif_type="invoice_created",
        title="New invoice created",
        message=f"Invoice #{new_invoice.invoice_id} created",
        link=f"/invoice/{new_invoice.invoice_id}",
        source_type="invoice",
        source_id=new_invoice.invoice_id,
    )
    create_audit_log(
        entity_type="invoice",
        entity_id=new_invoice.invoice_id,
        action="create",
        user_id=actor_user_id,
        user_email=data.get("actor_email"),
        after_data=_serialize_invoice(new_invoice),
        account_id=new_invoice.account_id,
        invoice_id=new_invoice.invoice_id,
    )
    db.session.commit()

    return jsonify({"success": True, "invoice_id": new_invoice.invoice_id}), 201



# Get Payment Methods
@invoice_bp.route("/payment_methods", methods=["GET"])
def get_payment_methods():
    methods = PaymentMethods.query.all()
    result = [
        {"method_id": method.method_id, "method_name": method.method_name}
        for method in methods
    ]
    return jsonify(result), 200

# Create New Payment Method
@invoice_bp.route("/payment_methods", methods=["POST"])
def create_payment_method():
    data = request.json
    method_name = data.get("method_name", "").strip()

    if not method_name:
        return jsonify({"error": "Payment method name is required."}), 400

    # Check for duplicates
    existing = PaymentMethods.query.filter_by(method_name=method_name).first()
    if existing:
        return jsonify({"error": f"Payment method '{method_name}' already exists."}), 409

    new_method = PaymentMethods(method_name=method_name)
    db.session.add(new_method)
    db.session.commit()

    return jsonify({
        "message": f"Payment method '{method_name}' added successfully.",
        "method_id": new_method.method_id
    }), 201


# Log Payment
# @invoice_bp.route("/invoices/<int:invoice_id>/log_payment", methods=["POST"])
@invoice_bp.route("/<int:invoice_id>/log_payment", methods=["POST"])
def log_payment(invoice_id):
    data = request.get_json()
    try:
        actor_user_id = data.get("actor_user_id")
        actor_email = data.get("actor_email")
        if not actor_user_id and data.get("logged_by"):
            logged_by_user = Users.query.filter_by(username=data.get("logged_by")).first()
            if logged_by_user:
                actor_user_id = logged_by_user.user_id
                actor_email = logged_by_user.email

        payment = Payment(
            invoice_id=invoice_id,
            account_id=data["account_id"],
            sales_rep_id=data["sales_rep_id"],
            logged_by=data["logged_by"],
            payment_method=data["payment_method"],
            last_four_payment_method=data.get("last_four_payment_method"),
            total_paid=data["total_paid"],
            date_paid=datetime.now(central),
        )
        db.session.add(payment)
        db.session.flush()
        
        #  Create Commission Record After Payment is Flushed
        rep = Users.query.get(payment.sales_rep_id)
        if rep and rep.receives_commission:
            commission_rate = Decimal(str(rep.commission_rate or 0))
            commission_amount = Decimal(str(payment.total_paid)) * commission_rate

            # Check for existing commission for this rep and invoice
            existing_commission = Commissions.query.filter_by(
                invoice_id=invoice_id,
                sales_rep_id=rep.user_id
            ).first()

            if existing_commission:
                # Accumulate new amount to previous commission
                existing_commission.commission_amount += Decimal(str(commission_amount))
                existing_commission.date_paid = payment.date_paid  # use latest payment date
            else:
                # Create new commission record
                new_commission = Commissions(
                    sales_rep_id=rep.user_id,
                    invoice_id=invoice_id,
                    commission_rate=commission_rate,
                    commission_amount=commission_amount,
                    date_paid=payment.date_paid,
                )
                db.session.add(new_commission)
                
        # Automatically update invoice status
        invoice = Invoice.query.get(invoice_id)
        before_invoice = _serialize_invoice(invoice) if invoice else None
        payments = Payment.query.filter_by(invoice_id=invoice_id).all()

        # Convert all total_paid to Decimal before summing
        total_paid = sum(Decimal(str(p.total_paid)) for p in payments)
        final_total = Decimal(str(invoice.final_total or 0))

        today = datetime.now(central).date()
        due = invoice.due_date if invoice.due_date else None

        if total_paid >= final_total:
            invoice.status = "Paid"
        elif total_paid == 0:
            invoice.status = "Pending"
        elif due and today > due:
            invoice.status = "Past Due"
        else:
            invoice.status = "Partial"

        pipeline = InvoicePipeline.query.get(invoice_id)
        if pipeline:
            if pipeline.current_stage in ("contact_customer", "order_placed", "payment_not_received"):
                pipeline.current_stage = "payment_received"
                pipeline.payment_received_at = pipeline.payment_received_at or datetime.now(central)
                pipeline.updated_at = datetime.now(central)
                db.session.add(InvoicePipelineHistory(
                    invoice_id=invoice_id,
                    stage="payment_received",
                    action="status_change",
                    note="Payment received",
                    actor_user_id=actor_user_id,
                ))
                db.session.add(InvoicePipelineHistory(
                    invoice_id=invoice_id,
                    stage="payment_received",
                    action="email",
                    note="Email sent to contact: payment received update.",
                    actor_user_id=actor_user_id,
                ))
        else:
            pipeline = InvoicePipeline(
                invoice_id=invoice_id,
                current_stage="payment_received",
                start_date=invoice.date_created.date() if invoice and invoice.date_created else today,
                order_placed_at=invoice.date_created if invoice else datetime.now(central),
                payment_received_at=datetime.now(central),
            )
            db.session.add(pipeline)
            db.session.flush()
            db.session.add(InvoicePipelineHistory(
                invoice_id=invoice_id,
                stage="payment_received",
                action="status_change",
                note="Payment received",
                actor_user_id=actor_user_id,
            ))

        create_audit_log(
            entity_type="payment",
            entity_id=payment.payment_id,
            action="create",
            user_id=actor_user_id,
            user_email=actor_email,
            after_data={
                "payment_id": payment.payment_id,
                "invoice_id": payment.invoice_id,
                "account_id": payment.account_id,
                "sales_rep_id": payment.sales_rep_id,
                "logged_by": payment.logged_by,
                "payment_method": payment.payment_method,
                "last_four_payment_method": payment.last_four_payment_method,
                "total_paid": float(payment.total_paid or 0),
                "date_paid": payment.date_paid.isoformat() if payment.date_paid else None,
            },
            account_id=payment.account_id,
            invoice_id=payment.invoice_id,
        )

        after_invoice = _serialize_invoice(invoice) if invoice else None
        if before_invoice and after_invoice and before_invoice.get("status") != after_invoice.get("status"):
            create_audit_log(
                entity_type="invoice",
                entity_id=invoice.invoice_id,
                action="update_status",
                user_id=actor_user_id,
                user_email=actor_email,
                before_data=before_invoice,
                after_data=after_invoice,
                account_id=invoice.account_id,
                invoice_id=invoice.invoice_id,
            )

        db.session.commit()

        user = Users.query.get(payment.logged_by)

        return jsonify({
            "message": "Payment logged",
            "payment_id": payment.payment_id,
            "payment_method": payment.payment_method,
            "last_four_payment_method": payment.last_four_payment_method,
            "total_paid": payment.total_paid,
            "date_paid": payment.date_paid,
            "logged_by": payment.logged_by,
            "logged_by_username": user.username if user else None
        }), 201

    except Exception as e:
        print("❌ Error saving payment:", e)
        return jsonify({"error": str(e)}), 500
    
