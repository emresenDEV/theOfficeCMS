from flask import Blueprint, request, jsonify
from models import Users, Branches, Departments, UserRoles
from database import db
from flask_cors import cross_origin

user_bp = Blueprint("users", __name__)

# Users API
@user_bp.route("/", methods=["GET"])
@cross_origin(supports_credentials=True)
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

# Fetch a specific user's profile
@user_bp.route("/<int:user_id>", methods=["GET"])
@cross_origin(supports_credentials=True)
def get_user_by_id(user_id):
    """Retrieve detailed profile information for a specific user."""
    user = Users.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # ✅ Fetch department name
    department_name = None
    if user.department_id:
        department = Departments.query.get(user.department_id)
        department_name = department.department_name if department else "Unknown"

    # ✅ Fetch role name
    role_name = None
    if user.role_id:
        role = UserRoles.query.get(user.role_id)
        role_name = role.role_name if role else "Unknown"

    # ✅ Fetch branch name
    branch_name = None
    if user.branch_id:
        branch = Branches.query.get(user.branch_id)
        branch_name = branch.branch_name if branch else "Unknown"

    return jsonify({
        "user_id": user.user_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "username": user.username,
        "email": user.email,
        "branch_id": user.branch_id,
        "branch_name": branch_name,  # ✅ Includes branch name
        "department_id": user.department_id,
        "department_name": department_name,  # ✅ Includes department name
        "role_id": user.role_id,
        "role_name": role_name,  # ✅ Includes role name
        "reports_to": user.reports_to
    }), 200