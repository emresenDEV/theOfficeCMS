from datetime import datetime, timedelta

from app import app
from database import db
from models import Tasks, Account, Invoice, InvoicePipeline, InvoicePipelineHistory, Payment, InvoicePipelineFollower
from audit import create_audit_log
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

    _flag_payment_not_received(now)

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


def _payment_stats(invoice_id):
    total_paid = db.session.query(db.func.coalesce(db.func.sum(Payment.total_paid), 0)).filter(
        Payment.invoice_id == invoice_id
    ).scalar() or 0
    latest_payment = db.session.query(db.func.max(Payment.date_paid)).filter(
        Payment.invoice_id == invoice_id
    ).scalar()
    return float(total_paid), latest_payment


def _notify_pipeline_followers(invoice, account, stage_label, action_required=False):
    followers = InvoicePipelineFollower.query.filter_by(invoice_id=invoice.invoice_id).all()
    if not followers:
        return
    for follower in followers:
        create_notification(
            user_id=follower.user_id,
            notif_type="pipeline_update",
            title=f"Pipeline update: {stage_label}",
            message=f"{account.business_name} • Invoice #{invoice.invoice_id} • {stage_label}"
            + (" • Action required" if action_required else ""),
            link=f"/pipelines/invoice/{invoice.invoice_id}",
            account_id=invoice.account_id,
            invoice_id=invoice.invoice_id,
            source_type="invoice_pipeline",
            source_id=invoice.invoice_id,
        )


def _flag_payment_not_received(now):
    pipelines = (
        db.session.query(InvoicePipeline, Invoice, Account)
        .join(Invoice, Invoice.invoice_id == InvoicePipeline.invoice_id)
        .join(Account, Account.account_id == Invoice.account_id)
        .all()
    )

    for pipeline, invoice, account in pipelines:
        total_paid, _latest_payment = _payment_stats(invoice.invoice_id)
        final_total = float(invoice.final_total or 0)
        if final_total <= 0 or total_paid >= final_total:
            continue

        order_date = pipeline.order_placed_at or invoice.date_created
        if not order_date:
            continue

        days_since_order = (now.date() - order_date.date()).days
        if days_since_order < 1:
            continue

        if pipeline.payment_issue_notified_at is not None:
            continue

        pipeline.current_stage = "payment_not_received"
        pipeline.payment_not_received_at = pipeline.payment_not_received_at or now
        pipeline.payment_issue_notified_at = now
        pipeline.updated_at = now

        db.session.add(InvoicePipelineHistory(
            invoice_id=invoice.invoice_id,
            stage="payment_not_received",
            action="status_change",
            note="Payment not received",
            actor_user_id=None,
        ))
        db.session.add(InvoicePipelineHistory(
            invoice_id=invoice.invoice_id,
            stage="payment_not_received",
            action="email",
            note="Payment issue email sent to contact. Please contact support to continue order.",
            actor_user_id=None,
        ))

        create_audit_log(
            entity_type="invoice_pipeline_email",
            entity_id=invoice.invoice_id,
            action="payment_issue",
            user_id=None,
            user_email=None,
            after_data={
                "stage": "payment_not_received",
                "note": "Payment issue email sent to contact. Please contact support to continue order.",
            },
            account_id=invoice.account_id,
            invoice_id=invoice.invoice_id,
        )

        create_notification(
            user_id=invoice.sales_rep_id,
            notif_type="pipeline_payment_issue",
            title="Payment issue email sent",
            message=f"{account.business_name} • Invoice #{invoice.invoice_id} • Payment issue email sent to contact.",
            link=f"/pipelines/invoice/{invoice.invoice_id}",
            account_id=invoice.account_id,
            invoice_id=invoice.invoice_id,
            source_type="invoice",
            source_id=invoice.invoice_id,
        )

        _notify_pipeline_followers(
            invoice,
            account,
            "Payment not received",
            action_required=True,
        )

    db.session.commit()


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
        total_paid, latest_payment = _payment_stats(invoice.invoice_id)
        final_total = float(invoice.final_total or 0)
        if final_total > 0 and total_paid < final_total:
            continue

        payment_date = pipeline.payment_received_at or latest_payment
        if not payment_date:
            payment_date = now
            pipeline.payment_received_at = now

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

        stage_time_map = {
            "payment_received": payment_date,
            "order_packaged": payment_date + timedelta(days=1),
            "order_shipped": payment_date + timedelta(days=2),
            "order_delivered": payment_date + timedelta(days=3),
        }

        for idx in range(current_index + 1, target_index + 1):
            stage = stage_order[idx]
            field = stage_fields.get(stage)
            if field and getattr(pipeline, field) is None:
                setattr(pipeline, field, stage_time_map.get(stage, now))
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
