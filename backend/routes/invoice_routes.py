from flask import Blueprint, request, jsonify
from models import Invoice
from database import db

invoice_bp = Blueprint("invoice", __name__)

# ----------------------------
# 📌 INVOICES API
# ----------------------------
# Invoices API
@app.route("/invoices", methods=["GET"])
def get_invoices():
    user_id = request.args.get("user_id")

    if user_id:
        invoices = Invoice.query.filter_by(sales_user_id=user_id).all()
    else:
        invoices = Invoice.query.all()

    return jsonify([
        {
            "invoice_id": inv.invoice_id,
            "account_id": inv.account_id,
            "amount": float(inv.amount),
            "status": inv.status,
            "sales_user_id": inv.sales_user_id,
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

    paid_invoices = Invoice.query.filter(
        Invoice.sales_employee_id == user_id,
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
@app.route("/invoices/unpaid", methods=["GET"])
def get_unpaid_invoices():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    unpaid_invoices = db.session.query(Invoice, Account.business_name).join(Account, Invoice.account_id == Account.account_id).filter(
        Invoice.sales_employee_id == user_id,
        Invoice.status == "Unpaid"
    ).all()

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
@app.route("/invoices/past_due", methods=["GET"])
def get_past_due_invoices():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    today = datetime.utcnow().date()
    past_due_invoices = db.session.query(Invoice, Account.business_name).join(Account, Invoice.account_id == Account.account_id).filter(
        Invoice.sales_employee_id == user_id,
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