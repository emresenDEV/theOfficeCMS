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
        order_placed_at=created_at,
    )
    db.session.add(pipeline)
    db.session.flush()
    return pipeline


def _suggested_dates(start_date):
    if not start_date:
        return {}
    return {
        stage: (start_date + timedelta(days=offset)).isoformat()
        for stage, offset in STAGE_OFFSETS.items()
    }


@pipeline_bp.route("/summary", methods=["GET"])
def pipeline_summary():
    user_id = request.args.get("user_id", type=int)
    query = (
        db.session.query(
            InvoicePipeline.current_stage,
            func.count(InvoicePipeline.invoice_id).label("invoice_count"),
            func.count(func.distinct(Invoice.account_id)).label("account_count"),
        )
        .join(Invoice, Invoice.invoice_id == InvoicePipeline.invoice_id)
    )
    if user_id:
        query = query.filter(Invoice.sales_rep_id == user_id)
    rows = query.group_by(InvoicePipeline.current_stage).all()

    return jsonify([
        {
            "stage": row.current_stage,
            "invoice_count": int(row.invoice_count or 0),
            "account_count": int(row.account_count or 0),
        }
        for row in rows
    ]), 200


@pipeline_bp.route("", methods=["GET"])
def pipeline_list():
    stage = request.args.get("stage")
    user_id = request.args.get("user_id", type=int)
    query = (
        db.session.query(InvoicePipeline, Invoice, Account)
        .join(Invoice, Invoice.invoice_id == InvoicePipeline.invoice_id)
        .join(Account, Account.account_id == Invoice.account_id)
    )
    if stage:
        query = query.filter(InvoicePipeline.current_stage == stage)
    if user_id:
        query = query.filter(Invoice.sales_rep_id == user_id)

    results = []
    for pipeline, invoice, account in query.order_by(Invoice.date_created.desc()).all():
        contact = _get_primary_contact(account.account_id)
        results.append({
            "invoice_id": invoice.invoice_id,
            "account_id": account.account_id,
            "account_name": account.business_name,
            "contact_id": contact.contact_id if contact else None,
            "contact_name": f"{contact.first_name or ''} {contact.last_name or ''}".strip() if contact else None,
            "current_stage": pipeline.current_stage,
            "updated_at": _fmt(pipeline.updated_at),
            "final_total": float(invoice.final_total or 0),
            "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
            "status": invoice.status,
            "sales_rep_id": invoice.sales_rep_id,
        })

    return jsonify(results), 200


@pipeline_bp.route("/invoice/<int:invoice_id>", methods=["GET"])
def pipeline_detail(invoice_id):
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    pipeline = _ensure_pipeline(invoice)
    account = Account.query.get(invoice.account_id)
    contact = _get_primary_contact(invoice.account_id)

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
        "history": history,
        "suggested_dates": _suggested_dates(pipeline.start_date or (invoice.date_created.date() if invoice.date_created else None)),
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

    pipeline = _ensure_pipeline(invoice)
    before_data = _serialize_pipeline(pipeline)

    now = datetime.utcnow()
    pipeline.current_stage = stage
    field = STAGE_FIELDS.get(stage)
    if field and getattr(pipeline, field) is None:
        setattr(pipeline, field, now)
    pipeline.updated_at = now

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
            message=f"Invoice #{invoice.invoice_id}: payment method issue email sent to contact.",
            link=f"/pipelines/invoice/{invoice.invoice_id}",
            source_type="invoice",
            source_id=invoice.invoice_id,
        )

    create_notification(
        user_id=invoice.sales_rep_id,
        notif_type="pipeline_email",
        title="Pipeline update email sent",
        message=f"Invoice #{invoice.invoice_id}: {STAGE_LABELS.get(stage, stage)} update sent to contact.",
        link=f"/pipelines/invoice/{invoice.invoice_id}",
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
