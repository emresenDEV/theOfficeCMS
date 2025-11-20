from flask import Blueprint, request, jsonify
from models import UserRoles
from database import db

user_role_bp = Blueprint("user_roles", __name__)


# Fetch All Roles
@user_role_bp.route("/roles", methods=["GET"])
def get_all_roles():
    roles = UserRoles.query.all()
    return jsonify([{
        "role_id": role.role_id,
        "role_name": role.role_name,
        "reports_to": role.reports_to,
        "description": role.description,
        "is_lead": role.is_lead
    } for role in roles]), 200

# Fetch Role by ID
@user_role_bp.route("/roles/<int:role_id>", methods=["GET"])
def get_role_by_id(role_id):
    role = UserRoles.query.get(role_id)
    if not role:
        return jsonify({"message": "Role not found"}), 404

    return jsonify({
        "role_id": role.role_id,
        "role_name": role.role_name,
        "reports_to": role.reports_to,
        "description": role.description,
        "is_lead": role.is_lead
    }), 200

# Create New Role
@user_role_bp.route("/roles", methods=["POST"])
def create_role():
    data = request.json
    if not data.get("role_name"):
        return jsonify({"error": "Role name is required"}), 400

    new_role = UserRoles(
        role_name=data["role_name"],
        reports_to=data.get("reports_to"),
        description=data.get("description"),
        is_lead=data.get("is_lead", False)
    )

    db.session.add(new_role)
    db.session.commit()

    return jsonify({"message": "Role created successfully", "role_id": new_role.role_id}), 201

# Update Role
@user_role_bp.route("/roles/<int:role_id>", methods=["PUT"])
def update_role(role_id):
    role = UserRoles.query.get(role_id)
    if not role:
        return jsonify({"message": "Role not found"}), 404

    data = request.json
    role.role_name = data.get("role_name", role.role_name)
    role.reports_to = data.get("reports_to", role.reports_to)
    role.description = data.get("description", role.description)
    role.is_lead = data.get("is_lead", role.is_lead)

    db.session.commit()

    return jsonify({"message": "Role updated successfully"}), 200

# Delete Role
@user_role_bp.route("/roles/<int:role_id>", methods=["DELETE"])
def delete_role(role_id):
    role = UserRoles.query.get(role_id)
    if not role:
        return jsonify({"message": "Role not found"}), 404

    db.session.delete(role)
    db.session.commit()

    return jsonify({"message": "Role deleted successfully"}), 200
