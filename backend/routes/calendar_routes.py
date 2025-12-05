from flask import Blueprint, request, jsonify, session
from models import CalendarEvent
from database import db
from datetime import datetime

calendar_bp = Blueprint("calendar", __name__)


# READ
@calendar_bp.route("/events", methods=["GET"])
def get_calendar_events():
    user_id = request.args.get("user_id", type=int)
        
    if not user_id:
        user_id = request.args.get("user_id", type=int) 
    if not user_id:
        return jsonify({"message": "User ID is required"}), 400

    events = CalendarEvent.query.filter_by(user_id=user_id).all()  

    if not events:
        return jsonify([])

    return jsonify([
        {
            "event_id": event.event_id,
            "event_title": event.event_title or "Untitled Event",
            "location": event.location or "No Location",
            "start_time": event.start_time.strftime('%H:%M'),
            "end_time": event.end_time.strftime('%H:%M'),
            "start_date": event.start_date.strftime('%Y-%m-%d'),
            "end_date": event.end_date.strftime('%Y-%m-%d'),
            "notes": event.notes or "",
            "contact_name": event.contact_name or "",
            "phone_number": event.phone_number or "",
            "account_id": event.account_id,
            "user_id": event.user_id
        }
        for event in events
    ])

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
        start_time = datetime.strptime(data["start_time"], "%H:%M:%S").time()
        end_time = datetime.strptime(data["end_time"], "%H:%M:%S").time()

        new_event = CalendarEvent(
            event_title=data["event_title"],
            location=data.get("location"),
            start_time=start_time,
            end_time=end_time,
            start_date=datetime.strptime(data["start_date"], "%Y-%m-%d").date(),
            end_date=datetime.strptime(data["end_date"], "%Y-%m-%d").date(),
            notes=data.get("notes"),
            account_id=account_id,
            user_id=user_id,
            contact_name=data.get("contact_name"),
            phone_number=data.get("phone_number"),
        )

        db.session.add(new_event)
        db.session.commit()
        return jsonify({"message": "Event created successfully", "event_id": new_event.event_id}), 201

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

    print(f"📝 Received data: {data}")

    try:
        # Update event fields safely
        event.event_title = data.get("event_title", event.event_title)
        event.location = data.get("location", event.location)
        event.start_time = datetime.strptime(data["start_time"], "%H:%M:%S").time() if "start_time" in data else event.start_time
        event.end_time = datetime.strptime(data["end_time"], "%H:%M:%S").time() if "end_time" in data else event.end_time
        event.start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date() if "start_date" in data else event.start_date
        event.end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date() if "end_date" in data else event.end_date
        event.notes = data.get("notes", event.notes)
        event.account_id = data.get("account_id", event.account_id)
        event.contact_name = data.get("contact_name", event.contact_name)
        event.phone_number = data.get("phone_number", event.phone_number)

        print(f"✅ Updated event fields. Committing to database...")
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

    db.session.delete(event)
    db.session.commit()
    return jsonify({"message": "Event deleted successfully"}), 200
