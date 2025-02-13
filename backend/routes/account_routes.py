from flask import Blueprint, jsonify, request
from models import Account, Industry, Users, Branches
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

# ✅ Get Account Details API
@account_bp.route("/<int:account_id>", methods=["GET"])
def get_account_details(account_id):
    account = Account.query.get(account_id)
    
    if not account:
        return jsonify({"error": "Account not found"}), 404

    # ✅ Fetch Industry Name
    industry_name = None
    if account.industry_id:
        industry = Industry.query.get(account.industry_id)
        industry_name = industry.industry_name if industry else None
    print(f"🔍 Industry for Account {account_id}: {industry_name}")

    # ✅ Fetch Sales Person Details (User)
    sales_person = None
    if account.user_id:
        user = Users.query.get(account.user_id)
        if user:
            sales_person = {
                "full_name": f"{user.first_name} {user.last_name}",
                "email": user.email,
                "phone_number": user.phone_number,
                "extension": getattr(user, "extension", None)  # ✅ Use `getattr` to avoid AttributeError
            }
    print(f"🔍 Sales Person for Account {account_id}: {sales_person}")

    # ✅ Fetch Branch Details
    branch_info = None
    if account.branch_id:
        branch = Branches.query.get(account.branch_id)
        if branch:
            branch_info = {
                "branch_name": branch.branch_name,
                "address": branch.address,
                "city": branch.city,
                "state": branch.state,
                "zip_code": branch.zip_code,
                "phone_number": branch.phone_number
            }
    print(f"🔍 Branch for Account {account_id}: {branch_info}")

    return jsonify({
        "account_id": account.account_id,
        "business_name": account.business_name,
        "contact_name": account.contact_name,
        "email": account.email,
        "phone_number": account.phone_number,
        "address": account.address,
        "city": account.city,
        "state": account.state,
        "zip_code": account.zip_code,
        "industry": industry_name if industry_name else "N/A",  # ✅ Return "N/A" if missing
        "sales_person": sales_person if sales_person else "N/A",  # ✅ Return "N/A" if missing
        "branch": branch_info if branch_info else "N/A",  # ✅ Return "N/A" if missing
        "notes": account.notes if account.notes else "No notes available",
        "date_created": account.date_created,
        "date_updated": account.date_updated,
    })
