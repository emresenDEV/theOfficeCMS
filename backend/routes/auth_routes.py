from flask import Blueprint, request, jsonify, session
from models import Users, Departments, UserRoles
from database import db
from flask_cors import cross_origin
from werkzeug.security import check_password_hash

auth_bp = Blueprint("auth", __name__)  # ✅ Define Blueprint

# ✅ LOGIN Endpoint
@auth_bp.route("/login", methods=["POST"])
@cross_origin(origin="http://localhost:5174", supports_credentials=True) 
def login():
    """✅ Authenticate user and start session"""
    data = request.json
    user = Users.query.filter_by(username=data["username"]).first()

    if user and check_password_hash(user.password_hash, data["password"]):
        session.clear()  # ✅ Clear old session to prevent conflicts
        session["user_id"] = user.user_id
        session["username"] = user.username
        session["email"] = user.email
        session.permanent = True  
        session.modified = True  # ✅ Ensure session is written to storage

        print("🟢 DEBUG: Session after login ->", dict(session))  # ✅ Check session data in logs

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
# @auth_bp.route("/session", methods=["GET"])
@cross_origin(origin="http://localhost:5174", supports_credentials=True) 
def get_session():
    """✅ Fetch logged-in user session"""
    user_id = session.get("user_id")
    
    if not user_id:
        print("❌ DEBUG: No active session found.")  # ✅ Log debug info
        return jsonify({"error": "Not logged in"}), 401

    # ✅ Join with Departments (Optional) and UserRoles (Required)
    user = (
        db.session.query(Users, Departments.department_name, UserRoles.role_name)
        .outerjoin(Departments, Users.department_id == Departments.department_id)
        .outerjoin(UserRoles, Users.role_id == UserRoles.role_id)  # ✅ Join with user_roles
        .filter(Users.user_id == user_id)
        .first()
    )

    if not user:
        print("❌ DEBUG: User not found in database.")  # ✅ Debug missing users
        return jsonify({"error": "User not found"}), 404

    user_obj, department_name, role_name = user  # Unpacking tuple

    return jsonify({
        "user_id": user_obj.user_id,
        "first_name": user_obj.first_name,
        "last_name": user_obj.last_name,
        "department_name": department_name or "Department Unknown",
        "role": role_name or "Unknown Role",
    }), 200

    
# Debugger 
@auth_bp.route("/debug-session", methods=["GET"])
def debug_session():
    print("🟢 DEBUG: Session data ->", dict(session))  # ✅ Log session data
    return jsonify({"session": dict(session)}), 200


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
@cross_origin(origin="http://localhost:5174", supports_credentials=True) 
def logout():
    """Logout user and clear session"""
    session.pop("user_id", None)
    return jsonify({"message": "Logged out successfully"}), 200
