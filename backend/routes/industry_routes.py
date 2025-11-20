from flask import Blueprint, request, jsonify
from models import Industry
from database import db

# Create Blueprint
industry_bp = Blueprint("industries", __name__)

# GET All Industries
@industry_bp.route("/", methods=["GET"])
def get_industries():
    """Fetch all industries"""
    industries = Industry.query.all()
    return jsonify([{
        "industry_id": industry.industry_id,
        "industry_name": industry.industry_name
    } for industry in industries]), 200

# CREATE New Industry
@industry_bp.route("/", methods=["POST"])
def add_industry():
    """ Add a new industry and return its ID"""
    data = request.json
    industry_name = data.get("industry_name")

    if not industry_name:
        return jsonify({"error": "Industry name is required"}), 400

    new_industry = Industry(industry_name=industry_name)
    db.session.add(new_industry)
    db.session.commit()

    return jsonify({
        "message": "Industry added successfully",
        "industry_id": new_industry.industry_id
    }), 201

# UPDATE Industry Name
@industry_bp.route("/<int:industry_id>", methods=["PUT"])
def update_industry(industry_id):
    """Update an industry name"""
    industry = Industry.query.get(industry_id)

    if not industry:
        return jsonify({"error": "Industry not found"}), 404

    data = request.json
    new_name = data.get("industry_name")

    if not new_name:
        return jsonify({"error": "New industry name is required"}), 400

    industry.industry_name = new_name
    db.session.commit()

    return jsonify({"message": "Industry updated successfully"}), 200
