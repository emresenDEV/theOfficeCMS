from flask import Blueprint, request, jsonify
from models import Users, Branches, Departments, UserRoles
from database import db
from werkzeug.security import generate_password_hash
from audit import create_audit_log
from notifications import create_notification

user_bp = Blueprint("users", __name__)

# Users API
@user_bp.route("/", methods=["GET"])
def get_users():
    branch_id = request.args.get("branch_id", type=int)
    department_id = request.args.get("department_id", type=int)
    role_id = request.args.get("role_id", type=int)

    query = Users.query

    if branch_id:
        query = query.filter_by(branch_id=branch_id)

    if department_id:
        query = query.filter_by(department_id=department_id)

    if role_id:
        query = query.filter_by(role_id=role_id)

    users = query.all()

    return jsonify([
        {
            "user_id": user.user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "username": user.username,
            "role_id": user.role_id,
            "department_id": user.department_id,
            "reports_to": user.reports_to,
            "email": user.email,
            "branch_id": user.branch_id,
            "timezone": user.timezone,
            "timezone_mode": user.timezone_mode,
            "contacts_autosave": user.contacts_autosave,
        } for user in users
    ]), 200


@user_bp.route("", methods=["POST"])
@user_bp.route("/", methods=["POST"])
def create_user():
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")
    role_id = data.get("role_id")

    if not username or not password or not role_id:
        return jsonify({"error": "username, password, and role_id are required"}), 400

    if not password.isalpha() or not password.islower():
        return jsonify({"error": "Password must be lowercase letters only"}), 400

    if Users.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 409

    new_user = Users(
        username=username,
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        role_id=int(role_id),
        reports_to=int(data.get("reports_to")) if data.get("reports_to") else None,
        department_id=int(data.get("department_id")) if data.get("department_id") else None,
        salary=data.get("salary"),
        commission_rate=data.get("commission_rate"),
        is_active=data.get("is_active", True),
        is_department_lead=data.get("is_department_lead"),
        receives_commission=data.get("receives_commission", False),
        phone_number=data.get("phone_number"),
        extension=data.get("extension"),
        email=data.get("email"),
        branch_id=int(data.get("branch_id")) if data.get("branch_id") else None,
    )
    new_user.password_hash = generate_password_hash(password, method="pbkdf2:sha256", salt_length=16)

    db.session.add(new_user)
    db.session.flush()

    create_audit_log(
        entity_type="user",
        entity_id=new_user.user_id,
        action="create",
        user_id=data.get("actor_user_id"),
        user_email=data.get("actor_email"),
        after_data={
            "user_id": new_user.user_id,
            "username": new_user.username,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "email": new_user.email,
            "role_id": new_user.role_id,
            "department_id": new_user.department_id,
            "branch_id": new_user.branch_id,
            "is_active": new_user.is_active,
        },
    )

    db.session.commit()
    return jsonify({"message": "User created", "user_id": new_user.user_id}), 201


@user_bp.route("/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    user = Users.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json or {}
    before_data = {
        "user_id": user.user_id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "role_id": user.role_id,
        "department_id": user.department_id,
        "branch_id": user.branch_id,
        "is_active": user.is_active,
        "timezone": user.timezone,
        "timezone_mode": user.timezone_mode,
        "contacts_autosave": user.contacts_autosave,
    }

    user.username = data.get("username", user.username)
    user.first_name = data.get("first_name", user.first_name)
    user.last_name = data.get("last_name", user.last_name)
    user.email = data.get("email", user.email)
    user.phone_number = data.get("phone_number", user.phone_number)
    user.extension = data.get("extension", user.extension)
    user.role_id = int(data.get("role_id")) if data.get("role_id") else user.role_id
    user.department_id = int(data.get("department_id")) if data.get("department_id") else user.department_id
    user.branch_id = int(data.get("branch_id")) if data.get("branch_id") else user.branch_id
    user.reports_to = int(data.get("reports_to")) if data.get("reports_to") else user.reports_to
    user.salary = data.get("salary", user.salary)
    user.commission_rate = data.get("commission_rate", user.commission_rate)
    user.receives_commission = data.get("receives_commission", user.receives_commission)
    user.is_active = data.get("is_active", user.is_active)
    user.timezone = data.get("timezone", user.timezone)
    user.timezone_mode = data.get("timezone_mode", user.timezone_mode)
    if "contacts_autosave" in data:
        user.contacts_autosave = data.get("contacts_autosave")

    if "password" in data and data["password"]:
        password = data["password"]
        if not password.isalpha() or not password.islower():
            return jsonify({"error": "Password must be lowercase letters only"}), 400
        user.password_hash = generate_password_hash(password, method="pbkdf2:sha256", salt_length=16)

    after_data = {
        "user_id": user.user_id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "role_id": user.role_id,
        "department_id": user.department_id,
        "branch_id": user.branch_id,
        "is_active": user.is_active,
        "timezone": user.timezone,
        "timezone_mode": user.timezone_mode,
        "contacts_autosave": user.contacts_autosave,
    }

    if before_data.get("timezone") != after_data.get("timezone") or before_data.get("timezone_mode") != after_data.get("timezone_mode"):
        detected_tz = data.get("detected_timezone")
        selected_tz = after_data.get("timezone") or detected_tz
        message_parts = []
        if detected_tz:
            message_parts.append(f"System detected {detected_tz}.")
        if selected_tz:
            message_parts.append(f"You selected {selected_tz}.")
        message_parts.append("Open Settings to review your timezone.")
        create_notification(
            user_id=user.user_id,
            notif_type="timezone_change",
            title="Timezone updated. Open Settings",
            message=" ".join(message_parts),
            link="/settings?highlight=timezone",
            source_type="user",
            source_id=user.user_id,
        )

    create_audit_log(
        entity_type="user",
        entity_id=user.user_id,
        action="update",
        user_id=data.get("actor_user_id"),
        user_email=data.get("actor_email"),
        before_data=before_data,
        after_data=after_data,
    )

    db.session.commit()
    return jsonify({"message": "User updated"}), 200


@user_bp.route("/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    user = Users.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    before_data = {
        "user_id": user.user_id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "role_id": user.role_id,
        "department_id": user.department_id,
        "branch_id": user.branch_id,
        "is_active": user.is_active,
    }

    db.session.delete(user)
    create_audit_log(
        entity_type="user",
        entity_id=user_id,
        action="delete",
        user_id=request.args.get("actor_user_id", type=int),
        user_email=request.args.get("actor_email"),
        before_data=before_data,
        after_data=None,
    )
    db.session.commit()
    return jsonify({"message": "User deleted"}), 200


@user_bp.route("/<int:user_id>", methods=["GET"])
def get_user_by_id(user_id):
    """Retrieve detailed profile information for a specific user."""
    user = Users.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Fetch department name
    department_name = None
    if user.department_id:
        department = Departments.query.get(user.department_id)
        department_name = department.department_name if department else "Unknown"

    # Fetch role name and description
    role_name = None
    role_description = None
    is_department_lead = False
    if user.role_id:
        role = UserRoles.query.get(user.role_id)
        if role:
            role_name = role.role_name
            role_description = role.description
            is_department_lead = role.is_lead

    # Fetch branch details
    branch_name = None
    branch_address = None
    branch_city = None
    branch_state = None
    branch_zip_code = None
    branch_phone_number = None
    if user.branch_id:
        branch = Branches.query.get(user.branch_id)
        if branch:
            branch_name = branch.branch_name if branch else "Unknown"
            branch_address = branch.address if branch else "Unknown"
            branch_city = branch.city if branch else "Unknown"
            branch_state = branch.state if branch else "Unknown"
            branch_zip_code = branch.zip_code if branch else "Unknown"
            branch_phone_number = branch.phone_number if branch else "Unknown"

    # Fetch reports_to user details
    reports_to_name = None
    if user.reports_to:
        reports_to_user = Users.query.get(user.reports_to)
        if reports_to_user:
            reports_to_name = f"{reports_to_user.first_name} {reports_to_user.last_name}"

    return jsonify({
        "user_id": user.user_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "username": user.username,
        "email": user.email,
        "phone_number": user.phone_number,
        "extension": user.extension,
        "branch_id": user.branch_id,
        "branch_name": branch_name,
        "branch_address": branch_address,
        "branch_city": branch_city,
        "branch_state": branch_state,
        "branch_zip_code": branch_zip_code,
        "branch_phone_number": branch_phone_number,
        "department_id": user.department_id,
        "department_name": department_name,
        "role_id": user.role_id,
        "role_name": role_name,
        "role_description": role_description,
        "is_department_lead": is_department_lead,
        "reports_to": user.reports_to,
        "reports_to_name": reports_to_name,
        "salary": float(user.salary) if user.salary else None,
        "commission_rate": float(user.commission_rate) if user.commission_rate else None,
        "receives_commission": user.receives_commission,
        "date_created": user.date_created.isoformat() if user.date_created else None,
        "date_updated": user.date_updated.isoformat() if user.date_updated else None,
        "timezone": user.timezone,
        "timezone_mode": user.timezone_mode,
        "contacts_autosave": user.contacts_autosave,
    }), 200
    
@user_bp.route("/sales_reps", methods=["GET"])
def get_sales_reps():
    sales_reps = Users.query.filter_by(role_id=3).all()
    return jsonify([
        {
            "user_id": user.user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "branch_id": user.branch_id
        } for user in sales_reps
    ]), 200
    
