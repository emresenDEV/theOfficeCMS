from flask import Blueprint, request, jsonify, session
from models import Users, Departments
from database import db
from werkzeug.security import check_password_hash

auth_bp = Blueprint("auth", __name__)  # ✅ Define Blueprint

# ✅ LOGIN Endpoint
@auth_bp.route("/login", methods=["POST"])
def login():
    """✅ Authenticate user and start session"""
    data = request.json
    user = Users.query.filter_by(username=data["username"]).first()

    if user and check_password_hash(user.password_hash, data["password"]):
        session["user_id"] = user.user_id
        session.permanent = True  # ✅ Make session persistent

        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user.user_id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name
            }
        }), 200

    return jsonify({"message": "Invalid credentials"}), 401




# ✅ SESSION Endpoint
# @auth_bp.route("/auth/session", methods=["GET"])
@auth_bp.route("/session", methods=["GET"])
def get_session():
    """✅ Check if user session exists and return full user data"""
    user_id = session.get("user_id")
    
    if not user_id:
        return jsonify({"user": None}), 200  # ✅ Instead of 401, return user: None

    user = Users.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404  # Not Found
    
    department_name = None
    if user.department_id:
        department = db.session.query(Departments).filter_by(department_id=user.department_id).first()
        department_name = department.name if department else "Unknown"

    return jsonify({
        "user": {
            "id": user.user_id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role_id,
            "department_id": user.department_id,
            "department_name": department_name,
        }
    }), 200



# ✅ CHECK SESSION STATUS
# @auth_bp.route("/session", methods=["GET"])
# def session_status():
#     """Check if user is logged in and return user info."""
#     user_id = session.get("user_id")
#     if not user_id:
#         return jsonify(None), 401

#     user = Users.query.get(user_id)
#     if not user:
#         return jsonify(None), 401

#     return jsonify({
#         "user_id": user.user_id,
#         "username": user.username,
#         "firstName": user.first_name,
#         "lastName": user.last_name,
#         "role": user.role_id,
#         "department_id": user.department_id
#     }), 200

# ✅ LOGOUT Endpoint
@auth_bp.route("/logout", methods=["POST"])
def logout():
    """Logout user and clear session"""
    session.pop("user_id", None)
    return jsonify({"message": "Logged out successfully"}), 200
