from flask import Blueprint, jsonify, request
from models import Account
from database import db
from flask_cors import cross_origin

# ✅ Create Blueprint
account_bp = Blueprint("accounts", __name__)

# ✅ GET Assigned Accounts API
@account_bp.route("/assigned", methods=["GET"])
@cross_origin()
def get_assigned_accounts():
    user_id = request.args.get("user_id", type=int)
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    accounts = Account.query.filter_by(user_id=user_id).all()
    return jsonify([account.to_dict() for account in accounts]), 200


# ✅ Get All Accounts API
@account_bp.route("/", methods=["GET"])
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
            "industry_id": acc.industry_id,
            "user_id": acc.user_id,
            "notes": acc.notes,
            "date_created": acc.date_created,
            "date_updated": acc.date_updated,
            "branch_id": acc.branch_id,
        }
        for acc in accounts
    ]
    return jsonify(account_list), 200

# ✅ Get Account By ID API
@account_bp.route("/<int:account_id>", methods=["GET"])
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
