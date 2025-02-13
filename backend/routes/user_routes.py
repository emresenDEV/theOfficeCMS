from flask import Blueprint, request, jsonify
from models import Users
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
            "role_id": user.role_id,
            "department_id": user.department_id,
            "reports_to": user.reports_to,
            "email": user.email,
            "branch_id": user.branch_id
        } for user in users
    ]), 200
