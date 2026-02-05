from datetime import datetime, timedelta

from app import app
from database import db
from models import Tasks, Account, Invoice, InvoicePipeline, InvoicePipelineHistory, Payment, InvoicePipelineFollower
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

    payment_issue_cutoff = now - timedelta(days=2)
    pipeline_issues = (
        db.session.query(InvoicePipeline, Invoice, Account)
        .join(Invoice, Invoice.invoice_id == InvoicePipeline.invoice_id)
        .join(Account, Account.account_id == Invoice.account_id)
        .filter(InvoicePipeline.current_stage == "payment_not_received")
        .filter(InvoicePipeline.payment_issue_notified_at.isnot(None))
        .filter(InvoicePipeline.payment_issue_notified_at <= payment_issue_cutoff)
        .filter(InvoicePipeline.payment_issue_escalated_at.is_(None))
        .all()
    )

    for pipeline, invoice, account in pipeline_issues:
        create_notification(
            user_id=invoice.sales_rep_id,
            notif_type="pipeline_payment_issue_followup",
            title="Payment issue follow-up",
            message=f"{account.business_name} • Invoice #{invoice.invoice_id} • Payment issue unresolved for 2+ days. Please call the contact.",
            link=f"/pipelines/invoice/{invoice.invoice_id}",
            account_id=invoice.account_id,
            invoice_id=invoice.invoice_id,
            source_type="invoice",
            source_id=invoice.invoice_id,
        )
        db.session.add(InvoicePipelineHistory(
            invoice_id=invoice.invoice_id,
            stage="payment_not_received",
            action="escalation",
            note="Payment issue escalated after 2 days without resolution.",
            actor_user_id=None,
        ))
        pipeline.payment_issue_escalated_at = now

    if pipeline_issues:
        db.session.commit()

    _advance_paid_pipelines(now)


def _advance_paid_pipelines(now):
    stage_order = [
        "payment_received",
        "order_packaged",
        "order_shipped",
        "order_delivered",
    ]
    stage_fields = {
        "payment_received": "payment_received_at",
        "order_packaged": "order_packaged_at",
        "order_shipped": "order_shipped_at",
        "order_delivered": "order_delivered_at",
    }
    stage_labels = {
        "payment_received": "Payment received",
        "order_packaged": "Order packaged",
        "order_shipped": "Order shipped",
        "order_delivered": "Order delivered",
    }

    pipelines = (
        db.session.query(InvoicePipeline, Invoice, Account)
        .join(Invoice, Invoice.invoice_id == InvoicePipeline.invoice_id)
        .join(Account, Account.account_id == Invoice.account_id)
        .all()
    )

    for pipeline, invoice, account in pipelines:
        total_paid = db.session.query(db.func.coalesce(db.func.sum(Payment.total_paid), 0)).filter(
            Payment.invoice_id == invoice.invoice_id
        ).scalar() or 0
        final_total = float(invoice.final_total or 0)
        if final_total > 0 and total_paid < final_total:
            continue

        payment_date = pipeline.payment_received_at
        if not payment_date:
            latest_payment = db.session.query(db.func.max(Payment.date_paid)).filter(
                Payment.invoice_id == invoice.invoice_id
            ).scalar()
            payment_date = latest_payment
            if payment_date:
                pipeline.payment_received_at = payment_date

        if not payment_date:
            continue

        days_since = (now.date() - payment_date.date()).days
        if days_since >= 3:
            target_stage = "order_delivered"
        elif days_since >= 2:
            target_stage = "order_shipped"
        elif days_since >= 1:
            target_stage = "order_packaged"
        else:
            target_stage = "payment_received"

        if pipeline.current_stage not in stage_order:
            pipeline.current_stage = "payment_received"

        current_index = stage_order.index(pipeline.current_stage)
        target_index = stage_order.index(target_stage)
        if target_index <= current_index:
            continue

        for idx in range(current_index + 1, target_index + 1):
            stage = stage_order[idx]
            field = stage_fields.get(stage)
            if field and getattr(pipeline, field) is None:
                setattr(pipeline, field, now)
            pipeline.current_stage = stage
            pipeline.updated_at = now
            db.session.add(InvoicePipelineHistory(
                invoice_id=invoice.invoice_id,
                stage=stage,
                action="status_change",
                note=stage_labels.get(stage, stage),
                actor_user_id=None,
            ))

            followers = InvoicePipelineFollower.query.filter_by(invoice_id=invoice.invoice_id).all()
            for follower in followers:
                create_notification(
                    user_id=follower.user_id,
                    notif_type="pipeline_update",
                    title=f"Pipeline update: {stage_labels.get(stage, stage)}",
                    message=f"{account.business_name} • Invoice #{invoice.invoice_id} • {stage_labels.get(stage, stage)}",
                    link=f"/pipelines/invoice/{invoice.invoice_id}",
                    account_id=invoice.account_id,
                    invoice_id=invoice.invoice_id,
                    source_type="invoice_pipeline",
                    source_id=invoice.invoice_id,
                )

    db.session.commit()


if __name__ == "__main__":
    with app.app_context():
        notify_overdue_tasks()
