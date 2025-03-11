from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from models import Invoice, Users, Branches
from database import db
from sqlalchemy.sql import func
from datetime import datetime

sales_bp = Blueprint("sales", __name__)  # ✅ Create a sales blueprint

## ✅ Fetch company-wide monthly sales filtered by year
@sales_bp.route("/company", methods=["GET"])
@cross_origin(origin="http://localhost:5174", supports_credentials=True)
def get_company_sales():
    """Retrieve total monthly sales for the entire company"""
    year = request.args.get("year", type=int)

    query = (
        db.session.query(
            func.extract('month', Invoice.date_paid).label("month"),
            func.sum(Invoice.amount).label("total_sales")
        )
    )

    if year:
        query = query.filter(func.extract('year', Invoice.date_paid) == year)

    query = query.group_by("month").order_by("month").all()

    sales_data = [0] * 12
    for month, total_sales in query:
        sales_data[int(month) - 1] = float(total_sales)

    return jsonify(sales_data), 200



# ✅ Fetch sales for a specific user
@sales_bp.route("/user", methods=["GET"])
@cross_origin(origin="http://localhost:5174", supports_credentials=True)
def get_user_sales():
    """Retrieve monthly sales for a specific user."""
    sales_rep_id = request.args.get("user_id", type=int)
    year = request.args.get("year", type=int, default=datetime.now().year)

    if not sales_rep_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        print(f"🔍 Fetching sales for sales_rep_id: {sales_rep_id} in year {year}")

        user_sales = (
            db.session.query(
                func.extract('month', Invoice.date_paid).label("month"),
                func.sum(Invoice.amount).label("total_sales")
            )
            .filter(Invoice.sales_rep_id == sales_rep_id)
            .filter(func.extract('year', Invoice.date_paid) == year)
            .filter(Invoice.date_paid <= datetime.now())  # ✅ Exclude future invoices
            .group_by("month")
            .order_by("month")
            .all()
        )

        sales_data = [0] * 12
        for month, total_sales in user_sales:
            sales_data[int(month) - 1] = float(total_sales)

        return jsonify(sales_data), 200

    except Exception as e:
        print(f"❌ Error fetching sales for user {sales_rep_id}: {str(e)}")
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500


# ✅ Fetch branch-specific sales filtered by year
@sales_bp.route("/branch", methods=["GET"])
@cross_origin(origin="http://localhost:5174", supports_credentials=True)
def get_branch_sales():
    """Retrieve total monthly sales grouped by branch filtered by year"""
    year = request.args.get("year", type=int)

    if not year:
        return jsonify({"error": "Year is required"}), 400

    print(f"🔍 Fetching branch sales for year {year}")

    branch_sales = (
        db.session.query(
            Branches.branch_name,
            func.extract('month', Invoice.date_paid).label("month"),
            func.sum(Invoice.amount).label("total_sales")
        )
        .join(Users, Users.user_id == Invoice.sales_rep_id)
        .join(Branches, Users.branch_id == Branches.branch_id)
        .filter(func.extract('year', Invoice.date_paid) == year)  # ✅ Filter by year
        .group_by(Branches.branch_name, func.extract('month', Invoice.date_paid))  # ✅ FIXED
        .order_by(func.extract('month', Invoice.date_paid))  # ✅ FIXED ORDER BY
        .all()
    )

    sales_data = {}
    for branch_name, month, total_sales in branch_sales:
        if branch_name not in sales_data:
            sales_data[branch_name] = [0] * 12
        sales_data[branch_name][int(month) - 1] = float(total_sales)

    return jsonify(sales_data), 200



# ✅ Fetch sales for all users in a branch filtered by year
@sales_bp.route("/branch-users", methods=["GET"])
@cross_origin(origin="http://localhost:5174", supports_credentials=True)
def get_branch_users_sales():
    """Retrieve sales of all users in a branch for a specific year."""
    branch_id = request.args.get("branch_id", type=int)
    year = request.args.get("year", type=int, default=datetime.now().year)

    if not branch_id:
        return jsonify({"error": "Branch ID is required"}), 400

    try:
        print(f"🔍 API Called with: branch_id={branch_id}, year={year}")

        user_sales = (
            db.session.query(
                Users.first_name,
                Users.last_name,
                Users.role_id,
                Users.branch_id,
                func.extract('month', Invoice.date_paid).label("month"),
                func.sum(Invoice.amount).label("total_sales")
            )
            .join(Invoice, Users.user_id == Invoice.sales_rep_id)
            .filter(Users.branch_id == branch_id)
            .filter(func.extract('year', Invoice.date_paid) == year)
            .filter(Invoice.date_paid <= datetime.now())  # ✅ Exclude future invoices
            .group_by(
                Users.first_name,
                Users.last_name,
                Users.role_id,
                Users.branch_id,
                "month"
            )
            .order_by("month")
            .all()
        )

        formatted_sales = {}
        for first_name, last_name, role_id, branch_id, month, total_sales in user_sales:
            full_name = f"{first_name} {last_name}"
            if full_name not in formatted_sales:
                formatted_sales[full_name] = {
                    "role_id": role_id,
                    "branch_id": branch_id,
                    "sales": [0] * 12  # Default array for 12 months
                }
            formatted_sales[full_name]["sales"][int(month) - 1] = float(total_sales)

        return jsonify(formatted_sales), 200

    except Exception as e:
        print(f"❌ Error fetching branch user sales: {str(e)}")
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
