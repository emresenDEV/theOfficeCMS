from flask import Blueprint, jsonify, request
from sqlalchemy import func, or_
from datetime import datetime, timedelta
from models import AuditLog
from database import db

audit_bp = Blueprint("audit", __name__)


def _build_link(entry):
    if entry.entity_type == "contact" or entry.contact_id:
        contact_id = entry.contact_id or entry.entity_id
        if contact_id:
            return f"/contacts/{contact_id}"
    if entry.entity_type == "invoice" or entry.invoice_id:
        invoice_id = entry.invoice_id or entry.entity_id
        if invoice_id:
            return f"/invoice/{invoice_id}"
    if entry.entity_type == "account" or entry.account_id:
        account_id = entry.account_id or entry.entity_id
        if account_id:
            return f"/accounts/details/{account_id}"
    if entry.entity_type == "task":
        if entry.entity_id:
            return f"/tasks/{entry.entity_id}"
        return "/tasks"
    if entry.entity_type == "calendar_event":
        return "/calendar"
    if entry.entity_type == "payment":
        if entry.invoice_id:
            return f"/invoice/{entry.invoice_id}"
        if entry.account_id:
            return f"/accounts/details/{entry.account_id}"
    if entry.entity_type == "user":
        return "/admin?tab=users"
    return None


@audit_bp.route("", methods=["GET"])
@audit_bp.route("/", methods=["GET"])
def get_audit_logs():
    entity_type = request.args.get("entity_type")
    entity_id = request.args.get("entity_id", type=int)
    account_id = request.args.get("account_id", type=int)
    invoice_id = request.args.get("invoice_id", type=int)
    contact_id = request.args.get("contact_id", type=int)
    user_id = request.args.get("user_id", type=int)
    limit = request.args.get("limit", type=int) or 200

    query = AuditLog.query

    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if account_id:
        query = query.filter(
            or_(
                AuditLog.account_id == account_id,
                (AuditLog.entity_type == "account") & (AuditLog.entity_id == account_id),
            )
        )
    if invoice_id:
        query = query.filter(
            or_(
                AuditLog.invoice_id == invoice_id,
                (AuditLog.entity_type == "invoice") & (AuditLog.entity_id == invoice_id),
            )
        )
    if contact_id:
        query = query.filter(
            or_(
                AuditLog.contact_id == contact_id,
                (AuditLog.entity_type == "contact") & (AuditLog.entity_id == contact_id),
            )
        )

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()

    return jsonify([
        {
            "audit_id": log.audit_id,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "action": log.action,
            "user_id": log.user_id,
            "user_email": log.user_email,
            "account_id": log.account_id,
            "invoice_id": log.invoice_id,
            "contact_id": log.contact_id,
            "before_data": log.before_data,
            "after_data": log.after_data,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "link": _build_link(log),
        }
        for log in logs
    ]), 200


@audit_bp.route("/summary", methods=["GET"])
def get_audit_summary():
    days = request.args.get("days", type=int) or 7
    since = datetime.now() - timedelta(days=days)

    base_query = AuditLog.query.filter(AuditLog.created_at >= since)

    total = base_query.count()

    by_entity = (
        db.session.query(AuditLog.entity_type, func.count(AuditLog.audit_id))
        .filter(AuditLog.created_at >= since)
        .group_by(AuditLog.entity_type)
        .all()
    )

    by_action = (
        db.session.query(AuditLog.action, func.count(AuditLog.audit_id))
        .filter(AuditLog.created_at >= since)
        .group_by(AuditLog.action)
        .all()
    )

    by_day = (
        db.session.query(func.date(AuditLog.created_at), func.count(AuditLog.audit_id))
        .filter(AuditLog.created_at >= since)
        .group_by(func.date(AuditLog.created_at))
        .order_by(func.date(AuditLog.created_at))
        .all()
    )

    by_actor = (
        db.session.query(AuditLog.user_email, func.count(AuditLog.audit_id))
        .filter(AuditLog.created_at >= since)
        .group_by(AuditLog.user_email)
        .order_by(func.count(AuditLog.audit_id).desc())
        .limit(5)
        .all()
    )

    latest_entries = (
        db.session.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(5)
        .all()
    )

    return jsonify({
        "total": total,
        "since_days": days,
        "by_entity": {entity: count for entity, count in by_entity},
        "by_action": {action: count for action, count in by_action},
        "by_day": [
            {"date": day.isoformat() if day else None, "count": count} for day, count in by_day
        ],
        "by_actor": [
            {"user_email": actor or "System", "count": count} for actor, count in by_actor
        ],
        "latest_at": latest_entries[0].created_at.isoformat() if latest_entries and latest_entries[0].created_at else None,
        "latest_entries": [
            {
                "audit_id": entry.audit_id,
                "entity_type": entry.entity_type,
                "entity_id": entry.entity_id,
                "action": entry.action,
                "user_email": entry.user_email,
                "created_at": entry.created_at.isoformat() if entry.created_at else None,
                "link": _build_link(entry),
            }
            for entry in latest_entries
        ],
    }), 200
