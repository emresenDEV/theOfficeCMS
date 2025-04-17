from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from database import db
from models import db, Payment, Users
from datetime import datetime

payment_bp = Blueprint("payment", __name__, url_prefix="/payment")

# Update a payment
@payment_bp.route("/<int:payment_id>", methods=["PUT", "OPTIONS"])
@cross_origin(origins=[
    "http://localhost:5174",
    "https://theofficecms.com"
], supports_credentials=True)
def update_payment(payment_id):
    if request.method == "OPTIONS":
        origin = request.headers.get("Origin", "https://theofficecms.com")
        if origin not in ["http://localhost:5174", "https://theofficecms.com"]:
            origin = "https://theofficecms.com"

        response = jsonify({"message": "CORS preflight OK"})
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "GET, PUT, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response, 200

    
    payment = Payment.query.get_or_404(payment_id)
    data = request.get_json()

    try:
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
@cross_origin(origins=[
    "http://localhost:5174",
    "https://theofficecms.com"
], supports_credentials=True)
def delete_payment(payment_id):
    payment = Payment.query.get_or_404(payment_id)
    try:
        db.session.delete(payment)
        db.session.commit()
        return jsonify({"message": "Payment deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
