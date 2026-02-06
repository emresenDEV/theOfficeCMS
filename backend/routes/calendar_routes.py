from flask import Blueprint, request, jsonify
from models import CalendarEvent, Account, CalendarEventAttendee, Users
from database import db
from datetime import datetime
from notifications import create_notification
from audit import create_audit_log

calendar_bp = Blueprint("calendar", __name__)


def _parse_time(value):
    if not value:
        return None
    for fmt in ("%H:%M:%S", "%H:%M"):
        try:
            return datetime.strptime(value, fmt).time()
        except ValueError:
            continue
    raise ValueError(f"Invalid time format: {value}")


def _serialize_event(event, viewer_id=None):
    attendees = CalendarEventAttendee.query.filter_by(event_id=event.event_id).all()
    attendee_list = []
    for attendee in attendees:
        user = Users.query.get(attendee.user_id)
        attendee_list.append({
            "user_id": attendee.user_id,
            "status": attendee.status,
            "user_name": f"{user.first_name} {user.last_name}".strip() if user else None,
        })

    viewer_status = None
    if viewer_id:
        if event.user_id == viewer_id:
            viewer_status = "owner"
        else:
            match = next((a for a in attendees if a.user_id == viewer_id), None)
            viewer_status = match.status if match else None

    return {
        "event_id": event.event_id,
        "event_title": event.event_title or "Untitled Event",
        "location": event.location or "No Location",
        "start_time": event.start_time.strftime("%H:%M"),
        "end_time": event.end_time.strftime("%H:%M"),
        "start_date": event.start_date.strftime("%Y-%m-%d"),
        "end_date": event.end_date.strftime("%Y-%m-%d"),
        "notes": event.notes or "",
        "reminder_minutes": event.reminder_minutes,
        "contact_name": event.contact_name or "",
        "phone_number": event.phone_number or "",
        "account_id": event.account_id,
        "user_id": event.user_id,
        "attendees": attendee_list,
        "viewer_status": viewer_status,
    }


# READ
@calendar_bp.route("/events", methods=["GET"])
def get_calendar_events():
    user_id = request.args.get("user_id", type=int)
    user_ids_param = request.args.get("user_ids")
    include_all = request.args.get("all", "false").lower() == "true"
        
    if not user_id:
        user_id = request.args.get("user_id", type=int) 
    if not user_id and not user_ids_param and not include_all:
        return jsonify({"message": "User ID is required"}), 400

    query = CalendarEvent.query
    viewer_id = None
    if user_ids_param:
        try:
            user_ids = [int(val) for val in user_ids_param.split(",") if val.strip()]
        except ValueError:
            return jsonify({"message": "Invalid user_ids"}), 400
        if user_ids:
            query = query.outerjoin(
                CalendarEventAttendee,
                CalendarEventAttendee.event_id == CalendarEvent.event_id,
            ).filter(
                (CalendarEvent.user_id.in_(user_ids))
                | (CalendarEventAttendee.user_id.in_(user_ids))
            ).distinct()
    elif user_id:
        viewer_id = user_id
        query = query.outerjoin(
            CalendarEventAttendee,
            CalendarEventAttendee.event_id == CalendarEvent.event_id,
        ).filter(
            (CalendarEvent.user_id == user_id)
            | (CalendarEventAttendee.user_id == user_id)
        ).distinct()

    events = query.all()

    if not events:
        return jsonify([])

    return jsonify([_serialize_event(event, viewer_id) for event in events])

#  Create a New Calendar Event
@calendar_bp.route("/events", methods=["POST"])
def create_calendar_event():
    data = request.json

    #  Simulating getting the user_id from the session (or authentication)
    # If you have authentication middleware, use the logged-in user
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "User authentication required"}), 401

    try:
        # Ensure user_id is an integer
        user_id = int(user_id)

        # Convert account_id if provided
        account_id = int(data["account_id"]) if data.get("account_id") else None

        # Ensure start_time and end_time are properly formatted
        start_time = _parse_time(data["start_time"])
        end_time = _parse_time(data["end_time"])

        reminder_minutes = data.get("reminder_minutes")
        reminder_minutes = int(reminder_minutes) if reminder_minutes not in (None, "") else None

        new_event = CalendarEvent(
            event_title=data["event_title"],
            location=data.get("location"),
            start_time=start_time,
            end_time=end_time,
            start_date=datetime.strptime(data["start_date"], "%Y-%m-%d").date(),
            end_date=datetime.strptime(data["end_date"], "%Y-%m-%d").date(),
            notes=data.get("notes"),
            reminder_minutes=reminder_minutes,
            account_id=account_id,
            user_id=user_id,
            contact_name=data.get("contact_name"),
            phone_number=data.get("phone_number"),
        )

        db.session.add(new_event)
        db.session.flush()
        invitee_ids = data.get("invitee_ids") or []
        try:
            invitee_ids = [int(val) for val in invitee_ids if val]
        except ValueError:
            invitee_ids = []
        invitee_ids = [val for val in invitee_ids if val != user_id]

        if invitee_ids:
            for invitee_id in invitee_ids:
                db.session.add(
                    CalendarEventAttendee(
                        event_id=new_event.event_id,
                        user_id=invitee_id,
                        status="pending",
                    )
                )
                invitee = Users.query.get(invitee_id)
                creator = Users.query.get(user_id)
                create_notification(
                    user_id=invitee_id,
                    notif_type="event_invite",
                    title=f"Event invite: {new_event.event_title}",
                    message=f"Invited by {creator.first_name} {creator.last_name}" if creator else "Event invitation",
                    link=f"/calendar?date={new_event.start_date.strftime('%Y-%m-%d')}",
                    source_type="calendar_event",
                    source_id=new_event.event_id,
                )
        account = Account.query.get(account_id) if account_id else None
        create_notification(
            user_id=user_id,
            notif_type="event_assigned",
            title=f"New event: {new_event.event_title}",
            message=account.business_name if account else "Calendar event assigned",
            link=f"/calendar?date={new_event.start_date.strftime('%Y-%m-%d')}",
            source_type="calendar_event",
            source_id=new_event.event_id,
        )
        create_audit_log(
            entity_type="calendar_event",
            entity_id=new_event.event_id,
            action="create",
            user_id=user_id,
            user_email=data.get("actor_email"),
            after_data={
                "event_id": new_event.event_id,
                "event_title": new_event.event_title,
                "start_date": new_event.start_date.strftime("%Y-%m-%d"),
                "end_date": new_event.end_date.strftime("%Y-%m-%d"),
                "start_time": new_event.start_time.strftime("%H:%M:%S"),
                "end_time": new_event.end_time.strftime("%H:%M:%S"),
                "location": new_event.location,
                "notes": new_event.notes,
                "reminder_minutes": new_event.reminder_minutes,
                "account_id": new_event.account_id,
                "user_id": new_event.user_id,
                "invitee_ids": invitee_ids,
            },
            account_id=new_event.account_id,
        )
        db.session.commit()
        return jsonify(_serialize_event(new_event, viewer_id=user_id)), 201

    except ValueError as e:
        return jsonify({"error": f"Invalid data format: {str(e)}"}), 400


# Update an Existing Calendar Event
@calendar_bp.route("/events/<int:event_id>", methods=["PUT"])
def update_calendar_event(event_id):
    print(f"🔍 Received PUT request for event ID: {event_id}")
    event = CalendarEvent.query.get(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    data = request.json  # Ensure JSON is parsed correctly
    if not data:
        return jsonify({"error": "Invalid JSON data"}), 400

    assigned_before = event.user_id
    before_data = {
        "event_id": event.event_id,
        "event_title": event.event_title,
        "start_date": event.start_date.strftime("%Y-%m-%d"),
        "end_date": event.end_date.strftime("%Y-%m-%d"),
        "start_time": event.start_time.strftime("%H:%M:%S"),
        "end_time": event.end_time.strftime("%H:%M:%S"),
        "location": event.location,
        "notes": event.notes,
        "reminder_minutes": event.reminder_minutes,
        "account_id": event.account_id,
        "user_id": event.user_id,
    }

    print(f"📝 Received data: {data}")

    try:
        # Update event fields safely
        event.event_title = data.get("event_title", event.event_title)
        event.location = data.get("location", event.location)
        event.start_time = _parse_time(data["start_time"]) if "start_time" in data else event.start_time
        event.end_time = _parse_time(data["end_time"]) if "end_time" in data else event.end_time
        event.start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date() if "start_date" in data else event.start_date
        event.end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date() if "end_date" in data else event.end_date
        event.notes = data.get("notes", event.notes)
        event.account_id = data.get("account_id", event.account_id)
        if "user_id" in data and data.get("user_id"):
            event.user_id = int(data.get("user_id"))
        if "reminder_minutes" in data:
            reminder_minutes = data.get("reminder_minutes")
            event.reminder_minutes = int(reminder_minutes) if reminder_minutes not in (None, "") else None
        event.contact_name = data.get("contact_name", event.contact_name)
        event.phone_number = data.get("phone_number", event.phone_number)
        if "invitee_ids" in data:
            invitee_ids = data.get("invitee_ids") or []
            try:
                invitee_ids = [int(val) for val in invitee_ids if val]
            except ValueError:
                invitee_ids = []
            invitee_ids = [val for val in invitee_ids if val != event.user_id]
            existing = CalendarEventAttendee.query.filter_by(event_id=event.event_id).all()
            existing_ids = {att.user_id for att in existing}
            new_ids = set(invitee_ids)
            to_add = new_ids - existing_ids
            to_remove = existing_ids - new_ids
            if to_remove:
                CalendarEventAttendee.query.filter(
                    CalendarEventAttendee.event_id == event.event_id,
                    CalendarEventAttendee.user_id.in_(list(to_remove)),
                ).delete(synchronize_session=False)
            for invitee_id in to_add:
                db.session.add(
                    CalendarEventAttendee(
                        event_id=event.event_id,
                        user_id=invitee_id,
                        status="pending",
                    )
                )
                invitee = Users.query.get(invitee_id)
                creator = Users.query.get(event.user_id)
                create_notification(
                    user_id=invitee_id,
                    notif_type="event_invite",
                    title=f"Event invite: {event.event_title}",
                    message=f"Invited by {creator.first_name} {creator.last_name}" if creator else "Event invitation",
                    link=f"/calendar?date={event.start_date.strftime('%Y-%m-%d')}",
                    source_type="calendar_event",
                    source_id=event.event_id,
                )

        print(f"✅ Updated event fields. Committing to database...")
        create_notification(
            user_id=event.user_id,
            notif_type="event_updated",
            title=f"Event updated: {event.event_title}",
            message="Calendar event details were updated",
            link=f"/calendar?date={event.start_date.strftime('%Y-%m-%d')}",
            source_type="calendar_event",
            source_id=event.event_id,
        )
        if assigned_before != event.user_id:
            create_notification(
                user_id=event.user_id,
                notif_type="event_assigned",
                title=f"New event: {event.event_title}",
                message="Calendar event assigned",
                link=f"/calendar?date={event.start_date.strftime('%Y-%m-%d')}",
                source_type="calendar_event",
                source_id=event.event_id,
            )
        create_audit_log(
            entity_type="calendar_event",
            entity_id=event.event_id,
            action="update",
            user_id=data.get("actor_user_id") or event.user_id,
            user_email=data.get("actor_email"),
            before_data=before_data,
            after_data={
                "event_id": event.event_id,
                "event_title": event.event_title,
                "start_date": event.start_date.strftime("%Y-%m-%d"),
                "end_date": event.end_date.strftime("%Y-%m-%d"),
                "start_time": event.start_time.strftime("%H:%M:%S"),
                "end_time": event.end_time.strftime("%H:%M:%S"),
                "location": event.location,
                "notes": event.notes,
                "reminder_minutes": event.reminder_minutes,
                "account_id": event.account_id,
                "user_id": event.user_id,
            },
            account_id=event.account_id,
        )
        db.session.commit()
        print(f"✅ Event {event_id} successfully updated in database")
        return jsonify({"message": "Event updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error updating event: {str(e)}")
        return jsonify({"error": f"Failed to update event: {str(e)}"}), 500




# Delete a Calendar Event
@calendar_bp.route("/events/<int:event_id>", methods=["DELETE"])
def delete_calendar_event(event_id):
    event = CalendarEvent.query.get(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    before_data = {
        "event_id": event.event_id,
        "event_title": event.event_title,
        "start_date": event.start_date.strftime("%Y-%m-%d"),
        "end_date": event.end_date.strftime("%Y-%m-%d"),
        "start_time": event.start_time.strftime("%H:%M:%S"),
        "end_time": event.end_time.strftime("%H:%M:%S"),
        "location": event.location,
        "notes": event.notes,
        "reminder_minutes": event.reminder_minutes,
        "account_id": event.account_id,
        "user_id": event.user_id,
    }

    db.session.delete(event)
    create_audit_log(
        entity_type="calendar_event",
        entity_id=event_id,
        action="delete",
        user_id=request.args.get("actor_user_id", type=int) or event.user_id,
        user_email=request.args.get("actor_email"),
        before_data=before_data,
        after_data=None,
        account_id=event.account_id,
    )
    db.session.commit()
    return jsonify({"message": "Event deleted successfully"}), 200


@calendar_bp.route("/events/<int:event_id>/rsvp", methods=["POST"])
def rsvp_calendar_event(event_id):
    data = request.json or {}
    user_id = data.get("user_id") or data.get("actor_user_id")
    status = data.get("status")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    if status not in ("accepted", "declined"):
        return jsonify({"error": "Invalid RSVP status"}), 400

    event = CalendarEvent.query.get_or_404(event_id)
    attendee = CalendarEventAttendee.query.filter_by(event_id=event_id, user_id=int(user_id)).first()
    if not attendee:
        return jsonify({"error": "Invite not found"}), 404

    attendee.status = status
    attendee.responded_at = datetime.utcnow()

    user = Users.query.get(int(user_id))
    create_notification(
        user_id=event.user_id,
        notif_type="event_rsvp",
        title=f"{user.first_name if user else 'A user'} {status} the invite",
        message=event.event_title,
        link=f"/calendar?date={event.start_date.strftime('%Y-%m-%d')}",
        source_type="calendar_event",
        source_id=event.event_id,
    )

    create_audit_log(
        entity_type="calendar_event",
        entity_id=event.event_id,
        action="rsvp",
        user_id=int(user_id),
        user_email=data.get("actor_email"),
        after_data={
            "event_id": event.event_id,
            "user_id": int(user_id),
            "status": status,
        },
        account_id=event.account_id,
    )

    db.session.commit()
    return jsonify({"message": "RSVP updated", "status": status}), 200
