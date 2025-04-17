from flask import Blueprint, jsonify, request
from models import Users, Departments
from database import db
from flask_cors import cross_origin

employee_bp = Blueprint("employees", __name__)

@employee_bp.route("", methods=["OPTIONS"])
@employee_bp.route("/", methods=["OPTIONS"])
def options_branch():
    """ Handle CORS preflight for /employees"""
    origin = request.headers.get("Origin", "https://theofficecms.com")
    if origin not in ["http://localhost:5174", "https://theofficecms.com"]:
        origin = "https://theofficecms.com"

    response = jsonify({"message": "CORS preflight OK"})
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response, 200



@employee_bp.route("/", methods=["GET"])
@cross_origin(origins=[
    "http://localhost:5174",
    "https://theofficecms.com"
], supports_credentials=True)
def get_employees():
    department_id = request.args.get("department_id")  # Get department_id from query params
    if department_id:
        employees = (
            db.session.query(
                Users.user_id,
                Users.first_name,
                Users.last_name,
                Users.department_id,
                Departments.department_name  # Fetch the department name from the Departments table
            )
            .join(Departments, Users.department_id == Departments.department_id)  # Join with Departments table
            .filter(Users.department_id == department_id)
            .all()
        )
    else:
        employees = (
            db.session.query(
                Users.user_id,
                Users.first_name,
                Users.last_name,
                Users.department_id,
                Departments.department_name
            )
            .join(Departments, Users.department_id == Departments.department_id)
            .all()
        )

    return jsonify([
        {
            "user_id": emp.user_id,
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "department_id": emp.department_id,
            "department_name": emp.department_name  # Include department name
        }
        for emp in employees
    ])