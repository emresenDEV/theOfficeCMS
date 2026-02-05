from flask import Blueprint, request, jsonify
from models import Tasks, TaskNotes, Users, Account, ContactFollowers
from database import db
from notifications import create_notification
from audit import create_audit_log

task_bp = Blueprint("tasks", __name__)


def _notify_contact_followers(contact_id, actor_user_id, title, message, link):
    if not contact_id:
        return
    follower_rows = ContactFollowers.query.filter_by(contact_id=contact_id).all()
    for row in follower_rows:
        if actor_user_id and row.user_id == actor_user_id:
            continue
        create_notification(
            user_id=row.user_id,
            notif_type="contact_activity",
            title=title,
            message=message,
            link=link,
            source_type="contact",
            source_id=contact_id,
        )


#  Fetch Tasks Assigned to User
@task_bp.route("/", methods=["GET"])
def get_tasks():
    user_id = request.args.get("assigned_to", type=int)
    include_all = request.args.get("all", "false").lower() == "true"
    account_id = request.args.get("account_id", type=int)
    contact_id = request.args.get("contact_id", type=int)
    print(f"🔍 DEBUG: Received user_id = {user_id}")  #  Add debugging

    if not user_id and not include_all:
        return jsonify({"message": "User ID required"}), 400

    query = Tasks.query
    if user_id:
        query = query.filter(Tasks.assigned_to == user_id)
    if account_id:
        query = query.filter(Tasks.account_id == account_id)
    if contact_id:
        query = query.filter(Tasks.contact_id == contact_id)

    tasks = query.all()


    return jsonify([{
        "task_id": task.task_id,
        "user_id": task.user_id,  # Creator of the task
        "assigned_to": task.assigned_to,  # Who the task is assigned to
        "task_description": task.task_description,
        "due_date": task.due_date,
        "is_completed": task.is_completed,
        "account_id": task.account_id, # If task is associated with an account
        "invoice_id": task.invoice_id,
        "contact_id": task.contact_id,
        "account_name": Account.query.get(task.account_id).business_name if task.account_id else "No Account", # Name of associated account
        "created_by": Users.query.get(task.user_id).username if task.user_id else "Unknown",  #  Show creator's username
        "date_created": task.date_created.strftime("%Y-%m-%d %H:%M:%S") if task.date_created else None,
    } for task in tasks])

# Fetch Tasks By Account ID
@task_bp.route("/accounts/<int:account_id>/tasks", methods=["GET"])
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
        "invoice_id": task.invoice_id,
        "contact_id": task.contact_id,
        "account_name": Account.query.get(task.account_id).business_name if task.account_id else "No Account",
        "created_by": Users.query.get(task.user_id).username if task.user_id else "Unknown",
        "date_created": task.date_created.strftime("%Y-%m-%d %H:%M:%S") if task.date_created else None,
    } for task in tasks])


# Fetch Task By ID
@task_bp.route("/<int:task_id>", methods=["GET"])
def get_task_by_id(task_id):
    task = Tasks.query.get(task_id)
    if not task:
        return jsonify({"message": "Task not found"}), 404

    creator = Users.query.get(task.user_id) if task.user_id else None
    assignee = Users.query.get(task.assigned_to) if task.assigned_to else None
    account = Account.query.get(task.account_id) if task.account_id else None

    return jsonify({
        "task_id": task.task_id,
        "user_id": task.user_id,
        "assigned_to": task.assigned_to,
        "task_description": task.task_description,
        "due_date": task.due_date,
        "is_completed": task.is_completed,
        "account_id": task.account_id,
        "invoice_id": task.invoice_id,
        "contact_id": task.contact_id,
        "account_name": account.business_name if account else None,
        "created_by": creator.username if creator else None,
        "assigned_to_name": f"{assignee.first_name} {assignee.last_name}".strip() if assignee else None,
        "date_created": task.date_created.strftime("%Y-%m-%d %H:%M:%S") if task.date_created else None,
    }), 200


@task_bp.route("/<int:task_id>/notes", methods=["GET"])
def get_task_notes(task_id):
    notes = db.session.query(TaskNotes, Users.username).join(
        Users, TaskNotes.user_id == Users.user_id
    ).filter(TaskNotes.task_id == task_id).order_by(TaskNotes.created_at.desc()).all()

    return jsonify([
        {
            "task_note_id": note.TaskNotes.task_note_id,
            "task_id": note.TaskNotes.task_id,
            "user_id": note.TaskNotes.user_id,
            "username": note.username,
            "note_text": note.TaskNotes.note_text,
            "created_at": note.TaskNotes.created_at.strftime("%Y-%m-%d %H:%M:%S") if note.TaskNotes.created_at else None,
        }
        for note in notes
    ]), 200


@task_bp.route("/<int:task_id>/notes", methods=["POST"])
def create_task_note(task_id):
    data = request.json or {}
    user_id = data.get("user_id")
    note_text = data.get("note_text")

    if not user_id or not note_text:
        return jsonify({"error": "user_id and note_text are required"}), 400

    task = Tasks.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    note = TaskNotes(
        task_id=task_id,
        user_id=user_id,
        note_text=note_text,
        created_at=db.func.current_timestamp(),
    )
    db.session.add(note)
    db.session.flush()

    create_audit_log(
        entity_type="task_note",
        entity_id=note.task_note_id,
        action="create",
        user_id=data.get("actor_user_id") or user_id,
        user_email=data.get("actor_email"),
        after_data={
            "task_note_id": note.task_note_id,
            "task_id": task_id,
            "user_id": user_id,
            "note_text": note_text,
        },
        account_id=task.account_id,
        invoice_id=task.invoice_id,
        contact_id=task.contact_id,
    )

    db.session.commit()

    username = Users.query.get(user_id).username if user_id else None
    return jsonify({
        "task_note_id": note.task_note_id,
        "task_id": note.task_id,
        "user_id": note.user_id,
        "username": username,
        "note_text": note.note_text,
        "created_at": note.created_at.strftime("%Y-%m-%d %H:%M:%S") if note.created_at else None,
    }), 201

# Fetch Tasks By Invoice ID
@task_bp.route("/invoice/<int:invoice_id>", methods=["GET"])
def get_tasks_by_invoice(invoice_id):
    tasks = Tasks.query.filter_by(invoice_id=invoice_id).all()
    if not tasks:
        return jsonify([]), 200

    return jsonify([{
        "task_id": task.task_id,
        "user_id": task.user_id,
        "assigned_to": task.assigned_to,
        "task_description": task.task_description,
        "due_date": task.due_date,
        "is_completed": task.is_completed,
        "account_id": task.account_id,
        "invoice_id": task.invoice_id,
        "account_name": Account.query.get(task.account_id).business_name if task.account_id else "No Account",
        "created_by": Users.query.get(task.user_id).username if task.user_id else "Unknown",
        "date_created": task.date_created.strftime("%Y-%m-%d %H:%M:%S") if task.date_created else None,
    } for task in tasks])



# Create a New Task
@task_bp.route("", methods=["POST"])
@task_bp.route("/", methods=["POST"])
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
        invoice_id=data.get("invoice_id"),
        contact_id=data.get("contact_id"),
        is_completed=False
    )

    db.session.add(new_task)
    db.session.flush()

    account = Account.query.get(new_task.account_id) if new_task.account_id else None
    notification_link = f"/tasks/{new_task.task_id}"
    contact_link = f"/contacts/{new_task.contact_id}?taskId={new_task.task_id}" if new_task.contact_id else notification_link

    create_notification(
        user_id=new_task.assigned_to,
        notif_type="task_assigned",
        title="New task assigned",
        message=account.business_name if account else new_task.task_description,
        link=notification_link,
        source_type="task",
        source_id=new_task.task_id,
    )

    _notify_contact_followers(
        new_task.contact_id,
        data.get("actor_user_id") or new_task.user_id,
        "Contact task created",
        new_task.task_description,
        contact_link,
    )
    create_audit_log(
        entity_type="task",
        entity_id=new_task.task_id,
        action="create",
        user_id=data.get("actor_user_id") or new_task.user_id,
        user_email=data.get("actor_email"),
        after_data={
            "task_id": new_task.task_id,
            "user_id": new_task.user_id,
            "assigned_to": new_task.assigned_to,
            "task_description": new_task.task_description,
            "due_date": new_task.due_date,
            "is_completed": new_task.is_completed,
            "account_id": new_task.account_id,
            "invoice_id": new_task.invoice_id,
            "contact_id": new_task.contact_id,
        },
        account_id=new_task.account_id,
        invoice_id=new_task.invoice_id,
        contact_id=new_task.contact_id,
    )
    db.session.commit()

    return jsonify({
        "task_id": new_task.task_id,
        "user_id": new_task.user_id,
        "assigned_to": new_task.assigned_to,
        "task_description": new_task.task_description,
        "due_date": new_task.due_date,
        "is_completed": new_task.is_completed,
        "account_id": new_task.account_id,
        "invoice_id": new_task.invoice_id,
        "contact_id": new_task.contact_id,
    }), 201




# Update an Existing Task
@task_bp.route("/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    task = Tasks.query.get(task_id)

    if not task:
        return jsonify({"message": "Task not found"}), 404

    data = request.json
    before_data = {
        "task_id": task.task_id,
        "user_id": task.user_id,
        "assigned_to": task.assigned_to,
        "task_description": task.task_description,
        "due_date": task.due_date,
        "is_completed": task.is_completed,
        "account_id": task.account_id,
        "invoice_id": task.invoice_id,
        "contact_id": task.contact_id,
    }
    assigned_before = task.assigned_to
    was_completed = task.is_completed
    if "user_id" in data:
        task.user_id = data["user_id"]
    if "assigned_to" in data:
        task.assigned_to = data["assigned_to"]
    if "task_description" in data:
        task.task_description = data["task_description"]
    if "due_date" in data:
        task.due_date = data["due_date"]
        task.reminder_sent_at = None
        task.overdue_notified_at = None
    if "is_completed" in data:
        task.is_completed = data["is_completed"]
    if "account_id" in data:
        task.account_id = data["account_id"]
    if "invoice_id" in data:
        task.invoice_id = data["invoice_id"]
    if "contact_id" in data:
        task.contact_id = data["contact_id"]

    if assigned_before != task.assigned_to:
        account = Account.query.get(task.account_id) if task.account_id else None
        notification_link = f"/tasks/{task.task_id}"
        contact_link = f"/contacts/{task.contact_id}?taskId={task.task_id}" if task.contact_id else notification_link

        create_notification(
            user_id=task.assigned_to,
            notif_type="task_assigned",
            title="Task reassigned",
            message=account.business_name if account else task.task_description,
            link=notification_link,
            source_type="task",
            source_id=task.task_id,
        )

    if (not was_completed) and task.is_completed:
        actor_user_id = data.get("actor_user_id")
        if task.user_id and actor_user_id and actor_user_id != task.user_id:
            create_notification(
                user_id=task.user_id,
                notif_type="task_completed",
                title="Task completed",
                message=task.task_description,
                link=f"/tasks/{task.task_id}",
                source_type="task",
                source_id=task.task_id,
            )
        _notify_contact_followers(
            task.contact_id,
            actor_user_id,
            "Contact task completed",
            task.task_description,
            contact_link,
        )

    create_audit_log(
        entity_type="task",
        entity_id=task.task_id,
        action="update",
        user_id=data.get("actor_user_id") or task.user_id,
        user_email=data.get("actor_email"),
        before_data=before_data,
        after_data={
            "task_id": task.task_id,
            "user_id": task.user_id,
            "assigned_to": task.assigned_to,
            "task_description": task.task_description,
            "due_date": task.due_date,
            "is_completed": task.is_completed,
            "account_id": task.account_id,
            "invoice_id": task.invoice_id,
            "contact_id": task.contact_id,
        },
        account_id=task.account_id,
        invoice_id=task.invoice_id,
        contact_id=task.contact_id,
    )
    db.session.commit()

    return jsonify({
        "task_id": task.task_id,
        "user_id": task.user_id,
        "assigned_to": task.assigned_to,
        "task_description": task.task_description,
        "due_date": task.due_date,
        "is_completed": task.is_completed,
        "account_id": task.account_id,
        "invoice_id": task.invoice_id,
        "contact_id": task.contact_id,
    }), 200

# Delete a Task
@task_bp.route("/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Tasks.query.get(task_id)

    if not task:
        return jsonify({"message": "Task not found"}), 404

    before_data = {
        "task_id": task.task_id,
        "user_id": task.user_id,
        "assigned_to": task.assigned_to,
        "task_description": task.task_description,
        "due_date": task.due_date,
        "is_completed": task.is_completed,
        "account_id": task.account_id,
        "invoice_id": task.invoice_id,
    }

    db.session.delete(task)
    create_audit_log(
        entity_type="task",
        entity_id=task_id,
        action="delete",
        user_id=request.args.get("actor_user_id", type=int) or task.user_id,
        user_email=request.args.get("actor_email"),
        before_data=before_data,
        after_data=None,
        account_id=task.account_id,
        invoice_id=task.invoice_id,
    )
    db.session.commit()

    return jsonify({"message": "Task deleted successfully"}), 200
