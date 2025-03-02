from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from models import Invoice, Users
from database import db
from sqlalchemy.sql import func

sales_bp = Blueprint("sales", __name__)  # ✅ Create a sales blueprint

# ✅ Fetch company-wide monthly sales
@cross_origin(origin="http://localhost:5174", supports_credentials=True)
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
@cross_origin(origin="http://localhost:5174", supports_credentials=True)
def get_user_sales():
    """Retrieve monthly sales for a specific user"""
    sales_rep_id = request.args.get("user_id", type=int)

    if not sales_rep_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        print(f"🔍 Fetching sales for sales_rep_id: {sales_rep_id}")

        # ✅ Fix: Use the correct filtering condition
        user_sales = (
            db.session.query(
                func.extract('month', Invoice.date_created).label("month"),
                func.sum(Invoice.amount).label("total_sales")
            )
            .filter(Invoice.sales_rep_id == sales_rep_id)  # ✅ Correct column reference
            .group_by("month")
            .order_by("month")
            .all()
        )

        print(f"✅ Query executed successfully. Sales data: {user_sales}")

        # 🔹 Convert query results to a full 12-month array
        sales_data = [0] * 12
        for month, total_sales in user_sales:
            sales_data[int(month) - 1] = float(total_sales)

        print(f"📊 Processed Sales Data: {sales_data}")  # Debug log

        return jsonify(sales_data), 200

    except Exception as e:
        print(f"❌ Error fetching sales for user {sales_rep_id}: {str(e)}")
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
