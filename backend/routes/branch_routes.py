from flask import Blueprint, jsonify, request
from models import Branches
from database import db
from flask_cors import cross_origin

branch_bp = Blueprint("branches", __name__)

@branch_bp.route("", methods=["OPTIONS"])
@branch_bp.route("/", methods=["OPTIONS"])
def options_branch():
    """✅ Handle CORS preflight for /tasks"""
    response = jsonify({"message": "CORS preflight OK"})
    response.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", "http://localhost:5174")
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response, 200

@branch_bp.route("/", methods=["GET"])
@cross_origin(supports_credentials=True)
def get_branches():
    branches = Branches.query.all()
    return jsonify([{
        "branch_id": branch.branch_id,
        "branch_name": branch.branch_name
    } for branch in branches])
