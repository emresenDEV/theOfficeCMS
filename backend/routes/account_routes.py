from flask import Blueprint, jsonify, request
from models import Account, Industry, Region, Users, Branches, Tasks, Invoice, InvoiceServices, Service, AccountContacts, Contact
from sqlalchemy import func
from database import db
from notifications import create_notification
from audit import create_audit_log


# Create Blueprint
account_bp = Blueprint("accounts", __name__)

def _coerce_empty(value):
    if value is None:
        return None
    if isinstance(value, str):
        stripped = value.strip()
        return stripped if stripped else None
    return value


def _coerce_int(value):
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _split_contact_name(name):
    if not name:
        return None, None
    parts = name.strip().split(" ", 1)
    first = parts[0] if parts else None
    last = parts[1].strip() if len(parts) > 1 else None
    return first or None, last or None


def _compose_contact_name(first, last):
    pieces = [p for p in [first, last] if p]
    return " ".join(pieces) if pieces else None

# GET Assigned Accounts API
@account_bp.route("/assigned", methods=["GET"])
def get_assigned_accounts():
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    if not sales_rep_id:
        return jsonify({"error": "User ID is required"}), 400

    accounts = Account.query.filter_by(sales_rep_id=sales_rep_id).all()
    return jsonify([account.to_dict() for account in accounts]), 200

# Get Account Details API (with Sales Rep and Branch Info) - MUST COME BEFORE /<int:account_id>
@account_bp.route("/details/<int:account_id>", methods=["GET"])
def get_account_details(account_id):
    account = Account.query.get_or_404(account_id)

    # Fetch Industry Name
    industry_name = None
    if account.industry_id:
        industry = Industry.query.get(account.industry_id)
        industry_name = industry.industry_name if industry else None
    region_name = account.region_rel.region_name if account.region_rel else account.region

    # Fetch Sales Representative
    assigned_sales_rep = None
    branch_info = None
    if account.sales_rep_id:
        sales_rep = Users.query.get(account.sales_rep_id)
        if sales_rep:
            assigned_sales_rep = {
                "user_id": sales_rep.user_id,
                "first_name": sales_rep.first_name,
                "last_name": sales_rep.last_name,
                "username": sales_rep.username,
                "email": sales_rep.email,
                "phone_number": sales_rep.phone_number,
                "extension": sales_rep.extension,
                "branch_id": sales_rep.branch_id
            }
            # Fetch Branch Details
            if sales_rep.branch_id:
                branch = Branches.query.get(sales_rep.branch_id)
                if branch:
                    branch_info = {
                        "branch_name": branch.branch_name,
                        "address": branch.address,
                        "city": branch.city,
                        "state": branch.state,
                        "zip_code": branch.zip_code,
                        "phone_number": branch.phone_number,
                    }

    primary_contact_id = None
    primary_contact_name = None
    primary_link = AccountContacts.query.filter_by(account_id=account.account_id).order_by(
        AccountContacts.is_primary.desc(),
        AccountContacts.created_at.asc(),
    ).first()
    if primary_link:
        contact = Contact.query.get(primary_link.contact_id)
        if contact:
            primary_contact_id = contact.contact_id
            primary_contact_name = f"{contact.first_name or ''} {contact.last_name or ''}".strip() or None

    return jsonify({
        "account_id": account.account_id,
        "business_name": account.business_name,
        "contact_name": _compose_contact_name(account.contact_first_name, account.contact_last_name) or account.contact_name,
        "contact_first_name": account.contact_first_name,
        "contact_last_name": account.contact_last_name,
        "primary_contact_id": primary_contact_id,
        "primary_contact_name": primary_contact_name,
        "phone_number": account.phone_number,
        "email": account.email,
        "address": account.address,
        "city": account.city,
        "state": account.state,
        "zip_code": account.zip_code,
        "region_id": account.region_id,
        "region_name": region_name,
        "industry": industry_name if industry_name else "N/A",
        "sales_rep": assigned_sales_rep if assigned_sales_rep else None,
        "branch": branch_info if branch_info else None,
        "date_created": account.date_created.strftime("%Y-%m-%d"),
        "date_updated": account.date_updated.strftime("%Y-%m-%d"),
    }), 200


@account_bp.route("/<int:account_id>/purchase_history", methods=["GET"])
def get_account_purchase_history(account_id):
    sort_key = request.args.get("sort", "quantity")
    order = request.args.get("order", "desc")

    quantity_col = func.coalesce(func.sum(InvoiceServices.quantity), 0).label("total_quantity")
    spend_col = func.coalesce(func.sum(InvoiceServices.total_price), 0).label("total_spent")
    last_purchase_col = func.max(Invoice.date_created).label("last_purchase")

    query = (
        db.session.query(
            Service.service_id,
            Service.service_name,
            quantity_col,
            spend_col,
            last_purchase_col,
        )
        .join(InvoiceServices, InvoiceServices.service_id == Service.service_id)
        .join(Invoice, Invoice.invoice_id == InvoiceServices.invoice_id)
        .filter(Invoice.account_id == account_id)
        .group_by(Service.service_id, Service.service_name)
    )

    if sort_key == "total_spent":
        sort_column = spend_col
    elif sort_key == "last_purchase":
        sort_column = last_purchase_col
    else:
        sort_column = quantity_col

    query = query.order_by(sort_column.desc() if order == "desc" else sort_column.asc())

    results = query.all()
    history = [
        {
            "service_id": row.service_id,
            "service_name": row.service_name,
            "total_quantity": int(row.total_quantity or 0),
            "total_spent": float(row.total_spent or 0),
            "last_purchase": row.last_purchase.isoformat() if row.last_purchase else None,
        }
        for row in results
    ]

    return jsonify(history), 200

# Fetch account revenue, last invoice date, and task count - MUST COME BEFORE /<int:account_id>
@account_bp.route("/account_metrics", methods=["GET"])
def get_account_metrics():
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    if not sales_rep_id:
        return jsonify({"error": "Sales Rep ID is required"}), 400

    accounts = (
        db.session.query(
            Account.account_id,
            Account.business_name,
            Account.contact_name,
            Account.contact_first_name,
            Account.contact_last_name,
            Account.region_id,
            Region.region_name,
            Industry.industry_name,
            func.coalesce(func.count(Tasks.task_id).filter(Tasks.is_completed == False), 0).label("task_count"),
            func.coalesce(func.sum(Invoice.final_total), 0).label("total_revenue"),
            func.max(Invoice.date_created).label("last_invoice_date"),
        )
        .join(Industry, Industry.industry_id == Account.industry_id, isouter=True)
        .join(Region, Region.region_id == Account.region_id, isouter=True)
        .join(Invoice, Invoice.account_id == Account.account_id, isouter=True)
        .join(Tasks, Tasks.account_id == Account.account_id, isouter=True)
        .filter(Account.sales_rep_id == sales_rep_id)
        .group_by(Account.account_id, Industry.industry_name, Region.region_name)
        .all()
    )

    result = [
        {
            "account_id": acc.account_id,
            "business_name": acc.business_name,
            "contact_name": _compose_contact_name(acc.contact_first_name, acc.contact_last_name) or acc.contact_name,
            "contact_first_name": acc.contact_first_name,
            "contact_last_name": acc.contact_last_name,
            "industry_name": acc.industry_name or "Unknown Industry",
            "task_count": acc.task_count,
            "total_revenue": float(acc.total_revenue or 0),
            "last_invoice_date": acc.last_invoice_date.strftime("%Y-%m-%d") if acc.last_invoice_date else None,
            "region_id": acc.region_id,
            "region_name": acc.region_name,
        }
        for acc in accounts
    ]

    return jsonify(result), 200

# Get All Accounts API
@account_bp.route("/", methods=["GET"])
def get_accounts():
    accounts = Account.query.all()
    primary_links = AccountContacts.query.order_by(
        AccountContacts.is_primary.desc(),
        AccountContacts.created_at.asc(),
    ).all()
    primary_contact_map = {}
    for link in primary_links:
        if link.account_id not in primary_contact_map:
            primary_contact_map[link.account_id] = link.contact_id
    contact_ids = list({cid for cid in primary_contact_map.values() if cid})
    contact_name_map = {}
    if contact_ids:
        contacts = Contact.query.filter(Contact.contact_id.in_(contact_ids)).all()
        contact_name_map = {
            contact.contact_id: f"{contact.first_name or ''} {contact.last_name or ''}".strip() or None
            for contact in contacts
        }
    account_list = [
        {
            "account_id": acc.account_id,
            "business_name": acc.business_name,
            "contact_name": _compose_contact_name(acc.contact_first_name, acc.contact_last_name) or acc.contact_name,
            "contact_first_name": acc.contact_first_name,
            "contact_last_name": acc.contact_last_name,
            "primary_contact_id": primary_contact_map.get(acc.account_id),
            "primary_contact_name": contact_name_map.get(primary_contact_map.get(acc.account_id)),
            "phone_number": acc.phone_number,
            "email": acc.email,
            "address": acc.address,
            "city": acc.city,
            "state": acc.state,
            "zip_code": acc.zip_code,
            "region_id": acc.region_id,
            "region_name": acc.region_rel.region_name if acc.region_rel else acc.region,
            "industry_id": acc.industry_id,
            "sales_rep_id": acc.sales_rep_id,
            "notes": acc.notes,
            "date_created": acc.date_created,
            "date_updated": acc.date_updated,
            "branch_id": acc.branch_id,
        }
        for acc in accounts
    ]
    return jsonify(account_list), 200

# Get Account By ID API
@account_bp.route("/<int:account_id>", methods=["GET"])
def get_account_by_id(account_id):
    account = Account.query.get(account_id)
    if not account:
        return jsonify({"error": "Account not found"}), 404

    return jsonify({
        "account_id": account.account_id,
        "business_name": account.business_name,
        "contact_name": _compose_contact_name(account.contact_first_name, account.contact_last_name) or account.contact_name,
        "contact_first_name": account.contact_first_name,
        "contact_last_name": account.contact_last_name,
        "email": account.email,
        "phone_number": account.phone_number,
        "region_id": account.region_id,
        "region_name": account.region_rel.region_name if account.region_rel else account.region,
    })

# Update Account Details
@account_bp.route("/update/<int:account_id>", methods=["PUT"])
def update_account(account_id):
    try:
        data = request.json
        print(f"🔍 Received update data: {data}")  # Log incoming data

        account = Account.query.get(account_id)

        if not account:
            print(f"❌ Account with ID {account_id} not found")
            return jsonify({"message": "Account not found"}), 404

        # Log before updating
        print(f"📝 Existing Account Before Update: {account.to_dict()}")
        before_data = account.to_dict()

        previous_sales_rep_id = account.sales_rep_id

        # Update account fields
        account.business_name = data.get("business_name", account.business_name)
        incoming_first = data.get("contact_first_name")
        incoming_last = data.get("contact_last_name")
        incoming_name = data.get("contact_name")

        if incoming_first is not None or incoming_last is not None:
            if incoming_first is not None:
                account.contact_first_name = _coerce_empty(incoming_first)
            if incoming_last is not None:
                account.contact_last_name = _coerce_empty(incoming_last)
            account.contact_name = _compose_contact_name(account.contact_first_name, account.contact_last_name)
        elif incoming_name is not None:
            contact_name = _coerce_empty(incoming_name)
            account.contact_name = contact_name
            first, last = _split_contact_name(contact_name)
            account.contact_first_name = first
            account.contact_last_name = last
        account.phone_number = data.get("phone_number", account.phone_number) or None
        account.email = data.get("email", account.email) or None
        account.address = data.get("address", account.address)
        account.city = data.get("city", account.city)
        account.state = data.get("state", account.state)
        account.zip_code = data.get("zip_code", account.zip_code)
        if "industry_id" in data:
            account.industry_id = _coerce_int(data.get("industry_id"))
        if "sales_rep_id" in data:
            account.sales_rep_id = _coerce_int(data.get("sales_rep_id"))
        if "branch_id" in data:
            account.branch_id = _coerce_int(data.get("branch_id"))
        account.notes = data.get("notes", account.notes) or None
        if "region_id" in data:
            account.region_id = _coerce_int(data.get("region_id"))
        if "region" in data and "region_id" not in data:
            account.region = _coerce_empty(data.get("region"))
        if "branch_id" in data and "region_id" not in data:
            branch = Branches.query.get(account.branch_id) if account.branch_id else None
            if branch and branch.branch_name:
                region = Region.query.filter_by(region_name=branch.branch_name).first()
                if region:
                    account.region_id = region.region_id

        # Automatically update the timestamp
        account.date_updated = db.func.current_timestamp()
        if "updated_by_user_id" in data:
            account.updated_by_user_id = _coerce_int(data.get("updated_by_user_id"))


        # Notifications (skip admin-triggered changes)
        updater = Users.query.get(account.updated_by_user_id) if account.updated_by_user_id else None
        is_admin_update = bool(updater and updater.role and "admin" in updater.role.role_name.lower())

        if account.sales_rep_id and not is_admin_update:
            if previous_sales_rep_id != account.sales_rep_id:
                create_notification(
                    user_id=account.sales_rep_id,
                    notif_type="account_assigned",
                    title="New account assigned",
                    message=account.business_name,
                    link=f"/accounts/details/{account.account_id}",
                    source_type="account",
                    source_id=account.account_id,
                )
            else:
                create_notification(
                    user_id=account.sales_rep_id,
                    notif_type="account_updated",
                    title="Account updated",
                    message=account.business_name,
                    link=f"/accounts/details/{account.account_id}",
                    source_type="account",
                    source_id=account.account_id,
                )
        create_audit_log(
            entity_type="account",
            entity_id=account.account_id,
            action="update",
            user_id=account.updated_by_user_id,
            before_data=before_data,
            after_data=account.to_dict(),
            account_id=account.account_id,
        )
        db.session.commit()

        # Log after updating
        print(f"✅ Updated Account: {account.to_dict()}")

        return jsonify({"message": "Account updated successfully", "account": account.to_dict()}), 200

    except Exception as e:
        print(f"❌ Exception during update: {str(e)}")
        return jsonify({"error": "An error occurred during the update", "details": str(e)}), 500

# Create a New Account API
@account_bp.route("/", methods=["POST"])
def create_account():
    try:
        data = request.json  
        print(f"🔍 Incoming account data: {data}")
        
        industry_id = int(data.get("industry_id")) if data.get("industry_id") else None
        user_id = int(data.get("user_id")) if data.get("user_id") else None
        branch_id = int(data.get("branch_id")) if data.get("branch_id") else None
        created_by = int(data.get("created_by")) if data.get("created_by") else None
        region_id = int(data.get("region_id")) if data.get("region_id") else None

        contact_first_name = _coerce_empty(data.get("contact_first_name"))
        contact_last_name = _coerce_empty(data.get("contact_last_name"))
        contact_name = _coerce_empty(data.get("contact_name"))

        if contact_first_name or contact_last_name:
            contact_name = _compose_contact_name(contact_first_name, contact_last_name)
        elif contact_name:
            contact_first_name, contact_last_name = _split_contact_name(contact_name)

        new_account = Account(
            business_name=data.get("business_name"),
            contact_name=contact_name,
            contact_first_name=contact_first_name,
            contact_last_name=contact_last_name,
            phone_number=data.get("phone_number") or None,
            email=data.get("email") or None,
            address=data.get("address"),
            city=data.get("city"),
            state=data.get("state"),
            zip_code=data.get("zip_code"),
            industry_id=industry_id,
            sales_rep_id=user_id,
            branch_id=branch_id,
            notes=data.get("notes"),
            region_id=region_id,
            region=_coerce_empty(data.get("region")),
            date_created=func.current_timestamp(),
            date_updated=func.current_timestamp(),
            updated_by_user_id=created_by
            )
        db.session.add(new_account)
        db.session.flush()

        if new_account.sales_rep_id:
            create_notification(
                user_id=new_account.sales_rep_id,
                notif_type="account_assigned",
                title="New account assigned",
                message=new_account.business_name,
                link=f"/accounts/details/{new_account.account_id}",
                source_type="account",
                source_id=new_account.account_id,
            )
        create_audit_log(
            entity_type="account",
            entity_id=new_account.account_id,
            action="create",
            user_id=created_by,
            after_data=new_account.to_dict(),
            account_id=new_account.account_id,
        )
        db.session.commit()

        return jsonify({"message": "Account created successfully", "account_id": new_account.account_id}), 201

    except Exception as e:
        print(f"❌ Error creating account: {str(e)}")
        return jsonify({"error": "An error occurred while creating the account", "details": str(e)}), 500


# Delete Account
@account_bp.route("/<int:account_id>", methods=["DELETE"])
def delete_account(account_id):
    account = Account.query.get(account_id)
    if not account:
        return jsonify({"error": "Account not found"}), 404

    before_data = account.to_dict()
    db.session.delete(account)
    create_audit_log(
        entity_type="account",
        entity_id=account_id,
        action="delete",
        user_id=request.args.get("actor_user_id", type=int),
        user_email=request.args.get("actor_email"),
        before_data=before_data,
        after_data=None,
        account_id=account_id,
    )
    db.session.commit()
    return jsonify({"message": "Account deleted successfully"}), 200
