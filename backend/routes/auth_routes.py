from flask import Blueprint, request, jsonify, session
from models import Users
from database import db
from werkzeug.security import check_password_hash

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    user = Users.query.filter_by(username=data["username"]).first()

    if user and check_password_hash(user.password_hash, data["password"]):
        session["user_id"] = user.id
        return jsonify({"message": "Login successful", "user": {"id": user.id, "username": user.username}}), 200

    return jsonify({"message": "Invalid credentials"}), 401

@auth_bp.route("/session", methods=["GET"])
def get_session():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify(None), 401
    user = Users.query.get(user_id)
    return jsonify({"id": user.id, "username": user.username}), 200

# =========================================
# 📌 SESSION STATUS
# =========================================
@app.route("/session", methods=["GET"])
def session_status():
    """✅ Check user session & ensure it persists"""
    if "user_id" not in session:
        return jsonify(None), 401

    user = Users.query.get(session["user_id"])
    if not user:
        return jsonify(None), 401

    return jsonify({
        "id": user.user_id,
        "username": user.username,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "role": user.role_id,
        "department_id": user.department_id
    }), 200

# @app.route("/login", methods=["OPTIONS", "POST"])
# def login():
#     if request.method == "OPTIONS":
#         response = jsonify({"message": "CORS preflight"})
#         response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
#         response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
#         response.headers["Access-Control-Allow-Headers"] = "Content-Type"
#         response.headers["Access-Control-Allow-Credentials"] = "true"
#         return response, 200

#     data = request.get_json()  # ✅ Ensure JSON parsing
#     if not data or "username" not in data or "password" not in data:
#         return jsonify({"message": "Invalid request format"}), 400

#     user = Users.query.filter_by(username=data["username"]).first()

#     if user and user.check_password(data["password"]):  # ✅ Fixed password check
#         session["user_id"] = user.user_id  # ✅ Store session

#         response = jsonify({
#             "message": "Login successful",
#             "user": {
#                 "id": user.user_id,
#                 "username": user.username,
#                 "firstName": user.first_name,
#                 "lastName": user.last_name,
#                 "role": user.role_id,
#                 "department_id": user.department_id
#             }
#         })
#         response.headers["Access-Control-Allow-Credentials"] = "true"  # ✅ CORS fix
#         return response, 200

#     return jsonify({"message": "Invalid username or password"}), 401
