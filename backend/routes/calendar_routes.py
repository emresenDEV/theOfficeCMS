from flask import Blueprint, request, jsonify
from models import CalendarEvent  
from database import db
from datetime import datetime

calendar_bp = Blueprint("calendar", __name__)

@calendar_bp.route("/", methods=["OPTIONS"])
def options_tasks():
    """✅ Handle CORS preflight for /tasks"""
    response = jsonify({"message": "CORS preflight OK"})
    response.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", "http://localhost:5174")
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response, 200


@calendar_bp.route("/events", methods=["GET"])
def get_calendar_events():
    user_id = request.args.get("user_id", type=int)

    if not user_id:
        return jsonify({"message": "User ID is required"}), 400

    events = CalendarEvent.query.filter_by(user_id=user_id).all()  # ✅ Fetch events for the selected user

    if not events:
        print(f"❌ No events found for user_id: {user_id}")

    return jsonify([
        {
            "event_id": event.event_id,
            "event_title": event.event_title,
            "location": event.location,
            "start_time": event.start_time.strftime('%H:%M'),
            "end_time": event.end_time.strftime('%H:%M'),
            "start_date": event.start_date.strftime('%Y-%m-%d'),
            "end_date": event.end_date.strftime('%Y-%m-%d'),
            "notes": event.notes,
            "user_id": event.user_id 
        }
        for event in events
    ])



# ✅ Fetch Calendar Events for Logged-in User
# @calendar_bp.route("/calendar/events", methods=["GET"])
# def get_calendar_events():
#     user_id = request.args.get("user_id")
#     if not user_id:
#         return jsonify({"error": "User ID is required"}), 400

#     events = CalendarEvent.query.filter_by(user_id=user_id).all()
#     return jsonify([
#         {
#             "event_id": event.event_id,
#             "event_title": event.event_title,
#             "location": event.location,
#             "start_time": event.start_time.strftime('%H:%M'),
#             "end_time": event.end_time.strftime('%H:%M'),
#             "start_date": event.start_date.strftime('%Y-%m-%d'),
#             "end_date": event.end_date.strftime('%Y-%m-%d'),
#             "notes": event.notes,
#             "account_id": event.account_id,
#             "contact_name": event.contact_name,
#             "phone_number": event.phone_number
#         } for event in events
#     ])
    
# @calendar_bp.route("/events", methods=["GET"])
# def get_calendar_events():
#     """✅ Fetch meetings assigned to a user"""
#     user_id = request.args.get("user_id", type=int)

#     if not user_id:
#         return jsonify({"message": "User ID required"}), 400

#     meetings = CalendarEvent.query.filter(CalendarEvent.user_id == user_id).all()

#     if not meetings:
#         return jsonify([])  # ✅ Explicitly return empty array

#     return jsonify([meeting.to_dict() for meeting in meetings])


# ✅ Create a New Calendar Event
@calendar_bp.route("/calendar/events", methods=["POST"])
def create_calendar_event():
    data = request.json
    if not data.get("event_title") or not data.get("start_time") or not data.get("end_time"):
        return jsonify({"error": "Missing required fields"}), 400

    new_event = CalendarEvent(
        event_title=data["event_title"],
        location=data.get("location"),
        start_time=datetime.strptime(data["start_time"], "%H:%M").time(),
        end_time=datetime.strptime(data["end_time"], "%H:%M").time(),
        start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date(),
        end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date(),
        notes=data.get("notes"),
        account_id=data.get("account_id"),
        user_id=data["user_id"],
        contact_name=data.get("contact_name"),
        phone_number=data.get("phone_number"),
    )

    db.session.add(new_event)
    db.session.commit()
    return jsonify({"message": "Event created successfully", "event_id": new_event.event_id}), 201

# ✅ Update an Existing Calendar Event
@calendar_bp.route("/calendar/events/<int:event_id>", methods=["PUT"])
def update_calendar_event(event_id):
    event = CalendarEvent.query.get(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    data = request.json
    event.event_title = data.get("event_title", event.event_title)
    event.location = data.get("location", event.location)
    event.start_time = datetime.strptime(data["start_time"], "%H:%M").time() if "start_time" in data else event.start_time
    event.end_time = datetime.strptime(data["end_time"], "%H:%M").time() if "end_time" in data else event.end_time
    event.start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date() if "start_date" in data else event.start_date
    event.end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date() if "end_date" in data else event.end_date
    event.notes = data.get("notes", event.notes)
    event.account_id = data.get("account_id", event.account_id)
    event.contact_name = data.get("contact_name", event.contact_name)
    event.phone_number = data.get("phone_number", event.phone_number)

    db.session.commit()
    return jsonify({"message": "Event updated successfully"}), 200

# ✅ Delete a Calendar Event
@calendar_bp.route("/calendar/events/<int:event_id>", methods=["DELETE"])
def delete_calendar_event(event_id):
    event = CalendarEvent.query.get(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    db.session.delete(event)
    db.session.commit()
    return jsonify({"message": "Event deleted successfully"}), 200
