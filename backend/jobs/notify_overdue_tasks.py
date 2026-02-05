from datetime import datetime

from app import app
from database import db
from models import Tasks, Account
from notifications import create_notification


def _build_task_link(task):
    if task.invoice_id:
        return f"/invoice/{task.invoice_id}?taskId={task.task_id}"
    return f"/tasks/{task.task_id}"


def notify_overdue_tasks():
    today = datetime.now().date()
    now = datetime.now()

    overdue_tasks = (
        Tasks.query
        .filter(Tasks.is_completed == False)
        .filter(Tasks.due_date.isnot(None))
        .filter(Tasks.due_date < now)
        .filter(
            (Tasks.overdue_notified_at.is_(None))
            | (Tasks.overdue_notified_at < today)
        )
        .all()
    )

    for task in overdue_tasks:
        account = Account.query.get(task.account_id) if task.account_id else None
        link = _build_task_link(task)
        title = "Task overdue"
        message = account.business_name if account else task.task_description

        if task.assigned_to:
            create_notification(
                user_id=task.assigned_to,
                notif_type="task_overdue",
                title=title,
                message=message,
                link=link,
                source_type="task",
                source_id=task.task_id,
            )

        if task.user_id and task.user_id != task.assigned_to:
            create_notification(
                user_id=task.user_id,
                notif_type="task_overdue",
                title=title,
                message=message,
                link=link,
                source_type="task",
                source_id=task.task_id,
            )

        task.overdue_notified_at = today

    if overdue_tasks:
        db.session.commit()


if __name__ == "__main__":
    with app.app_context():
        notify_overdue_tasks()
