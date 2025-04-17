from flask import Blueprint, request, jsonify
from models import Service
from flask_cors import cross_origin
from database import db

service_bp = Blueprint("service", __name__)

# Update Service Status (Pending to Paid, Past Due, etc.)
@service_bp.route("/services/<int:service_id>/update_status", methods=["PUT", "OPTIONS"])
@cross_origin(origins=[
    "http://localhost:5174",
    "https://theofficecms.com"
], supports_credentials=True)
def update_service_status(service_id):
    if request.method == "OPTIONS":
        origin = request.headers.get("Origin", "https://theofficecms.com")
        if origin not in ["http://localhost:5174", "https://theofficecms.com"]:
            origin = "https://theofficecms.com"

        response = jsonify({"message": "CORS preflight OK"})
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "PUT, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response, 200


    data = request.json
    new_status = data.get("status")

    if not new_status:
        return jsonify({"error": "Status is required"}), 400

    invoice = Service.query.get_or_404(service_id)
    invoice.status = new_status
    db.session.commit()

    return jsonify({"message": f"Service {service_id} status updated to {new_status}"}), 200

# Create a new service
@service_bp.route("/", methods=["POST"])
@cross_origin(origins=[
    "http://localhost:5174",
    "https://theofficecms.com"
], supports_credentials=True)
def create_service():
    data = request.get_json()

    new_service = Service(
        service_name=data["service_name"],
        price_per_unit=data["price_per_unit"]
    )
    db.session.add(new_service)
    db.session.commit()
    return jsonify({"message": "Service created", "service_id": new_service.service_id}), 201

# Get all services
@service_bp.route("/", methods=["GET"])
@cross_origin(origins=[
    "http://localhost:5174",
    "https://theofficecms.com"
], supports_credentials=True)
def get_services():
    services = Service.query.all()
    return jsonify([
        {
            "service_id": s.service_id,
            "service_name": s.service_name,
            "price_per_unit": float(s.price_per_unit)
        } for s in services
    ])

# Update a service by ID
@service_bp.route("/<int:service_id>", methods=["PUT"])
@cross_origin(origins=[
    "http://localhost:5174",
    "https://theofficecms.com"
], supports_credentials=True)
def update_service(service_id):
    service = Service.query.get_or_404(service_id)
    data = request.get_json()

    service.service_name = data.get("service_name", service.service_name)
    service.price_per_unit = data.get("price_per_unit", service.price_per_unit)

    db.session.commit()
    return jsonify({"message": "Service updated successfully"}), 200

# Delete a service by ID
@service_bp.route("/<int:service_id>", methods=["DELETE"])
@cross_origin(origins=[
    "http://localhost:5174",
    "https://theofficecms.com"
], supports_credentials=True)
def delete_service(service_id):
    service = Service.query.get_or_404(service_id)
    db.session.delete(service)
    db.session.commit()
    return jsonify({"message": "Service deleted"}), 200
