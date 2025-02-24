from flask import Blueprint, jsonify, request
from models import Account, Industry, Users, Branches
from database import db
from flask_cors import cross_origin


# ✅ Create Blueprint
account_bp = Blueprint("accounts", __name__)

@account_bp.route("/update/<int:account_id>", methods=["OPTIONS"])
@cross_origin(origin="http://localhost:5174", supports_credentials=True)
def handle_options_update_account(account_id):
    response = jsonify({"message": "CORS preflight OK"})
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5174"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response, 200

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
@account_bp.route("/details/<int:account_id>", methods=["GET"])
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

    # ✅ Fetch Assigned Sales Representative (User assigned to this account)
    assigned_sales_rep = None
    if account.user_id:
        sales_rep = Users.query.get(account.user_id)  # This gets the user assigned to the account
        if sales_rep:
            assigned_sales_rep = {
                "user_id": sales_rep.user_id,
                "first_name": sales_rep.first_name,
                "last_name": sales_rep.last_name,
                "username": sales_rep.username,
                "email": sales_rep.email,
                "phone_number": sales_rep.phone_number,
                "extension": sales_rep.extension,
                "branch_id": sales_rep.branch_id  # ✅ This allows us to fetch branch details below
            }
    print(f"🔍 Sales Person for Account {account_id}: {assigned_sales_rep}")

    # ✅ Fetch Branch Details
    branch_info = None
    if assigned_sales_rep and assigned_sales_rep["branch_id"]:
        branch = Branches.query.get(assigned_sales_rep["branch_id"])
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
        "industry": industry_name if industry_name else "N/A",  
        "sales_rep": assigned_sales_rep if assigned_sales_rep else None,  # ✅ Assigned rep info
        "branch": branch_info if branch_info else None,  # ✅ Branch details of the assigned rep
        "notes": account.notes if account.notes else "No notes available",
        "date_created": account.date_created.strftime("%Y-%m-%d"),
        "date_updated": account.date_updated.strftime("%Y-%m-%d"),
    })

# ✅ Update Account Details
@account_bp.route("/update/<int:account_id>", methods=["PUT"])
@cross_origin(origin="http://localhost:5174", supports_credentials=True)
def update_account(account_id):
    try:
        data = request.json
        print(f"🔍 Received update data: {data}")  # ✅ Log incoming data

        account = Account.query.get(account_id)

        if not account:
            print(f"❌ Account with ID {account_id} not found")
            return jsonify({"message": "Account not found"}), 404

        # ✅ Log before updating
        print(f"📝 Existing Account Before Update: {account.to_dict()}")

        # Update account fields
        account.business_name = data.get("business_name", account.business_name)
        account.contact_name = data.get("contact_name", account.contact_name) or None
        account.phone_number = data.get("phone_number", account.phone_number) or None
        account.email = data.get("email", account.email) or None
        account.address = data.get("address", account.address)
        account.city = data.get("city", account.city)
        account.state = data.get("state", account.state)
        account.zip_code = data.get("zip_code", account.zip_code)
        account.industry_id = data.get("industry_id", account.industry_id) or None
        account.user_id = data.get("user_id", account.user_id) or None
        account.branch_id = data.get("branch_id", account.branch_id) or None
        account.notes = data.get("notes", account.notes) or None

        # ✅ Automatically update the timestamp
        account.date_updated = db.func.current_timestamp()

        db.session.commit()

        # ✅ Log after updating
        print(f"✅ Updated Account: {account.to_dict()}")

        return jsonify({"message": "Account updated successfully", "account": account.to_dict()}), 200

    except Exception as e:
        print(f"❌ Exception during update: {str(e)}")
        return jsonify({"error": "An error occurred during the update", "details": str(e)}), 500

# ✅ Create a New Account API
@account_bp.route("/", methods=["POST"])
@cross_origin(origin="http://localhost:5174", supports_credentials=True)
def create_account():
    try:
        data = request.json  # ✅ Receive account data
        print(f"🔍 Incoming account data: {data}")
        
        # ✅ Convert empty strings to None for integer fields
        industry_id = int(data.get("industry_id")) if data.get("industry_id") else None
        user_id = int(data.get("user_id")) if data.get("user_id") else None
        branch_id = int(data.get("branch_id")) if data.get("branch_id") else None

        # ✅ Create a new account instance
        new_account = Account(
            business_name=data.get("business_name"),
            contact_name=data.get("contact_name") or None,
            phone_number=data.get("phone_number") or None,
            email=data.get("email") or None,
            address=data.get("address"),
            city=data.get("city"),
            state=data.get("state"),
            zip_code=data.get("zip_code"),
            industry_id=data.get("industry_id") or None,
            user_id=data.get("user_id") or None,
            branch_id=data.get("branch_id") or None,
            notes=data.get("notes"),
            date_created=db.func.current_timestamp(),
            date_updated=db.func.current_timestamp()
        )

        # ✅ Add the new account to the database
        db.session.add(new_account)
        db.session.commit()

        # ✅ Return the newly created account as a response
        return jsonify({"message": "Account created successfully", "account_id": new_account.account_id}), 201

    except Exception as e:
        print(f"❌ Error creating account: {str(e)}")
        return jsonify({"error": "An error occurred while creating the account", "details": str(e)}), 500
