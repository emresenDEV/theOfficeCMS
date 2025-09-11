from flask import Blueprint, request, jsonify, session
from models import Users, Departments, UserRoles
from database import db
from flask_cors import cross_origin
from werkzeug.security import check_password_hash

auth_bp = Blueprint("auth", __name__)

# LOGIN Endpoint
@auth_bp.route("/login", methods=["POST"])
@cross_origin(origins=[
    "http://localhost:5174",
    "https://theofficecms.com"
], supports_credentials=True)

def login():
    """ Authenticate user and start session"""
    data = request.json
    user = Users.query.filter_by(username=data["username"]).first()

    if user and check_password_hash(user.password_hash, data["password"]):
        session.clear()  
        session["user_id"] = user.user_id
        session["username"] = user.username
        session["email"] = user.email
        session.permanent = True  
        session.modified = True  

        print("🟢 DEBUG: Session after login ->", dict(session))  #  Check session data in logs

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


@auth_bp.route("/session", methods=["GET"])
@cross_origin(origins=[
    "http://localhost:5174",
    "https://theofficecms.com"
], supports_credentials=True)

def get_session():
    """ Fetch full logged-in user profile for session"""
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    user = Users.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Fetch department and role
    department = Departments.query.get(user.department_id)
    role = UserRoles.query.get(user.role_id)

    return jsonify({
        "user_id": user.user_id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "phone_number": user.phone_number,
        "extension": user.extension,
        "department_id": user.department_id,
        "department_name": department.department_name if department else None,
        "role_id": user.role_id,
        "role_name": role.role_name if role else None,
        "role_description": role.description if role else None,
        "is_department_lead": role.is_lead if role else False,
        "branch_id": user.branch_id,
        "receives_commission": user.receives_commission,
        "commission_rate": float(user.commission_rate) if user.commission_rate else None,
        "salary": float(user.salary) if user.salary else None,
    }), 200

    
# Debugger 
@auth_bp.route("/debug-session", methods=["GET"])
def debug_session():
    print("🟢 DEBUG: Session data ->", dict(session))  #  Log session data
    return jsonify({"session": dict(session)}), 200


#  LOGOUT Endpoint
@auth_bp.route("/logout", methods=["POST"])
@cross_origin(origins=[
    "http://localhost:5174",
    "https://theofficecms.com"
], supports_credentials=True)

def logout():
    """Logout user and clear session"""
    session.pop("user_id", None)
    return jsonify({"message": "Logged out successfully"}), 200
