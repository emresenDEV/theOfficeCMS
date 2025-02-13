from flask import Blueprint, jsonify, request
from models import Departments
from database import db
from flask_cors import cross_origin

department_bp = Blueprint("departments", __name__)

@department_bp.route("", methods=["OPTIONS"])
@department_bp.route("/", methods=["OPTIONS"])
def options_branch():
    """✅ Handle CORS preflight for /tasks"""
    response = jsonify({"message": "CORS preflight OK"})
    response.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", "http://localhost:5174")
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response, 200

@department_bp.route("/", methods=["GET"])
@cross_origin(supports_credentials=True)
def get_departments():
    """✅ Fetch all departments (No filtering by branch_id)"""
    departments = Departments.query.all()
    
    return jsonify([{
        "department_id": dept.department_id,
        "department_name": dept.department_name
    } for dept in departments])
