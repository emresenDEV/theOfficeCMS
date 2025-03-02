from flask import Blueprint, request, jsonify
from models import Commissions, Invoice, Account
from database import db
from sqlalchemy import func, extract

commission_bp = Blueprint("commission", __name__)

@commission_bp.route("/", methods=["GET"])
def get_commissions():
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    
    commissions = (
        db.session.query(Commissions, Invoice, Account)
        .join(Invoice, Commissions.invoice_id == Invoice.invoice_id)
        .join(Account, Invoice.account_id == Account.account_id)
        .filter(Commissions.sales_rep_id == sales_rep_id)
        .all()
    )

    return jsonify([
        {
            "commission_id": com.commission_id,
            "sales_rep_id": com.sales_rep_id,
            "invoice_id": com.invoice_id,
            "commission_rate": float(com.commission_rate or 0),
            "commission_amount": float(com.commission_amount or 0),
            "date_paid": com.date_paid.strftime("%Y-%m-%d") if com.date_paid else None,
            "invoice": {
                "invoice_id": invoice.invoice_id,
                "final_total": float(invoice.final_total or 0),
                "status": invoice.status,
                "paid": invoice.paid,
                "date_paid": invoice.date_paid.isoformat() if invoice.date_paid else None,
                "account": {
                    "account_id": account.account_id,
                    "business_name": account.business_name
                }
            }
        } for com, invoice, account in commissions
    ]), 200
    
# def get_commissions():
#     sales_rep_id = request.args.get("user_id", type=int)
    
#     if not sales_rep_id:
#         return jsonify({"error": "User ID is required"}), 400
    
#     print(f"Fetching commissions for user {sales_rep_id}...")

#     commissions = (
#         db.session.query(Commissions, Invoice, Account)
#         .join(Invoice, Commissions.invoice_id == Invoice.invoice_id)
#         .join(Account, Invoice.account_id == Account.account_id)
#         .filter(Commissions.sales_rep_id == sales_rep_id)
#         .all()
#     )

#     if not commissions:
#         print("⚠️ No commissions found for user.")
    
#     result = []
#     for com, invoice, account in commissions:
#         print(f"Commission ID: {com.commission_id}, Date: {com.date_paid}, Invoice ID: {invoice.invoice_id}, Account: {account.business_name}")

#         result.append({
#             "commission_id": com.commission_id,
#             "sales_rep_id": com.sales_rep_id,
#             "invoice_id": com.invoice_id,
#             "commission_rate": float(com.commission_rate or 0),
#             "commission_amount": float(com.commission_amount or 0),
#             "date_paid": com.date_paid.strftime("%Y-%m-%d") if com.date_paid else None, #when db uses Timestamp without timezone format, to communicate with frontend, convert.
#             "invoice": {
#                 "invoice_id": invoice.invoice_id,
#                 "account_id": invoice.account_id,
#                 "final_total": float(invoice.final_total or 0),
#                 "status": invoice.status,
#                 "paid": invoice.paid,
#                 "date_paid":  invoice.date_paid.isoformat() if invoice.date_paid else None,
#                 "account": {
#                     "account_id": account.account_id,
#                     "business_name": account.business_name,
#                     "contact_name": account.contact_name,
#                     "phone_number": account.phone_number,
#                     "email": account.email,
#                 }
#             }
#         })

#     return jsonify(result)

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

# ✅ Fetch Commissions for Current Month
@commission_bp.route("/current_month", methods=["GET"])
def get_current_month_commissions():
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    if not sales_rep_id:
        return jsonify({"error": "User ID is required"}), 400

    current_year = func.extract('year', Commissions.date_paid)
    current_month = func.extract('month', Commissions.date_paid)

    commissions = db.session.query(
        func.sum(Commissions.commission_amount).label("total_commissions")
    ).filter(
        Commissions.sales_rep_id == sales_rep_id,
        current_year == func.extract('year', func.now()),
        current_month == func.extract('month', func.now())
    ).scalar() or 0

    return jsonify({"total_commissions": float(commissions)})

# Fetch Commissions ALL years
@commission_bp.route("/all_years", methods=["GET"])
def get_all_years_commissions():
    sales_rep_id = request.args.get("user_id", type=int)
    if not sales_rep_id:
        return jsonify({"error": "User ID is required"}), 400

    all_years = (
        db.session.query(
            func.extract('year', Commissions.date_paid).label("year")
        )
        .filter(Commissions.user_id == sales_rep_id)
        .group_by("year")
        .order_by("year")
        .all()
    )

    # Extract just the years into a list
    year_list = [int(year[0]) for year in all_years if year[0] is not None]

    return jsonify(sorted(year_list))


# ✅ Fetch Commissions for Current Year
@commission_bp.route("/current_year", methods=["GET"])
def get_current_year_commissions():
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    if not sales_rep_id:
        return jsonify({"error": "User ID is required"}), 400

    current_year = func.extract('year', Commissions.date_paid)

    commissions = db.session.query(
        func.sum(Commissions.commission_amount).label("total_commissions")
    ).filter(
        Commissions.sales_rep_id == sales_rep_id,
        current_year == func.extract('year', func.now())
    ).scalar() or 0

    return jsonify({"total_commissions": float(commissions)})

# ✅ Fetch Commissions for Last Year
@commission_bp.route("/last_year", methods=["GET"])
def get_last_year_commissions():
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    if not sales_rep_id:
        return jsonify({"error": "User ID is required"}), 400

    last_year = func.extract('year', func.now()) - 1

    commissions = db.session.query(
        func.sum(Commissions.commission_amount).label("total_commissions")
    ).filter(
        Commissions.sales_rep_id == sales_rep_id,
        extract('year', Commissions.date_paid) == last_year
    ).scalar() or 0

    return jsonify({"total_commissions": float(commissions)})

# ✅ Fetch Monthly Breakdown for a Specific Year
@commission_bp.route("/monthly/<int:year>", methods=["GET"])
def get_monthly_commissions(year):
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    if not sales_rep_id:
        return jsonify({"error": "User ID is required"}), 400

    monthly_commissions = (
        db.session.query(
            extract('month', Commissions.date_paid).label("month"),
            func.sum(Commissions.commission_amount).label("total_commissions")
        )
        .filter(Commissions.sales_rep_id == sales_rep_id, extract('year', Commissions.date_paid) == year)
        .group_by("month")
        .order_by("month")
        .all()
    )

    sales_data = [0] * 12
    for month, total in monthly_commissions:
        sales_data[int(month) - 1] = float(total)

    return jsonify(sales_data)

# ✅ Fetch Weekly Breakdown for a Specific Year & Month
@commission_bp.route("/weekly/<int:year>/<int:month>", methods=["GET"])
def get_weekly_commissions(year, month):
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    if not sales_rep_id:
        return jsonify({"error": "User ID is required"}), 400

    weekly_commissions = (
        db.session.query(
            func.ceil(func.extract('day', Commissions.date_paid) / 7).label("week"),
            func.sum(Commissions.commission_amount).label("total_commissions")
        )
        .filter(
            Commissions.sales_rep_id == sales_rep_id,
            extract('year', Commissions.date_paid) == year,
            extract('month', Commissions.date_paid) == month
        )
        .group_by("week")
        .order_by("week")
        .all()
    )

    weekly_data = [0] * 5
    for week, total in weekly_commissions:
        weekly_data[int(week) - 1] = float(total)

    return jsonify(weekly_data)

# ✅ Fetch Projected Yearly Commissions
@commission_bp.route("/projected", methods=["GET"])
def get_projected_commissions():
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    if not sales_rep_id:
        return jsonify({"error": "User ID is required"}), 400

    past_years = db.session.query(
        extract('year', Commissions.date_paid).label("year"),
        func.sum(Commissions.commission_amount).label("total_commissions")
    ).filter(
        Commissions.sales_rep_id == sales_rep_id
    ).group_by("year").order_by("year").all()

    if len(past_years) == 0:
        return jsonify({"projected_commissions": 0})

    total = sum(amount for _, amount in past_years)
    average_per_year = total / len(past_years)

    return jsonify({"projected_commissions": float(average_per_year)})