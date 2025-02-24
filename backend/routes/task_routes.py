from flask import Blueprint, request, jsonify
from models import Tasks, Users, Account
from database import db
from flask_cors import cross_origin

task_bp = Blueprint("tasks", __name__)

@task_bp.route("", methods=["OPTIONS"])
@task_bp.route("/", methods=["OPTIONS"])
def options_tasks():
    """✅ Handle CORS preflight for /tasks"""
    response = jsonify({"message": "CORS preflight OK"})
    response.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", "http://localhost:5174")
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response, 200



# ✅ Fetch Tasks Assigned to User
@task_bp.route("/", methods=["GET"])
@cross_origin(supports_credentials=True)
def get_tasks():
    user_id = request.args.get("assigned_to", type=int)
    print(f"🔍 DEBUG: Received user_id = {user_id}")  # ✅ Add debugging

    if not user_id:
        return jsonify({"message": "User ID required"}), 400

    tasks = Tasks.query.filter(Tasks.assigned_to == user_id).all()


    return jsonify([{
        "task_id": task.task_id,
        "user_id": task.user_id,  # Creator of the task
        "assigned_to": task.assigned_to,  # Who the task is assigned to
        "task_description": task.task_description,
        "due_date": task.due_date,
        "is_completed": task.is_completed,
        "account_id": task.account_id, # If task is associated with an account
        "account_name": Account.query.get(task.account_id).business_name if task.account_id else "No Account", # Name of associated account
        "created_by": Users.query.get(task.user_id).username if task.user_id else "Unknown",  # ✅ Show creator's username
        "date_created": task.date_created.strftime("%Y-%m-%d %H:%M:%S") if task.date_created else None,
    } for task in tasks])

# ✅ Fetch Tasks By Account ID
@task_bp.route("/accounts/<int:account_id>/tasks", methods=["GET"])
@cross_origin(supports_credentials=True)
def get_tasks_by_account(account_id):
    """Fetch all tasks associated with a specific account"""
    tasks = Tasks.query.filter_by(account_id=account_id).all()

    if not tasks:
        return jsonify([]), 200  # Return empty list if no tasks found

    return jsonify([{
        "task_id": task.task_id,
        "user_id": task.user_id,  # Creator of the task
        "assigned_to": task.assigned_to,  # Who the task is assigned to
        "task_description": task.task_description,
        "due_date": task.due_date,
        "is_completed": task.is_completed,
        "account_id": task.account_id,  # If task is associated with an account
        "account_name": Account.query.get(task.account_id).business_name if task.account_id else "No Account",
        "created_by": Users.query.get(task.user_id).username if task.user_id else "Unknown",
        "date_created": task.date_created.strftime("%Y-%m-%d %H:%M:%S") if task.date_created else None,
    } for task in tasks])



# ✅ Create a New Task
@task_bp.route("", methods=["POST"])
@task_bp.route("/", methods=["POST"])
@cross_origin(supports_credentials=True)
def create_task():
    data = request.json
    required_fields = ["user_id", "task_description", "due_date"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    new_task = Tasks(
        user_id=data["user_id"],
        assigned_to=data.get("assigned_to", data["user_id"]),
        task_description=data["task_description"],
        due_date=data["due_date"],
        account_id=data.get("account_id"),  
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
@cross_origin()
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
@cross_origin()
def delete_task(task_id):
    task = Tasks.query.get(task_id)

    if not task:
        return jsonify({"message": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()

    return jsonify({"message": "Task deleted successfully"}), 200
