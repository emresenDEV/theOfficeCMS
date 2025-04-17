from flask import Blueprint, request, jsonify
from models import Users, Branches, Departments, UserRoles
from database import db
from flask_cors import cross_origin

user_bp = Blueprint("users", __name__)

# Users API
@user_bp.route("/", methods=["GET"])
@cross_origin(origins=[
    "http://localhost:5174",
    "https://theofficecms.com"
], supports_credentials=True)
def get_users():
    branch_id = request.args.get("branch_id", type=int)
    department_id = request.args.get("department_id", type=int)

    query = Users.query

    if branch_id:
        query = query.filter_by(branch_id=branch_id)

    if department_id:
        query = query.filter_by(department_id=department_id)

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
            "branch_id": user.branch_id
        } for user in users
    ]), 200


@user_bp.route("/<int:user_id>", methods=["GET"])
@cross_origin(origins=[
    "http://localhost:5174",
    "https://theofficecms.com"
], supports_credentials=True)
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
    }), 200
    
@user_bp.route("/sales_reps", methods=["GET"])
@cross_origin(origins=[
    "http://localhost:5174",
    "https://theofficecms.com"
], supports_credentials=True)
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
    