from flask import Blueprint, request, jsonify
from models import Tasks, Users
from database import db

task_bp = Blueprint("tasks", __name__)

# ✅ Fetch Tasks Assigned to User
@task_bp.route("/", methods=["GET"])
def get_tasks():
    user_id = request.args.get("user_id", type=int)

    if not user_id:
        return jsonify({"message": "User ID required"}), 400

    tasks = Tasks.query.filter_by(assigned_to=user_id).all()

    return jsonify([{
        "task_id": task.task_id,
        "user_id": task.user_id,
        "assigned_to": task.assigned_to,
        "task_description": task.task_description,
        "due_date": task.due_date,
        "is_completed": task.is_completed,
        "created_by": Users.query.get(task.user_id).username if task.user_id else "Unknown"
    } for task in tasks])

# ✅ Create a New Task
@task_bp.route("/", methods=["POST"])
def create_task():
    if request.method == "OPTIONS":
        return jsonify({"message": "CORS Preflight OK"}), 200  # ✅ Respond to preflight request

    data = request.json
    required_fields = ["user_id", "task_description", "due_date"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    new_task = Tasks(
        user_id=data["user_id"],
        assigned_to=data.get("assigned_to", data["user_id"]),  # Defaults to creator
        task_description=data["task_description"],
        due_date=data["due_date"],
        account_id=data.get("account_id"),  # Optional field
        is_completed=False
    )

    db.session.add(new_task)
    db.session.commit()

    return jsonify({
        "task_id": new_task.task_id,
        "user_id": new_task.user_id,
        "assigned_to": new_task.assigned_to,
        "task_description": new_task.task_description,
        "due_date": new_task.due_date,
        "is_completed": new_task.is_completed,
        "account_id": new_task.account_id,
    }), 201


# ✅ Update an Existing Task
@task_bp.route("/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    task = Tasks.query.get(task_id)

    if not task:
        return jsonify({"message": "Task not found"}), 404

    data = request.json
    if "task_description" in data:
        task.task_description = data["task_description"]
    if "due_date" in data:
        task.due_date = data["due_date"]
    if "is_completed" in data:
        task.is_completed = data["is_completed"]

    db.session.commit()

    return jsonify({
        "task_id": task.task_id,
        "user_id": task.user_id,
        "assigned_to": task.assigned_to,
        "task_description": task.task_description,
        "due_date": task.due_date,
        "is_completed": task.is_completed
    }), 200

# ✅ Delete a Task
@task_bp.route("/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Tasks.query.get(task_id)

    if not task:
        return jsonify({"message": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()

    return jsonify({"message": "Task deleted successfully"}), 200
