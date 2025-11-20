from flask import Blueprint, jsonify, request
from models import Departments
from database import db

department_bp = Blueprint("departments", __name__)


@department_bp.route("/", methods=["GET"])
def get_departments():
    """ Fetch all departments (No filtering by branch_id)"""
    departments = Departments.query.all()
    
    return jsonify([{
        "department_id": dept.department_id,
        "department_name": dept.department_name
    } for dept in departments])
