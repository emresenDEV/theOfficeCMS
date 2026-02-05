from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from sqlalchemy import func

from audit import create_audit_log
from database import db
from models import (
    Account,
    AccountContacts,
    Contact,
    Invoice,
    InvoicePipeline,
    InvoicePipelineHistory,
    Payment,
    InvoicePipelineFollower,
    Users,
)
from notifications import create_notification

pipeline_bp = Blueprint("pipelines", __name__)

PIPELINE_STAGES = [
    "contact_customer",
    "order_placed",
    "payment_not_received",
    "payment_received",
    "order_packaged",
    "order_shipped",
    "order_delivered",
]

STAGE_LABELS = {
    "contact_customer": "Contact customer",
    "order_placed": "Order placed",
    "payment_not_received": "Payment not received",
    "payment_received": "Payment received",
    "order_packaged": "Order packaged",
    "order_shipped": "Order shipped",
    "order_delivered": "Order delivered",
}

STAGE_FIELDS = {
    "contact_customer": "contacted_at",
    "order_placed": "order_placed_at",
    "payment_not_received": "payment_not_received_at",
    "payment_received": "payment_received_at",
    "order_packaged": "order_packaged_at",
    "order_shipped": "order_shipped_at",
    "order_delivered": "order_delivered_at",
}

STAGE_OFFSETS = {
    "contact_customer": 0,
    "order_placed": 0,
    "payment_not_received": 1,
    "payment_received": 1,
    "order_packaged": 2,
    "order_shipped": 3,
    "order_delivered": 4,
}


def _fmt(dt):
    return dt.isoformat() if dt else None


def _parse_date(value):
    try:
        return datetime.strptime(value, "%Y-%m-%d")
    except Exception:
        return None


def _serialize_pipeline(pipeline):
    return {
        "invoice_id": pipeline.invoice_id,
        "current_stage": pipeline.current_stage,
        "start_date": pipeline.start_date.isoformat() if pipeline.start_date else None,
        "contacted_at": _fmt(pipeline.contacted_at),
        "order_placed_at": _fmt(pipeline.order_placed_at),
        "payment_not_received_at": _fmt(pipeline.payment_not_received_at),
        "payment_received_at": _fmt(pipeline.payment_received_at),
        "order_packaged_at": _fmt(pipeline.order_packaged_at),
        "order_shipped_at": _fmt(pipeline.order_shipped_at),
        "order_delivered_at": _fmt(pipeline.order_delivered_at),
        "payment_issue_notified_at": _fmt(pipeline.payment_issue_notified_at),
        "payment_issue_escalated_at": _fmt(pipeline.payment_issue_escalated_at),
        "updated_at": _fmt(pipeline.updated_at),
    }


def _payment_stats(invoice_id):
    total_paid = db.session.query(func.coalesce(func.sum(Payment.total_paid), 0)).filter(
        Payment.invoice_id == invoice_id
    ).scalar() or 0
    latest_payment = db.session.query(func.max(Payment.date_paid)).filter(
        Payment.invoice_id == invoice_id
    ).scalar()
    return float(total_paid), latest_payment


def _effective_stage(invoice, pipeline):
    total_paid, latest_payment = _payment_stats(invoice.invoice_id)
    final_total = float(invoice.final_total or 0)
    paid_in_full = final_total <= 0 or total_paid >= final_total

    if not paid_in_full:
        return "payment_not_received"

    payment_date = pipeline.payment_received_at or latest_payment or invoice.date_updated or invoice.date_created
    if not payment_date:
        return "payment_received"

    days_since = (datetime.utcnow().date() - payment_date.date()).days
    if days_since >= 3:
        return "order_delivered"
    if days_since >= 2:
        return "order_shipped"
    if days_since >= 1:
        return "order_packaged"
    return "payment_received"


def _notify_pipeline_followers(invoice, account, stage, actor_user_id=None, action_required=False):
    followers = InvoicePipelineFollower.query.filter_by(invoice_id=invoice.invoice_id).all()
    if not followers:
        return
    step_label = STAGE_LABELS.get(stage, stage)
    title = f"Pipeline update: {step_label}"
    message = f"{account.business_name} • Invoice #{invoice.invoice_id} • {step_label}"
    if action_required:
        message = f"{message} • Action required"
    for follower in followers:
        if actor_user_id and follower.user_id == actor_user_id:
            continue
        create_notification(
            user_id=follower.user_id,
            notif_type="pipeline_update",
            title=title,
            message=message,
            link=f"/pipelines/invoice/{invoice.invoice_id}",
            account_id=invoice.account_id,
            invoice_id=invoice.invoice_id,
            source_type="invoice_pipeline",
            source_id=invoice.invoice_id,
        )


def _get_primary_contact(account_id):
    if not account_id:
        return None
    primary_link = (
        AccountContacts.query.filter_by(account_id=account_id, is_primary=True)
        .order_by(AccountContacts.created_at.desc())
        .first()
    )
    if primary_link:
        return Contact.query.get(primary_link.contact_id)
    return None


def _ensure_pipeline(invoice):
    pipeline = InvoicePipeline.query.get(invoice.invoice_id)
    if pipeline:
        return pipeline

    created_at = invoice.date_created or datetime.utcnow()
    pipeline = InvoicePipeline(
        invoice_id=invoice.invoice_id,
        current_stage="order_placed",
        start_date=created_at.date(),
        contacted_at=created_at,
        order_placed_at=created_at,
    )
    db.session.add(pipeline)
    db.session.flush()
    return pipeline


def _suggested_dates(start_date, payment_date=None):
    if not start_date:
        return {}
    suggested = {
        stage: (start_date + timedelta(days=offset)).isoformat()
        for stage, offset in STAGE_OFFSETS.items()
    }
    if payment_date:
        suggested["order_packaged"] = (payment_date + timedelta(days=1)).isoformat()
        suggested["order_shipped"] = (payment_date + timedelta(days=2)).isoformat()
        suggested["order_delivered"] = (payment_date + timedelta(days=3)).isoformat()
    return suggested


@pipeline_bp.route("/summary", methods=["GET"])
def pipeline_summary():
    user_id = request.args.get("user_id", type=int)
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    account_id = request.args.get("account_id", type=int)
    invoice_id = request.args.get("invoice_id", type=int)
    account_search = request.args.get("account_search")
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    date_field = request.args.get("date_field", "created")
    query = (
        db.session.query(InvoicePipeline, Invoice, Account)
        .join(Invoice, Invoice.invoice_id == InvoicePipeline.invoice_id)
        .join(Account, Account.account_id == Invoice.account_id)
    )
    if user_id:
        query = query.filter(Invoice.sales_rep_id == user_id)
    if sales_rep_id:
        query = query.filter(Invoice.sales_rep_id == sales_rep_id)
    if account_id:
        query = query.filter(Invoice.account_id == account_id)
    if invoice_id:
        query = query.filter(Invoice.invoice_id == invoice_id)
    if account_search:
        query = query.filter(Account.business_name.ilike(f"%{account_search}%"))
    if date_from or date_to:
        field = Invoice.date_created if date_field == "created" else InvoicePipeline.updated_at
        start_dt = _parse_date(date_from) if date_from else None
        end_dt = _parse_date(date_to) if date_to else None
        if start_dt:
            query = query.filter(field >= start_dt)
        if end_dt:
            query = query.filter(field < (end_dt + timedelta(days=1)))

    stage_counts = {}
    stage_accounts = {}
    for pipeline, invoice, _account in query.all():
        stage = _effective_stage(invoice, pipeline)
        stage_counts[stage] = stage_counts.get(stage, 0) + 1
        stage_accounts.setdefault(stage, set()).add(invoice.account_id)

    return jsonify([
        {
            "stage": stage,
            "invoice_count": int(stage_counts.get(stage, 0)),
            "account_count": len(stage_accounts.get(stage, set())),
        }
        for stage in stage_counts
    ]), 200


@pipeline_bp.route("", methods=["GET"])
def pipeline_list():
    stage = request.args.get("stage")
    user_id = request.args.get("user_id", type=int)
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    account_id = request.args.get("account_id", type=int)
    invoice_id = request.args.get("invoice_id", type=int)
    account_search = request.args.get("account_search")
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    date_field = request.args.get("date_field", "created")
    query = (
        db.session.query(InvoicePipeline, Invoice, Account)
        .join(Invoice, Invoice.invoice_id == InvoicePipeline.invoice_id)
        .join(Account, Account.account_id == Invoice.account_id)
    )
    if user_id:
        query = query.filter(Invoice.sales_rep_id == user_id)
    if sales_rep_id:
        query = query.filter(Invoice.sales_rep_id == sales_rep_id)
    if account_id:
        query = query.filter(Invoice.account_id == account_id)
    if invoice_id:
        query = query.filter(Invoice.invoice_id == invoice_id)
    if account_search:
        query = query.filter(Account.business_name.ilike(f"%{account_search}%"))
    if date_from or date_to:
        field = Invoice.date_created if date_field == "created" else InvoicePipeline.updated_at
        start_dt = _parse_date(date_from) if date_from else None
        end_dt = _parse_date(date_to) if date_to else None
        if start_dt:
            query = query.filter(field >= start_dt)
        if end_dt:
            query = query.filter(field < (end_dt + timedelta(days=1)))

    results = []
    for pipeline, invoice, account in query.order_by(Invoice.date_created.desc()).all():
        effective_stage = _effective_stage(invoice, pipeline)
        if stage and effective_stage != stage:
            continue
        contact = _get_primary_contact(account.account_id)
        results.append({
            "invoice_id": invoice.invoice_id,
            "account_id": account.account_id,
            "account_name": account.business_name,
            "contact_id": contact.contact_id if contact else None,
            "contact_name": f"{contact.first_name or ''} {contact.last_name or ''}".strip() if contact else None,
            "current_stage": pipeline.current_stage,
            "effective_stage": effective_stage,
            "updated_at": _fmt(pipeline.updated_at),
            "final_total": float(invoice.final_total or 0),
            "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
            "status": invoice.status,
            "sales_rep_id": invoice.sales_rep_id,
        })

    return jsonify(results), 200


@pipeline_bp.route("/invoice/<int:invoice_id>", methods=["GET"])
def pipeline_detail(invoice_id):
    user_id = request.args.get("user_id", type=int)
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    pipeline = _ensure_pipeline(invoice)
    account = Account.query.get(invoice.account_id)
    contact = _get_primary_contact(invoice.account_id)
    effective_stage = _effective_stage(invoice, pipeline)
    is_following = False
    if user_id:
        is_following = InvoicePipelineFollower.query.filter_by(
            invoice_id=invoice_id, user_id=user_id
        ).first() is not None

    history_rows = (
        db.session.query(InvoicePipelineHistory, Users)
        .outerjoin(Users, Users.user_id == InvoicePipelineHistory.actor_user_id)
        .filter(InvoicePipelineHistory.invoice_id == invoice_id)
        .order_by(InvoicePipelineHistory.created_at.desc())
        .all()
    )

    history = [
        {
            "history_id": row.InvoicePipelineHistory.history_id,
            "stage": row.InvoicePipelineHistory.stage,
            "action": row.InvoicePipelineHistory.action,
            "note": row.InvoicePipelineHistory.note,
            "actor_user_id": row.InvoicePipelineHistory.actor_user_id,
            "actor_name": f"{row.Users.first_name or ''} {row.Users.last_name or ''}".strip() if row.Users else None,
            "created_at": _fmt(row.InvoicePipelineHistory.created_at),
        }
        for row in history_rows
    ]

    payment_date = pipeline.payment_received_at
    payload = {
        "invoice": {
            "invoice_id": invoice.invoice_id,
            "account_id": invoice.account_id,
            "account_name": account.business_name if account else None,
            "sales_rep_id": invoice.sales_rep_id,
            "final_total": float(invoice.final_total or 0),
            "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
            "status": invoice.status,
        },
        "contact": {
            "contact_id": contact.contact_id if contact else None,
            "name": f"{contact.first_name or ''} {contact.last_name or ''}".strip() if contact else None,
            "email": contact.email if contact else None,
            "phone": contact.phone if contact else None,
        },
        "pipeline": _serialize_pipeline(pipeline),
        "effective_stage": effective_stage,
        "is_following": is_following,
        "history": history,
        "suggested_dates": _suggested_dates(
            pipeline.start_date or (invoice.date_created.date() if invoice.date_created else None),
            payment_date.date() if payment_date else None,
        ),
    }
    return jsonify(payload), 200


@pipeline_bp.route("/invoice/<int:invoice_id>/status", methods=["POST"])
def update_pipeline_status(invoice_id):
    data = request.json or {}
    stage = data.get("stage")
    note = data.get("note")
    actor_user_id = data.get("actor_user_id")
    actor_email = data.get("actor_email")

    if stage not in PIPELINE_STAGES:
        return jsonify({"error": "Invalid stage"}), 400

    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    total_paid, _ = _payment_stats(invoice_id)
    final_total = float(invoice.final_total or 0)
    paid_in_full = final_total <= 0 or total_paid >= final_total
    if stage in ("payment_received", "order_packaged", "order_shipped", "order_delivered") and not paid_in_full:
        return jsonify({"error": "Invoice is not paid in full. Log payment before moving to this stage."}), 400

    pipeline = _ensure_pipeline(invoice)
    before_data = _serialize_pipeline(pipeline)

    allowed_next = {
        "contact_customer": {"contact_customer", "order_placed"},
        "order_placed": {"order_placed", "payment_not_received", "payment_received"},
        "payment_not_received": {"payment_not_received", "payment_received"},
        "payment_received": {"payment_received", "order_packaged"},
        "order_packaged": {"order_packaged", "order_shipped"},
        "order_shipped": {"order_shipped", "order_delivered"},
        "order_delivered": {"order_delivered"},
    }
    current_stage = pipeline.current_stage or "order_placed"
    if stage not in allowed_next.get(current_stage, {stage}):
        return jsonify({"error": f"Complete the previous step before moving to {STAGE_LABELS.get(stage, stage)}."}), 400

    now = datetime.utcnow()
    if stage in ("payment_received", "order_packaged", "order_shipped", "order_delivered") and not pipeline.payment_received_at:
        _total_paid, latest_payment = _payment_stats(invoice_id)
        if latest_payment:
            pipeline.payment_received_at = latest_payment
    pipeline.current_stage = stage
    field = STAGE_FIELDS.get(stage)
    if field and getattr(pipeline, field) is None:
        setattr(pipeline, field, now)
    pipeline.updated_at = now

    # Ensure prerequisite timestamps when jumping ahead
    stage_index = PIPELINE_STAGES.index(stage)
    for prior_stage in PIPELINE_STAGES[:stage_index]:
        prior_field = STAGE_FIELDS.get(prior_stage)
        if prior_field and getattr(pipeline, prior_field) is None:
            setattr(pipeline, prior_field, now)

    db.session.add(InvoicePipelineHistory(
        invoice_id=invoice_id,
        stage=stage,
        action="status_change",
        note=note or STAGE_LABELS.get(stage, stage),
        actor_user_id=actor_user_id,
    ))

    db.session.add(InvoicePipelineHistory(
        invoice_id=invoice_id,
        stage=stage,
        action="email",
        note=f"Email sent to contact: {STAGE_LABELS.get(stage, stage)} update.",
        actor_user_id=actor_user_id,
    ))

    create_audit_log(
        entity_type="invoice_pipeline_email",
        entity_id=invoice_id,
        action="email",
        user_id=actor_user_id,
        user_email=actor_email,
        after_data={
            "stage": stage,
            "note": f"Email sent to contact: {STAGE_LABELS.get(stage, stage)} update.",
        },
        account_id=invoice.account_id,
        invoice_id=invoice.invoice_id,
    )

    if stage == "payment_not_received":
        pipeline.payment_issue_notified_at = pipeline.payment_issue_notified_at or now
        db.session.add(InvoicePipelineHistory(
            invoice_id=invoice_id,
            stage=stage,
            action="email",
            note="Payment issue email sent to contact. Please contact support to continue order.",
            actor_user_id=actor_user_id,
        ))

        create_audit_log(
            entity_type="invoice_pipeline_email",
            entity_id=invoice_id,
            action="payment_issue",
            user_id=actor_user_id,
            user_email=actor_email,
            after_data={
                "stage": stage,
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
            stage,
            actor_user_id=actor_user_id,
            action_required=True,
        )
    else:
        _notify_pipeline_followers(
            invoice,
            account,
            stage,
            actor_user_id=actor_user_id,
        )

    create_notification(
        user_id=invoice.sales_rep_id,
        notif_type="pipeline_email",
        title="Pipeline update email sent",
        message=f"{account.business_name} • Invoice #{invoice.invoice_id} • {STAGE_LABELS.get(stage, stage)} update sent to contact.",
        link=f"/pipelines/invoice/{invoice.invoice_id}",
        account_id=invoice.account_id,
        invoice_id=invoice.invoice_id,
        source_type="invoice",
        source_id=invoice.invoice_id,
    )

    create_audit_log(
        entity_type="invoice_pipeline",
        entity_id=invoice_id,
        action="update_status",
        user_id=actor_user_id,
        user_email=actor_email,
        before_data=before_data,
        after_data=_serialize_pipeline(pipeline),
        account_id=invoice.account_id,
        invoice_id=invoice.invoice_id,
    )

    db.session.commit()

    return jsonify(_serialize_pipeline(pipeline)), 200


@pipeline_bp.route("/invoice/<int:invoice_id>/note", methods=["POST"])
def add_pipeline_note(invoice_id):
    data = request.json or {}
    note = data.get("note")
    stage = data.get("stage")
    actor_user_id = data.get("actor_user_id")
    actor_email = data.get("actor_email")

    if not note:
        return jsonify({"error": "note is required"}), 400

    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    _ensure_pipeline(invoice)
    db.session.add(InvoicePipelineHistory(
        invoice_id=invoice_id,
        stage=stage,
        action="note",
        note=note,
        actor_user_id=actor_user_id,
    ))

    create_audit_log(
        entity_type="invoice_pipeline",
        entity_id=invoice_id,
        action="note",
        user_id=actor_user_id,
        user_email=actor_email,
        after_data={"stage": stage, "note": note},
        account_id=invoice.account_id,
        invoice_id=invoice.invoice_id,
    )

    db.session.commit()

    return jsonify({"message": "note added"}), 201


@pipeline_bp.route("/invoice/<int:invoice_id>/follow", methods=["POST"])
def follow_pipeline(invoice_id):
    data = request.json or {}
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    exists = InvoicePipelineFollower.query.filter_by(invoice_id=invoice_id, user_id=user_id).first()
    if exists:
        return jsonify({"message": "already following"}), 200

    db.session.add(InvoicePipelineFollower(invoice_id=invoice_id, user_id=user_id))
    db.session.commit()
    return jsonify({"message": "following"}), 201


@pipeline_bp.route("/invoice/<int:invoice_id>/unfollow", methods=["POST"])
def unfollow_pipeline(invoice_id):
    data = request.json or {}
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    InvoicePipelineFollower.query.filter_by(invoice_id=invoice_id, user_id=user_id).delete()
    db.session.commit()
    return jsonify({"message": "unfollowed"}), 200
