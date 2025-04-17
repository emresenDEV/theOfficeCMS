from flask import Blueprint, jsonify, request
from models import Branches
from database import db
from flask_cors import cross_origin

branch_bp = Blueprint("branches", __name__)

@branch_bp.route("", methods=["OPTIONS"])
@branch_bp.route("/", methods=["OPTIONS"])
def options_branch():
    """Handle CORS preflight for /branches"""
    origin = request.headers.get("Origin", "https://theofficecms.com")
    if origin not in ["http://localhost:5174", "https://theofficecms.com"]:
        origin = "https://theofficecms.com"  # fallback to prod

    response = jsonify({"message": "CORS preflight OK"})
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response, 200

# Get All Branches
@branch_bp.route("/", methods=["GET"])
def get_branches():
    branches = Branches.query.all()
    return jsonify([
        {
            "branch_id": branch.branch_id,
            "branch_name": branch.branch_name,
            "address": branch.address,
            "city": branch.city,
            "state": branch.state,
            "zip_code": branch.zip_code,
            "phone_number": branch.phone_number
        }
        for branch in branches
    ])

#  Get Branch by ID
@branch_bp.route("/<int:branch_id>", methods=["GET"])
def get_branch_by_id(branch_id):
    branch = Branches.query.get(branch_id)
    if not branch:
        return jsonify({"error": "Branch not found"}), 404

    return jsonify({
        "branch_id": branch.branch_id,
        "branch_name": branch.branch_name,
        "address": branch.address,
        "city": branch.city,
        "state": branch.state,
        "zip_code": branch.zip_code,
        "phone_number": branch.phone_number
    })