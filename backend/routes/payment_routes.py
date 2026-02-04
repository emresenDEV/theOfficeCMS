from flask import Blueprint, request, jsonify
from database import db
from models import Payment, Users, Account, Invoice, PaymentMethods
from datetime import datetime
from audit import create_audit_log

payment_bp = Blueprint("payment", __name__, url_prefix="/payment")

# List payments (admin/overview)
@payment_bp.route("", methods=["GET"])
@payment_bp.route("/", methods=["GET"])
def get_payments():
    account_id = request.args.get("account_id", type=int)
    invoice_id = request.args.get("invoice_id", type=int)
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    limit = request.args.get("limit", type=int) or 200

    query = Payment.query
    if account_id:
        query = query.filter(Payment.account_id == account_id)
    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)
    if sales_rep_id:
        query = query.filter(Payment.sales_rep_id == sales_rep_id)

    payments = query.order_by(Payment.date_paid.desc()).limit(limit).all()

    results = []
    for payment in payments:
        account = Account.query.get(payment.account_id) if payment.account_id else None
        invoice = Invoice.query.get(payment.invoice_id) if payment.invoice_id else None
        method = PaymentMethods.query.get(payment.payment_method) if payment.payment_method else None
        results.append({
            "payment_id": payment.payment_id,
            "invoice_id": payment.invoice_id,
            "account_id": payment.account_id,
            "account_name": account.business_name if account else None,
            "invoice_status": invoice.status if invoice else None,
            "sales_rep_id": payment.sales_rep_id,
            "logged_by": payment.logged_by,
            "payment_method": payment.payment_method,
            "payment_method_name": method.method_name if method else None,
            "last_four_payment_method": payment.last_four_payment_method,
            "total_paid": float(payment.total_paid or 0),
            "date_paid": payment.date_paid.isoformat() if payment.date_paid else None,
        })

    return jsonify(results), 200

# Update a payment
@payment_bp.route("/<int:payment_id>", methods=["PUT"])
def update_payment(payment_id):
    payment = Payment.query.get_or_404(payment_id)
    data = request.get_json()

    try:
        before_data = {
            "payment_id": payment.payment_id,
            "invoice_id": payment.invoice_id,
            "account_id": payment.account_id,
            "sales_rep_id": payment.sales_rep_id,
            "logged_by": payment.logged_by,
            "payment_method": payment.payment_method,
            "last_four_payment_method": payment.last_four_payment_method,
            "total_paid": float(payment.total_paid or 0),
            "date_paid": payment.date_paid.isoformat() if payment.date_paid else None,
        }
        payment.payment_method = data.get("payment_method", payment.payment_method)
        payment.last_four_payment_method = data.get("last_four_payment_method", payment.last_four_payment_method)
        payment.total_paid = float(data.get("total_paid", payment.total_paid))

        date_str = data.get("date_paid")
        if date_str:
            try:
                # Try ISO format with T
                payment.date_paid = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S")
            except ValueError:
                try:
                    # Fallback to space format if T fails
                    payment.date_paid = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    return jsonify({"error": f"Invalid date format: {date_str}"}), 400

        payment.logged_by = data.get("logged_by", payment.logged_by)

        create_audit_log(
            entity_type="payment",
            entity_id=payment.payment_id,
            action="update",
            user_id=data.get("actor_user_id"),
            user_email=data.get("actor_email"),
            before_data=before_data,
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
        db.session.commit()

        user = Users.query.filter_by(username=payment.logged_by).first()

        return jsonify({
            "message": "Payment updated successfully",
            "payment_id": payment.payment_id,
            "payment_method": payment.payment_method,
            "last_four_payment_method": payment.last_four_payment_method,
            "total_paid": payment.total_paid,
            "date_paid": payment.date_paid,
            "logged_by_username": user.username if user else None,

        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400



# Delete a payment
@payment_bp.route("/<int:payment_id>", methods=["DELETE"])
def delete_payment(payment_id):
    payment = Payment.query.get_or_404(payment_id)
    try:
        before_data = {
            "payment_id": payment.payment_id,
            "invoice_id": payment.invoice_id,
            "account_id": payment.account_id,
            "sales_rep_id": payment.sales_rep_id,
            "logged_by": payment.logged_by,
            "payment_method": payment.payment_method,
            "last_four_payment_method": payment.last_four_payment_method,
            "total_paid": float(payment.total_paid or 0),
            "date_paid": payment.date_paid.isoformat() if payment.date_paid else None,
        }
        db.session.delete(payment)
        create_audit_log(
            entity_type="payment",
            entity_id=payment.payment_id,
            action="delete",
            user_id=request.args.get("actor_user_id", type=int),
            user_email=request.args.get("actor_email"),
            before_data=before_data,
            after_data=None,
            account_id=payment.account_id,
            invoice_id=payment.invoice_id,
        )
        db.session.commit()
        return jsonify({"message": "Payment deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
