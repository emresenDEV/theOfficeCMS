from flask import Blueprint, request, jsonify, session
from models import Users
from database import db
from werkzeug.security import check_password_hash

auth_bp = Blueprint("auth", __name__)  # ✅ Define Blueprint

# ✅ LOGIN Endpoint
@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user and start a session"""
    data = request.json
    user = Users.query.filter_by(username=data["username"]).first()

    if user and check_password_hash(user.password_hash, data["password"]):  # ✅ Correct password check
        session["user_id"] = user.id  # ✅ Store session
        return jsonify({"message": "Login successful", "user": {"id": user.id, "username": user.username}}), 200

    return jsonify({"message": "Invalid credentials"}), 401

# ✅ CHECK SESSION STATUS
@auth_bp.route("/session", methods=["GET"])
def session_status():
    """Check if user is logged in and return user info."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify(None), 401

    user = Users.query.get(user_id)
    if not user:
        return jsonify(None), 401

    return jsonify({
        "id": user.id,
        "username": user.username,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "role": user.role_id,
        "department_id": user.department_id
    }), 200

# ✅ LOGOUT Endpoint
@auth_bp.route("/logout", methods=["POST"])
def logout():
    """Logout user and clear session"""
    session.pop("user_id", None)
    return jsonify({"message": "Logged out successfully"}), 200
