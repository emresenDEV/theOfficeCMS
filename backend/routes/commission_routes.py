from flask import Blueprint, request, jsonify
from models import Commissions
from database import db

commission_bp = Blueprint("commission", __name__)

def get_commissions():
    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    commissions = Commissions.query.filter_by(user_id=user_id).all()

    return jsonify([
        {
            "commission_id": com.commission_id,
            "invoice_id": com.invoice_id,
            "commission_amount": float(com.commission_amount),
            "date_paid": com.date_paid.strftime("%Y-%m-%d") if com.date_paid else "N/A",
        } for com in commissions
    ])

    # 🗓 Filter commissions based on request
    # query = Commissions.query.filter(Commissions.user_id == user_id)

    # if filter_by == "month":
    #     start_date = datetime(datetime.now().year, datetime.now().month, 1)
    #     query = query.filter(Commissions.date_paid >= start_date)
    # elif filter_by == "year":
    #     start_date = datetime(datetime.now().year, 1, 1)
    #     query = query.filter(Commissions.date_paid >= start_date)

    # commissions = query.all()

    # return jsonify([
    #     {
    #         "id": com.commission_id,
    #         "invoice_id": com.invoice_id,
    #         "commission_amount": float(com.commission_amount),
    #         "date_paid": com.date_paid.strftime("%Y-%m-%d") if com.date_paid else "N/A",
    #     }
    #     for com in commissions
    # ]), 200
