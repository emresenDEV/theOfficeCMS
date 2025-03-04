from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from models import Invoice, Users, Branches
from database import db
from sqlalchemy.sql import func

sales_bp = Blueprint("sales", __name__)  # ✅ Create a sales blueprint

# ✅ Fetch company-wide monthly sales
@sales_bp.route("/company", methods=["GET"])
@cross_origin(origin="http://localhost:5174", supports_credentials=True)
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

# ✅ Fetch sales for a specific branch
@sales_bp.route("/branch", methods=["GET"])
@cross_origin(origin="http://localhost:5174", supports_credentials=True)
def get_branch_sales():
    """Retrieve total monthly sales grouped by branch"""
    branch_id = request.args.get("branch_id", type=int)

    query = (
        db.session.query(
            Branches.branch_name,
            func.extract('month', Invoice.date_created).label("month"),
            func.sum(Invoice.amount).label("total_sales")
        )
        .join(Users, Users.user_id == Invoice.sales_rep_id)
        .join(Branches, Users.branch_id == Branches.branch_id)
        .group_by(Branches.branch_name, "month")
        .order_by("month")
    )

    if branch_id:
        query = query.filter(Users.branch_id == branch_id)

    branch_sales = query.all()

    sales_data = {}
    for branch_name, month, total_sales in branch_sales:
        if branch_name not in sales_data:
            sales_data[branch_name] = [0] * 12
        sales_data[branch_name][int(month) - 1] = float(total_sales)

    return jsonify(sales_data), 200


# ✅ Fetch sales for all users in a branch
@sales_bp.route("/branch-users", methods=["GET"])
@cross_origin(origin="http://localhost:5174", supports_credentials=True)
def get_branch_users_sales():
    """Retrieve sales of all users in the logged-in user's branch"""
    branch_id = request.args.get("branch_id", type=int)

    if not branch_id:
        return jsonify({"error": "Branch ID is required"}), 400

    user_sales = (
        db.session.query(
            Users.first_name,
            Users.last_name,
            func.extract('month', Invoice.date_created).label("month"),
            func.sum(Invoice.amount).label("total_sales")
        )
        .join(Invoice, Users.user_id == Invoice.sales_rep_id)
        .filter(Users.branch_id == branch_id)
        .group_by(Users.user_id, "month")
        .order_by("month")
        .all()
    )

    formatted_sales = {}
    for first_name, last_name, month, total_sales in user_sales:
        full_name = f"{first_name} {last_name}"
        if full_name not in formatted_sales:
            formatted_sales[full_name] = [0] * 12
        formatted_sales[full_name][int(month) - 1] = float(total_sales)

    return jsonify(formatted_sales), 200