from flask import Blueprint, request, jsonify
from models import Tasks
from database import db

task_bp = Blueprint("tasks", __name__)

@task_bp.route("/", methods=["GET"])
def get_tasks():
    user_id = request.args.get("user_id")
    tasks = Tasks.query.filter_by(user_id=user_id).all()
    return jsonify([{"id": task.id, "text": task.text} for task in tasks])
