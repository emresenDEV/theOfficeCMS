from flask import Blueprint, request, jsonify
from models import Commissions, Invoice, Account, Payment
from database import db
from sqlalchemy import func, extract

commission_bp = Blueprint("commission", __name__)

# Fetch All Commissions
@commission_bp.route("/", methods=["GET"])
def get_commissions():
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    if not sales_rep_id:
        return jsonify({"error": "sales_rep_id is required"}), 400

    # Join Commissions → Payments → Invoices → Accounts
    commissions = (
        db.session.query(Commissions, Payment, Invoice, Account)
        .join(Payment, Commissions.payment_id == Payment.payment_id)
        .join(Invoice, Payment.invoice_id == Invoice.invoice_id)
        .join(Account, Invoice.account_id == Account.account_id)
        .filter(Commissions.sales_rep_id == sales_rep_id)
        .all()
    )

    return jsonify([
        {
            "commission_id": com.commission_id,
            "sales_rep_id": com.sales_rep_id,
            "payment_id": payment.payment_id,
            "invoice_id": invoice.invoice_id,
            "commission_rate": float(com.commission_rate or 0),
            "commission_amount": float((payment.total_paid or 0) * (com.commission_rate or 0)),
            "date_paid": payment.date_paid.strftime("%Y-%m-%d") if payment.date_paid else None,
            "invoice": {
                "invoice_id": invoice.invoice_id,
                "final_total": float(invoice.final_total or 0),
                "status": invoice.status,
                # "paid": invoice.final_total == payment.total_paid,
                "date_paid": payment.date_paid.isoformat() if payment.date_paid else None,
                "account": {
                    "account_id": account.account_id,
                    "business_name": account.business_name
                }
            }
        } for com, payment, invoice, account in commissions
    ])
# Fetch Yearly Commissions
@commission_bp.route("/yearly", methods=["GET"])
def get_yearly_commissions():
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    from_year = request.args.get("from_year", type=int)
    to_year = request.args.get("to_year", type=int)

    if not sales_rep_id or not from_year or not to_year:
        return jsonify({"error": "Missing required parameters"}), 400

    yearly_commissions = (
        db.session.query(
            extract('year', Commissions.date_paid).label("year"),
            func.sum(Commissions.commission_amount).label("total_commissions")
        )
        .filter(
            Commissions.sales_rep_id == sales_rep_id,
            extract('year', Commissions.date_paid) >= from_year,
            extract('year', Commissions.date_paid) <= to_year
        )
        .group_by("year")
        .order_by("year")
        .all()
    )

    return jsonify({int(year): float(total) for year, total in yearly_commissions})

# Fetch Current Year Commissions
@commission_bp.route("/current_year", methods=["GET"])
def get_current_year_commissions():
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    if not sales_rep_id:
        return jsonify({"error": "sales_rep_id is required"}), 400

    commissions = db.session.query(
        func.sum(Commissions.commission_amount).label("total_commissions")
    ).filter(
        Commissions.sales_rep_id == sales_rep_id,
        extract('year', Commissions.date_paid) == func.extract('year', func.now())
    ).scalar() or 0

    return jsonify({"total_commissions": float(commissions)})

# Fetch Last Year Commissions
@commission_bp.route("/last_year", methods=["GET"])
def get_last_year_commissions():
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    if not sales_rep_id:
        return jsonify({"error": "sales_rep_id is required"}), 400

    last_year = func.extract('year', func.now()) - 1

    commissions = db.session.query(
        func.sum(Commissions.commission_amount).label("total_commissions")
    ).filter(
        Commissions.sales_rep_id == sales_rep_id,
        extract('year', Commissions.date_paid) == last_year
    ).scalar() or 0

    return jsonify({"total_commissions": float(commissions)})

# Fetch Monthly Breakdown for a Specific Year
@commission_bp.route("/monthly/<int:year>", methods=["GET"])
def get_monthly_commissions(year):
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    if not sales_rep_id:
        return jsonify({"error": "sales_rep_id is required"}), 400

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

# Fetch Weekly Breakdown for a Specific Year & Month
@commission_bp.route("/weekly/<int:year>/<int:month>", methods=["GET"])
def get_weekly_commissions(year, month):
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    if not sales_rep_id:
        return jsonify({"error": "sales_rep_id is required"}), 400

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

    weekly_data = [0] * 5  # Some months have 4 or 5 weeks
    for week, total in weekly_commissions:
        weekly_data[int(week) - 1] = float(total)

    return jsonify(weekly_data)

# Fetch Projected Yearly Commissions
@commission_bp.route("/projected", methods=["GET"])
def get_projected_commissions():
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    if not sales_rep_id:
        return jsonify({"error": "sales_rep_id is required"}), 400

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

# Fetch All Available Years with Commissions
@commission_bp.route("/all_years", methods=["GET"])
def get_all_years():
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    if not sales_rep_id:
        return jsonify({"error": "sales_rep_id is required"}), 400

    all_years = (
        db.session.query(func.extract('year', Commissions.date_paid).label("year"))
        .filter(Commissions.sales_rep_id == sales_rep_id)
        .group_by("year")
        .order_by("year")
        .all()
    )

    year_list = [int(year[0]) for year in all_years if year[0] is not None]
    return jsonify(year_list)

#  Get Current Month Commissions
@commission_bp.route("/current_month", methods=["GET"])
def get_current_month_commissions():
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    if not sales_rep_id:
        return jsonify({"error": "sales_rep_id is required"}), 400

    current_year = func.extract('year', func.now())
    current_month = func.extract('month', func.now())

    commissions = db.session.query(
        func.sum(Commissions.commission_amount).label("total_commissions")
    ).filter(
        Commissions.sales_rep_id == sales_rep_id,
        extract('year', Commissions.date_paid) == current_year,
        extract('month', Commissions.date_paid) == current_month
    ).scalar() or 0  # Return 0 if no data exists

    return jsonify({"total_commissions": float(commissions)}) 
