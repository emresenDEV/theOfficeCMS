from flask import Blueprint, request, jsonify
from models import Region
from database import db

region_bp = Blueprint("regions", __name__)

@region_bp.route("/", methods=["GET"])
def get_regions():
    regions = Region.query.order_by(Region.region_name.asc()).all()
    return jsonify([
        {"region_id": region.region_id, "region_name": region.region_name}
        for region in regions
    ]), 200

@region_bp.route("/", methods=["POST"])
def add_region():
    data = request.json or {}
    region_name = data.get("region_name")
    if not region_name:
        return jsonify({"error": "Region name is required"}), 400

    existing = Region.query.filter_by(region_name=region_name).first()
    if existing:
        return jsonify({"region_id": existing.region_id, "region_name": existing.region_name}), 200

    region = Region(region_name=region_name)
    db.session.add(region)
    db.session.commit()
    return jsonify({"region_id": region.region_id, "region_name": region.region_name}), 201

@region_bp.route("/<int:region_id>", methods=["PUT"])
def update_region(region_id):
    region = Region.query.get(region_id)
    if not region:
        return jsonify({"error": "Region not found"}), 404

    data = request.json or {}
    new_name = data.get("region_name")
    if not new_name:
        return jsonify({"error": "Region name is required"}), 400

    region.region_name = new_name
    db.session.commit()
    return jsonify({"message": "Region updated"}), 200
