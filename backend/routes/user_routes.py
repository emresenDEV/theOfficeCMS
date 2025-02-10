from flask import Blueprint, request, jsonify
from models import Users
from database import db

user_bp = Blueprint("user", __name__)

# Users API
@user_bp.route("/users", methods=["GET"])
def get_users():
    users = Users.query.all()
    return jsonify([
        {
            "user_id": user.user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role_id": user.role_id,
            "department_id": user.department_id,
            "reports_to": user.reports_to,
            "email": user.email
        } for user in users
    ]), 200