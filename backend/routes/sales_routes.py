from flask import Blueprint, request, jsonify
from models import Invoice
from database import db
from sqlalchemy.sql import func

sales_bp = Blueprint("sales", __name__)  # ✅ Create a sales blueprint

# ✅ Fetch company-wide monthly sales
@sales_bp.route("/company", methods=["GET"])
def get_company_sales():
    """Retrieve total monthly sales for the entire company"""
    monthly_sales = (
        db.session.query(
            func.extract('month', Invoice.date_created).label("month"),
            func.sum(Invoice.amount).label("total_sales")
        )
        .group_by("month")
        .order_by("month")
        .all()
    )

    # 🔹 Convert query results to a full 12-month array
    sales_data = [0] * 12
    for month, total_sales in monthly_sales:
        sales_data[int(month) - 1] = float(total_sales)

    return jsonify(sales_data), 200

# ✅ Fetch sales for a specific user
@sales_bp.route("/user", methods=["GET"])
def get_user_sales():
    """Retrieve monthly sales for a specific user"""
    user_id = request.args.get("user_id", type=int)
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    user_sales = (
        db.session.query(
            func.extract('month', Invoice.date_created).label("month"),
            func.sum(Invoice.amount).label("total_sales")
        )
        .filter(Invoice.user_id == user_id)
        .group_by("month")
        .order_by("month")
        .all()
    )

    # 🔹 Convert query results to a full 12-month array
    sales_data = [0] * 12
    for month, total_sales in user_sales:
        sales_data[int(month) - 1] = float(total_sales)

    return jsonify(sales_data), 200
