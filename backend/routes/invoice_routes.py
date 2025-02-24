from flask import Blueprint, request, jsonify
from models import Invoice, Account
from database import db
from datetime import datetime

invoice_bp = Blueprint("invoice", __name__)


# Invoices (PLURAL) API
@invoice_bp.route("/", methods=["GET"])  # ✅ Correct
def get_invoices():
    user_id = request.args.get("user_id")

    if user_id:
        invoices = Invoice.query.filter_by(user_id=user_id).all()
    else:
        invoices = Invoice.query.all()
    
    if not invoices:
        return jsonify([]), 200

    return jsonify([
        {
            "invoice_id": inv.invoice_id,
            "account_id": inv.account_id,
            "amount": float(inv.amount),
            "status": inv.status,
            "user_id": inv.user_id,
            "due_date": inv.due_date.strftime('%Y-%m-%d') if inv.due_date else None
        } for inv in invoices
    ])


#  GET Invoice (SINGLE) By ID API
@invoice_bp.route("/invoice/<int:invoice_id>", methods=["GET"])
def get_invoice_by_id(invoice_id):
    invoice = Invoice.query.get_or_404(invoice_id)
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    return jsonify({
        "invoice_id": invoice.invoice_id,
        "account_id": invoice.account_id,
        "service": invoice.service,
        "amount": float(invoice.amount),
        "status": invoice.status,
        "due_date": invoice.due_date.strftime("%Y-%m-%d") if invoice.due_date else None,
        "payment_method": invoice.payment_method,
        "date_created": invoice.date_created.strftime("%Y-%m-%d") if invoice.date_created else None,
    }), 200
    
# ✅ Fetch invoices by account ID
@invoice_bp.route("/account/<int:account_id>", methods=["GET"])
def get_invoices_by_account(account_id):
    invoices = Invoice.query.filter_by(account_id=account_id).all()

    if not invoices:
        return jsonify([]), 200  # ✅ Return an empty list instead of a 404 error

    return jsonify([
        {
            "invoice_id": inv.invoice_id,
            "account_id": inv.account_id,
            "service": inv.service,
            "amount": float(inv.amount),
            "final_total": float(inv.final_total) if inv.final_total is not None else 0.00,
            "status": inv.status,
            "user_id": inv.user_id,
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
@invoice_bp.route("/invoices/<int:invoice_id>", methods=["PUT"])
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
        Invoice.user_id == user_id,
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
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    unpaid_invoices = (
        db.session.query(Invoice, Account.business_name)
        .join(Account, Invoice.account_id == Account.account_id)
        .filter(Invoice.user_id == user_id, Invoice.status == "Unpaid")
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
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    today = datetime.utcnow().date()
    past_due_invoices = db.session.query(Invoice, Account.business_name).join(Account, Invoice.account_id == Account.account_id).filter(
        Invoice.user_id == user_id,
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
        service=data["service"],
        amount=data["amount"],
        tax_rate=data.get("tax_rate", 0),
        discount_percent=data.get("discount_percent", 0),
        final_total=(data["amount"] * (1 + data["tax_rate"] / 100)) - (data["amount"] * (data["discount_percent"] / 100)),
        status="Unpaid",
        paid=False,
        due_date=datetime.strptime(data["due_date"], "%Y-%m-%d"),
        user_id=data.get("user_id"),
        date_created=datetime.utcnow(),
        date_updated=datetime.utcnow(),
    )
    db.session.add(new_invoice)
    db.session.commit()
    return jsonify({"success": True, "invoice_id": new_invoice.invoice_id}), 201