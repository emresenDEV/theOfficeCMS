from datetime import date, datetime
from decimal import Decimal

from models import AuditLog, Users
from database import db


def _resolve_user_email(user_id, fallback_email=None):
    if fallback_email:
        return fallback_email
    if not user_id:
        return None
    user = Users.query.get(user_id)
    return user.email if user else None


def _json_safe(value):
    if isinstance(value, datetime):
        return value.isoformat(sep=" ")
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, dict):
        return {key: _json_safe(val) for key, val in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    return value


def create_audit_log(
    *,
    entity_type,
    action,
    entity_id=None,
    user_id=None,
    user_email=None,
    account_id=None,
    invoice_id=None,
    contact_id=None,
    before_data=None,
    after_data=None,
):
    resolved_email = _resolve_user_email(user_id, user_email)
    audit = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        user_id=user_id,
        user_email=resolved_email,
        account_id=account_id,
        invoice_id=invoice_id,
        contact_id=contact_id,
        before_data=_json_safe(before_data),
        after_data=_json_safe(after_data),
    )
    db.session.add(audit)
    return audit
