from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
from models import Notifications, CalendarEvent
from database import db
from notifications import create_notification

notification_bp = Blueprint("notifications", __name__)


def _event_start_datetime(event):
    start_time = event.start_time
    try:
        time_part = start_time.time()
    except AttributeError:
        time_part = start_time
    return datetime.combine(event.start_date, time_part)


def _generate_event_reminders(user_id):
    now = datetime.now()
    events = CalendarEvent.query.filter_by(user_id=user_id).all()
    for event in events:
        if event.reminder_minutes is None:
            continue
        try:
            event_start = _event_start_datetime(event)
        except Exception:
            continue

        reminder_time = event_start - timedelta(minutes=event.reminder_minutes)
        if reminder_time <= now <= event_start:
            exists = Notifications.query.filter_by(
                user_id=user_id,
                type="event_reminder",
                source_type="calendar_event",
                source_id=event.event_id,
            ).first()
            if not exists:
                create_notification(
                    user_id=user_id,
                    notif_type="event_reminder",
                    title=f"Upcoming event: {event.event_title}",
                    message=f"Starts at {event_start.strftime('%I:%M %p').lstrip('0')}",
                    link=f"/calendar?date={event.start_date.strftime('%Y-%m-%d')}",
                    source_type="calendar_event",
                    source_id=event.event_id,
                    event_time=event_start,
                )
    db.session.commit()


@notification_bp.route("", methods=["GET"])
@notification_bp.route("/", methods=["GET"])
def get_notifications():
    user_id = request.args.get("user_id", type=int)
    unread_only = request.args.get("unread_only", "false").lower() == "true"
    limit = request.args.get("limit", type=int) or 50

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    _generate_event_reminders(user_id)

    query = Notifications.query.filter_by(user_id=user_id)
    if unread_only:
        query = query.filter_by(is_read=False)

    notifications = query.order_by(Notifications.created_at.desc()).limit(limit).all()
    return jsonify([
        {
            "notification_id": n.notification_id,
            "user_id": n.user_id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "link": n.link,
            "account_id": n.account_id,
            "invoice_id": n.invoice_id,
            "is_read": n.is_read,
            "created_at": n.created_at.strftime("%Y-%m-%d %H:%M:%S") if n.created_at else None,
            "event_time": n.event_time.strftime("%Y-%m-%d %H:%M:%S") if n.event_time else None,
            "source_type": n.source_type,
            "source_id": n.source_id,
        }
        for n in notifications
    ]), 200


@notification_bp.route("", methods=["POST"])
@notification_bp.route("/", methods=["POST"])
def create_notification_route():
    data = request.json or {}
    user_id = data.get("user_id")
    notif_type = data.get("type")
    title = data.get("title")

    if not user_id or not notif_type or not title:
        return jsonify({"error": "user_id, type, and title are required"}), 400

    create_notification(
        user_id=user_id,
        notif_type=notif_type,
        title=title,
        message=data.get("message"),
        link=data.get("link"),
        account_id=data.get("account_id"),
        invoice_id=data.get("invoice_id"),
        source_type=data.get("source_type"),
        source_id=data.get("source_id"),
    )
    db.session.commit()
    return jsonify({"message": "Notification created"}), 201


@notification_bp.route("/<int:notification_id>/read", methods=["PUT"])
def mark_notification_read(notification_id):
    notification = Notifications.query.get(notification_id)
    if not notification:
        return jsonify({"error": "Notification not found"}), 404

    notification.is_read = True
    db.session.commit()
    return jsonify({"message": "Notification marked as read"}), 200


@notification_bp.route("/read_all", methods=["PUT"])
def mark_all_read():
    user_id = request.args.get("user_id", type=int)
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    Notifications.query.filter_by(user_id=user_id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "All notifications marked as read"}), 200
