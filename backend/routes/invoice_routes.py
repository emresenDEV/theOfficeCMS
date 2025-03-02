from flask import Blueprint, request, jsonify
from models import Invoice, Account, PaymentMethods, InvoiceServices, Service
from flask_cors import cross_origin
from database import db
from datetime import datetime

invoice_bp = Blueprint("invoice", __name__)

# ✅ Update Invoice Status (Pending to Paid, Past Due, etc.)
@invoice_bp.route("/invoices/<int:invoice_id>/update_status", methods=["PUT", "OPTIONS"])
@cross_origin(origin="http://localhost:5174", supports_credentials=True)
def update_invoice_status(invoice_id):
    if request.method == "OPTIONS":
        response = jsonify({"message": "CORS preflight OK"})
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:5174"
        response.headers["Access-Control-Allow-Methods"] = "PUT, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response, 200

    data = request.json
    new_status = data.get("status")

    if not new_status:
        return jsonify({"error": "Status is required"}), 400

    invoice = Invoice.query.get_or_404(invoice_id)
    invoice.status = new_status
    db.session.commit()

    return jsonify({"message": f"Invoice {invoice_id} status updated to {new_status}"}), 200


# Invoices (PLURAL) API
@invoice_bp.route("/", methods=["GET"]) 
def get_invoices():
    today = datetime.now().date()
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    
    invoices = Invoice.query.filter_by(sales_rep_id=sales_rep_id).all() if sales_rep_id else Invoice.query.all()

    # Find invoices that are past due and not paid
    overdue_invoices = Invoice.query.filter(
        Invoice.status != "Paid",
        Invoice.due_date < today
    ).all()

    # Update overdue invoices
    for invoice in overdue_invoices:
        invoice.status = "Past Due"
    db.session.commit()

    return jsonify([
        {
            "invoice_id": inv.invoice_id,
            "account_id": inv.account_id,
            "final_total": float(inv.final_total),
            "status": inv.status,
            "sales_rep_id": inv.sales_rep_id,
            "due_date": inv.due_date.strftime('%Y-%m-%d') if inv.due_date else None
        } for inv in invoices
    ]), 200

# ✅ Fetch Invoice by ID (Include Services)
@invoice_bp.route("/invoice/<int:invoice_id>", methods=["GET"])
def get_invoice_by_id(invoice_id):
    invoice = Invoice.query.get_or_404(invoice_id)

    # Fetch related services from invoice_services
    services = (
        db.session.query(InvoiceServices, Service)
        .join(Service, InvoiceServices.service_id == Service.service_id)
        .filter(InvoiceServices.invoice_id == invoice_id)
        .all()
    )

    service_list = [
        {
            "service_id": service.service_id,
            "service_name": service.service_name,
            "quantity": invoice_service.quantity,
            "price": float(invoice_service.price),
            "total_price": float(invoice_service.total_price)
        } for invoice_service, service in services
    ]

    return jsonify({
        "invoice_id": invoice.invoice_id,
        "account_id": invoice.account_id,
        "sales_rep_id": invoice.sales_rep_id,
        "status": invoice.status,
        "tax_rate": float(invoice.tax_rate),
        "tax_amount": float(invoice.tax_amount),
        "discount_percent": float(invoice.discount_percent),
        "discount_amount": float(invoice.discount_amount),
        "final_total": float(invoice.final_total),
        "paid": invoice.paid,
        "payment_method": invoice.payment_method,
        "total_paid": float(invoice.total_paid) if invoice.total_paid else 0.0,
        "date_paid": invoice.date_paid.strftime("%Y-%m-%d") if invoice.date_paid else None,
        "due_date": invoice.due_date.strftime("%Y-%m-%d") if invoice.due_date else None,
        "services": service_list
    }), 200

    
# ✅ Fetch invoices by account ID
@invoice_bp.route("/account/<int:account_id>", methods=["GET"])
def get_invoices_by_account(account_id):
    invoices = Invoice.query.filter_by(account_id=account_id).all()

    if not invoices:
        return jsonify([]), 200  # ✅ Return empty list instead of 404 error

    return jsonify([
        {
            "invoice_id": inv.invoice_id,
            "account_id": inv.account_id,
            "amount": float(inv.amount),
            "final_total": float(inv.final_total) if inv.final_total is not None else 0.00,
            "status": inv.status,
            "sales_rep_id": inv.sales_rep_id,
            "due_date": inv.due_date.strftime('%Y-%m-%d') if inv.due_date else None,
            "payment_method": inv.payment_method if inv.payment_method else None,
            "date_created": inv.date_created.strftime("%Y-%m-%d") if inv.date_created else None
        } for inv in invoices
    ]), 200


# ✅ Validate Invoice Belongs to Account
@invoice_bp.route('/validate/<int:account_id>/<int:invoice_id>', methods=["GET"])
def validate_invoice_for_account(account_id, invoice_id):
    try:
        # ✅ Query invoice by ID and check if it belongs to the account
        invoice = Invoice.query.filter_by(account_id=account_id, invoice_id=invoice_id).first()

        if invoice:
            return jsonify({"valid": True}), 200
        else:
            return jsonify({"valid": False, "error": "Invoice does not belong to the account"}), 404

    except Exception as e:
        print(f"❌ Error validating invoice for account: {str(e)}")
        return jsonify({"error": "An error occurred while validating the invoice", "details": str(e)}), 500


# Update Invoice (SINGLE) API
# @invoice_bp.route("/invoices/invoice/<int:invoice_id>", methods=["PUT", "OPTIONS"])
@invoice_bp.route("/invoices/<int:invoice_id>", methods=["PUT", "OPTIONS"])
@cross_origin(origin="http://localhost:5174", supports_credentials=True)
def update_invoice(invoice_id):
    invoice = Invoice.query.get_or_404(invoice_id)
    data = request.json

    invoice.status = data.get("status", invoice.status)
    invoice.tax_rate = data.get("tax_rate", invoice.tax_rate)
    invoice.discount_percent = data.get("discount_percent", invoice.discount_percent)
    invoice.discount_amount = data.get("discount_amount", invoice.discount_amount)
    invoice.final_total = data.get("final_total", invoice.final_total)
    invoice.paid = data.get("paid", invoice.paid)
    invoice.payment_method = data.get("payment_method", invoice.payment_method)
    invoice.total_paid = data.get("total_paid", invoice.total_paid)
    invoice.date_paid = datetime.strptime(data["date_paid"], "%Y-%m-%d") if "date_paid" in data else invoice.date_paid
    invoice.due_date = datetime.strptime(data["due_date"], "%Y-%m-%d") if "due_date" in data else invoice.due_date
    invoice.sales_rep_id = data.get("sales_rep_id", invoice.sales_rep_id)

    # ✅ Updating Services
    if "services" in data:
        InvoiceServices.query.filter_by(invoice_id=invoice_id).delete()
        for service in data["services"]:
            new_service = InvoiceServices(
                invoice_id=invoice_id,
                service_id=service["service_id"],
                quantity=service["quantity"],
                price=service["price"],
                total_price=service["total_price"]
            )
            db.session.add(new_service)

    db.session.commit()
    return jsonify({"message": "Invoice updated successfully"}), 200

# Delete Invoice (SINGLE) API
@invoice_bp.route("/invoices/<int:invoice_id>", methods=["DELETE"])
def delete_invoice(invoice_id):
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    db.session.delete(invoice)
    db.session.commit()
    return jsonify({"message": "Invoice deleted successfully"}), 200


# GET Paid Invoices API
@invoice_bp.route("/invoices/paid", methods=["GET"])
def get_paid_invoices():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    paid_invoices = Invoice.query.filter(
        Invoice.sales_rep_id == sales_rep_id,
        Invoice.status == "Paid"
    ).all()

    return jsonify([
        {
            "invoice_id": inv.invoice_id,
            "account_id": inv.account_id,
            "amount": float(inv.amount),
            "date_paid": inv.date_paid.strftime('%Y-%m-%d') if inv.date_paid else "N/A"
        } for inv in paid_invoices
    ]), 200


# GET Unpaid Invoices API
@invoice_bp.route("/invoices/unpaid", methods=["GET"])
def get_unpaid_invoices():
    sales_rep_id = request.args.get("user_id")
    if not sales_rep_id:
        return jsonify({"error": "User ID is required"}), 400

    unpaid_invoices = (
        db.session.query(Invoice, Account.business_name)
        .join(Account, Invoice.account_id == Account.account_id)
        .filter(Invoice.user_id == sales_rep_id, Invoice.status == "Unpaid")
        .all()
)

    return jsonify([
        {
            "invoice_id": inv.invoice_id,
            "account_id": inv.account_id,
            "account_name": account_name,
            "amount": float(inv.amount),
            "due_date": inv.due_date.strftime('%Y-%m-%d') if inv.due_date else "N/A",
        } for inv, account_name in unpaid_invoices
    ])

# GET Past Due Invoices API
@invoice_bp.route("/invoices/past_due", methods=["GET"])
def get_past_due_invoices():
    sales_rep_id = request.args.get("sales_rep_id")
    if not sales_rep_id:
        return jsonify({"error": "User ID is required"}), 400

    today = datetime.utcnow().date()
    past_due_invoices = db.session.query(Invoice, Account.business_name).join(Account, Invoice.account_id == Account.account_id).filter(
        Invoice.sales_rep_id == sales_rep_id,
        Invoice.due_date < today,
        Invoice.status != "Paid"
    ).all()

    return jsonify([
        {
            "invoice_id": inv.invoice_id,
            "account_id": inv.account_id,
            "account_name": account_name,
            "amount": float(inv.amount),
            "due_date": inv.due_date.strftime('%Y-%m-%d') if inv.due_date else "N/A",
        } for inv, account_name in past_due_invoices
    ])

# Create Invoices API
@invoice_bp.route("/invoices", methods=["POST"])
def create_invoice():
    data = request.json

    new_invoice = Invoice(
        account_id=data["account_id"],
        sales_rep_id=data.get("sales_rep_id"),
        tax_rate=data.get("tax_rate", 0),
        discount_percent=data.get("discount_percent", 0),
        status="Unpaid",
        paid=False,
        due_date=datetime.strptime(data["due_date"], "%Y-%m-%d"),
        date_created=datetime.utcnow(),
        date_updated=datetime.utcnow(),
    )

    db.session.add(new_invoice)
    db.session.commit()

    # Add multiple services
    for service in data["services"]:
        invoice_service = InvoiceServices(
            invoice_id=new_invoice.invoice_id,
            service_id=service["service_id"],
            quantity=service["quantity"],
            price=service["price"],
            total_price=service["quantity"] * service["price"],
        )
        db.session.add(invoice_service)

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
