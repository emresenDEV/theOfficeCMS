from datetime import datetime, timedelta, date
from decimal import Decimal, ROUND_HALF_UP

import pytz
from flask import Blueprint, jsonify, request
from sqlalchemy import func

from database import db
from models import (
    Account,
    Contact,
    ContactInteractions,
    Invoice,
    InvoicePipeline,
    Payment,
    Tasks,
    Users,
)
from routes.pipeline_routes import _effective_stage


analytics_bp = Blueprint("analytics", __name__)
central = pytz.timezone("America/Chicago")


def _to_decimal(value):
    try:
        return Decimal(str(value))
    except Exception:
        return Decimal("0")


def _to_cents(value):
    return int((_to_decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)) * 100)


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except Exception:
        return None


def _resolve_scope(user_id, sales_rep_id):
    return sales_rep_id or user_id


def _bucket_granularity(start_date, end_date):
    span = (end_date - start_date).days
    if span <= 31:
        return "day"
    if span <= 120:
        return "week"
    return "month"


def _build_buckets(start_date, end_date):
    gran = _bucket_granularity(start_date, end_date)
    if gran == "day":
        count = (end_date - start_date).days + 1
        labels = [
            (start_date + timedelta(days=idx)).strftime("%m/%d")
            for idx in range(count)
        ]
        return gran, labels
    if gran == "week":
        count = ((end_date - start_date).days // 7) + 1
        labels = [
            (start_date + timedelta(days=idx * 7)).strftime("%m/%d")
            for idx in range(count)
        ]
        return gran, labels

    # month
    month_count = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month) + 1
    labels = []
    year = start_date.year
    month = start_date.month
    for _ in range(month_count):
        labels.append(date(year, month, 1).strftime("%b %Y"))
        month += 1
        if month > 12:
            month = 1
            year += 1
    return gran, labels


def _bucket_index(gran, start_date, row_date):
    if gran == "day":
        return (row_date - start_date).days
    if gran == "week":
        return (row_date - start_date).days // 7
    return (row_date.year - start_date.year) * 12 + (row_date.month - start_date.month)


@analytics_bp.route("/overview", methods=["GET"])
def analytics_overview():
    user_id = request.args.get("user_id", type=int)
    sales_rep_id = request.args.get("sales_rep_id", type=int)
    date_from = _parse_date(request.args.get("date_from"))
    date_to = _parse_date(request.args.get("date_to"))

    scope_id = _resolve_scope(user_id, sales_rep_id)

    today = datetime.now(central).date()
    start_date = date_from or (today - timedelta(days=29))
    end_date = date_to or today

    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.max.time())

    # Payments (revenue)
    payments_query = db.session.query(func.coalesce(func.sum(Payment.total_paid), 0))
    if scope_id:
        payments_query = payments_query.filter(Payment.sales_rep_id == scope_id)
    payments_query = payments_query.filter(Payment.date_paid >= start_dt, Payment.date_paid <= end_dt)
    revenue_total = float(payments_query.scalar() or 0)

    # Accounts
    accounts_query = Account.query
    if scope_id:
        accounts_query = accounts_query.filter(Account.sales_rep_id == scope_id)
    active_accounts = accounts_query.count()

    # Invoices with payment totals and latest payment date
    payment_totals = (
        db.session.query(
            Payment.invoice_id.label("invoice_id"),
            func.coalesce(func.sum(Payment.total_paid), 0).label("total_paid"),
            func.max(Payment.date_paid).label("latest_paid"),
        )
        .group_by(Payment.invoice_id)
        .subquery()
    )
    invoice_query = (
        db.session.query(Invoice, payment_totals.c.total_paid, payment_totals.c.latest_paid)
        .outerjoin(payment_totals, Invoice.invoice_id == payment_totals.c.invoice_id)
    )
    if scope_id:
        invoice_query = invoice_query.filter(Invoice.sales_rep_id == scope_id)

    open_invoice_amount = Decimal("0")
    past_due_amount = Decimal("0")
    open_invoice_count = 0
    paid_days = []

    for invoice, total_paid, latest_paid in invoice_query.all():
        final_total = _to_decimal(invoice.final_total or 0)
        total_paid = _to_decimal(total_paid or 0)
        final_cents = _to_cents(final_total)
        paid_cents = _to_cents(total_paid)
        remaining_cents = max(final_cents - paid_cents, 0)

        if final_cents <= 0 or paid_cents >= final_cents:
            if latest_paid and start_dt <= latest_paid <= end_dt and invoice.date_created:
                paid_days.append((latest_paid.date() - invoice.date_created.date()).days)
        else:
            open_invoice_count += 1
            open_invoice_amount += Decimal(remaining_cents) / Decimal(100)
            if invoice.due_date and invoice.due_date < today:
                past_due_amount += Decimal(remaining_cents) / Decimal(100)

    avg_days_to_pay = round(sum(paid_days) / len(paid_days), 2) if paid_days else 0

    # Pipeline stage counts and totals
    pipeline_query = (
        db.session.query(InvoicePipeline, Invoice)
        .join(Invoice, Invoice.invoice_id == InvoicePipeline.invoice_id)
    )
    if scope_id:
        pipeline_query = pipeline_query.filter(Invoice.sales_rep_id == scope_id)
    if date_from or date_to:
        pipeline_query = pipeline_query.filter(Invoice.date_created >= start_dt, Invoice.date_created <= end_dt)

    stage_counts = {}
    stage_amounts = {}
    for pipeline, invoice in pipeline_query.all():
        stage = _effective_stage(invoice, pipeline)
        stage_counts[stage] = stage_counts.get(stage, 0) + 1
        stage_amounts[stage] = stage_amounts.get(stage, Decimal("0")) + _to_decimal(invoice.final_total or 0)

    pipeline_summary = [
        {
            "stage": stage,
            "count": int(stage_counts.get(stage, 0)),
            "amount": float(stage_amounts.get(stage, 0)),
        }
        for stage in stage_counts
    ]

    # Payment trend buckets
    gran, labels = _build_buckets(start_date, end_date)
    payments_trend = [0 for _ in labels]
    payments_rows = (
        db.session.query(Payment.date_paid, Payment.total_paid)
        .filter(Payment.date_paid >= start_dt, Payment.date_paid <= end_dt)
    )
    if scope_id:
        payments_rows = payments_rows.filter(Payment.sales_rep_id == scope_id)
    for paid_at, total_paid in payments_rows.all():
        if not paid_at:
            continue
        idx = _bucket_index(gran, start_date, paid_at.date())
        if 0 <= idx < len(payments_trend):
            payments_trend[idx] += float(total_paid or 0)

    payments_series = [
        {"label": label, "value": round(payments_trend[idx], 2)}
        for idx, label in enumerate(labels)
    ]

    # Interactions trend + types
    interactions_query = ContactInteractions.query.filter(
        ContactInteractions.created_at >= start_dt,
        ContactInteractions.created_at <= end_dt,
    )
    if scope_id:
        interactions_query = interactions_query.filter(ContactInteractions.user_id == scope_id)

    interactions_trend = [0 for _ in labels]
    for interaction in interactions_query.all():
        if not interaction.created_at:
            continue
        idx = _bucket_index(gran, start_date, interaction.created_at.date())
        if 0 <= idx < len(interactions_trend):
            interactions_trend[idx] += 1

    interactions_series = [
        {"label": label, "value": interactions_trend[idx]}
        for idx, label in enumerate(labels)
    ]

    interaction_types = (
        db.session.query(ContactInteractions.interaction_type, func.count(ContactInteractions.interaction_id))
        .filter(ContactInteractions.created_at >= start_dt, ContactInteractions.created_at <= end_dt)
    )
    if scope_id:
        interaction_types = interaction_types.filter(ContactInteractions.user_id == scope_id)
    interaction_types = interaction_types.group_by(ContactInteractions.interaction_type).all()

    interaction_types_series = [
        {"type": interaction_type, "count": int(count)}
        for interaction_type, count in interaction_types
    ]

    # Top contacts by interactions
    top_contacts_query = (
        db.session.query(ContactInteractions.contact_id, func.count(ContactInteractions.interaction_id))
        .filter(ContactInteractions.created_at >= start_dt, ContactInteractions.created_at <= end_dt)
    )
    if scope_id:
        top_contacts_query = top_contacts_query.filter(ContactInteractions.user_id == scope_id)
    top_contacts_query = (
        top_contacts_query.group_by(ContactInteractions.contact_id)
        .order_by(func.count(ContactInteractions.interaction_id).desc())
        .limit(5)
        .all()
    )

    contact_map = {
        contact.contact_id: contact
        for contact in Contact.query.filter(Contact.contact_id.in_([row[0] for row in top_contacts_query])).all()
    } if top_contacts_query else {}

    top_contacts = []
    for contact_id, count in top_contacts_query:
        contact = contact_map.get(contact_id)
        name = f"{contact.first_name or ''} {contact.last_name or ''}".strip() if contact else "Unknown"
        top_contacts.append({
            "contact_id": contact_id,
            "name": name or "Unknown",
            "count": int(count),
        })

    # Contact opt-outs
    contacts_query = Contact.query
    if scope_id:
        contacts_query = contacts_query.filter(Contact.contact_owner_user_id == scope_id)
    total_contacts = contacts_query.count()
    do_not_call = contacts_query.filter(Contact.do_not_call == True).count()
    email_opt_out = contacts_query.filter(Contact.email_opt_out == True).count()

    # Tasks summary
    tasks_query = Tasks.query
    if scope_id:
        tasks_query = tasks_query.filter(Tasks.assigned_to == scope_id)
    tasks_created = tasks_query.filter(Tasks.date_created >= start_dt, Tasks.date_created <= end_dt).count()
    tasks_completed = tasks_query.filter(Tasks.is_completed == True).count()
    tasks_overdue = tasks_query.filter(
        Tasks.is_completed == False,
        Tasks.due_date.isnot(None),
        Tasks.due_date < datetime.now(central),
    ).count()

    overdue_by_rep = []
    if not scope_id:
        overdue_rows = (
            db.session.query(Tasks.assigned_to, func.count(Tasks.task_id))
            .filter(
                Tasks.is_completed == False,
                Tasks.due_date.isnot(None),
                Tasks.due_date < datetime.now(central),
                Tasks.assigned_to.isnot(None),
            )
            .group_by(Tasks.assigned_to)
            .all()
        )
        user_ids = [row[0] for row in overdue_rows]
        users = {u.user_id: u for u in Users.query.filter(Users.user_id.in_(user_ids)).all()}
        for user_id, count in overdue_rows:
            user = users.get(user_id)
            overdue_by_rep.append({
                "user_id": user_id,
                "name": f"{user.first_name} {user.last_name}".strip() if user else "Unknown",
                "count": int(count),
            })

    response = {
        "summary": {
            "revenue": round(revenue_total, 2),
            "open_invoice_amount": float(open_invoice_amount),
            "past_due_amount": float(past_due_amount),
            "avg_days_to_pay": avg_days_to_pay,
            "active_accounts": active_accounts,
            "open_invoices": open_invoice_count,
        },
        "pipeline": pipeline_summary,
        "payments_trend": payments_series,
        "interactions_trend": interactions_series,
        "interaction_types": interaction_types_series,
        "contacts": {
            "total": total_contacts,
            "do_not_call": do_not_call,
            "email_opt_out": email_opt_out,
            "top_contacts": top_contacts,
        },
        "tasks": {
            "created": tasks_created,
            "completed": tasks_completed,
            "overdue": tasks_overdue,
        },
        "overdue_by_rep": overdue_by_rep,
        "bucket": gran,
        "date_range": {
            "from": start_date.isoformat(),
            "to": end_date.isoformat(),
        },
    }

    return jsonify(response), 200
