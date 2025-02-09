from flask import Blueprint, request, jsonify
from models import Account
from database import db

account_bp = Blueprint("account", __name__)

# ----------------------------
# 📌 ACCOUNTS API
# ----------------------------

#  GET Assigned Accounts API
@app.route("/accounts/assigned", methods=["GET"])
# @cross_origin(origin="http://localhost:5173", supports_credentials=True)
@cross_origin()
def get_assigned_accounts():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    assigned_accounts = Account.query.filter_by(sales_employee_id=user_id).all()

    return jsonify([
        {
            "account_id": acc.account_id,
            "business_name": acc.business_name,
            "contact_name": acc.contact_name,
            "phone_number": acc.phone_number,
        } for acc in assigned_accounts
    ]), 200


# Get Accounts API
@app.route("/accounts", methods=["GET"])
def get_accounts():
    accounts = Account.query.all()
    account_list = [
        {
            "account_id": acc.account_id,
            "business_name": acc.business_name,
            "contact_name": acc.contact_name,
            "phone_number": acc.phone_number,
            "email": acc.email,
            "address": acc.address,
            "city": acc.city,
            "state": acc.state,
            "zip_code": acc.zip_code,
            "industry": acc.industry,
            "date_created": acc.date_created,
            "date_updated": acc.date_updated,
            "invoice_number": acc.invoice_number if hasattr(acc, 'invoice_number') else None,
            "notes": acc.notes,
        }
        for acc in accounts
    ]
    return jsonify(account_list), 200

# Get Accounts By ID API
@app.route("/accounts/<int:account_id>", methods=["GET"])
def get_account_by_id(account_id):
    account = Account.query.get(account_id)
    if not account:
        return jsonify({"error": "Account not found"}), 404

    return jsonify({
        "account_id": account.account_id,
        "business_name": account.business_name,
        "contact_name": account.contact_name,
        "email": account.email,
        "phone_number": account.phone_number,
    })
