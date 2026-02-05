from datetime import datetime, timedelta

from app import app
from database import db
from models import Tasks, Account
from notifications import create_notification


def _build_task_link(task):
    return f"/tasks/{task.task_id}"


def notify_overdue_tasks():
    today = datetime.now().date()
    now = datetime.now()
    reminder_window_end = now + timedelta(minutes=15)

    upcoming_tasks = (
        Tasks.query
        .filter(Tasks.is_completed == False)
        .filter(Tasks.due_date.isnot(None))
        .filter(Tasks.due_date >= now)
        .filter(Tasks.due_date <= reminder_window_end)
        .filter(Tasks.reminder_sent_at.is_(None))
        .all()
    )

    for task in upcoming_tasks:
        account = Account.query.get(task.account_id) if task.account_id else None
        link = _build_task_link(task)
        title = "Task reminder"
        message = account.business_name if account else task.task_description

        if task.assigned_to:
            create_notification(
                user_id=task.assigned_to,
                notif_type="task_reminder",
                title=title,
                message=message,
                link=link,
                source_type="task",
                source_id=task.task_id,
                event_time=task.due_date,
            )

        if task.user_id and task.user_id != task.assigned_to:
            create_notification(
                user_id=task.user_id,
                notif_type="task_reminder",
                title=title,
                message=message,
                link=link,
                source_type="task",
                source_id=task.task_id,
                event_time=task.due_date,
            )

        task.reminder_sent_at = now

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

    if overdue_tasks or upcoming_tasks:
        db.session.commit()


if __name__ == "__main__":
    with app.app_context():
        notify_overdue_tasks()
