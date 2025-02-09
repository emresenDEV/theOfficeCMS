from flask import Blueprint, request, jsonify
from models import Notes
from database import db

note_bp = Blueprint("note", __name__)

# ----------------------------
# 📌 NOTES API
# ----------------------------
# Get Notes API
@app.route("/notes", methods=["GET"])
def get_notes():
    account_id = request.args.get("account_id")
    assigned_to = request.args.get("assigned_to")

    if account_id:
        notes = Notes.query.filter_by(account_id=account_id).all()
    elif assigned_to:
        notes = Notes.query.filter_by(assigned_to=assigned_to).all()
    else:
        notes = Notes.query.all()

    if not notes:
        return jsonify([])  # ✅ Ensure empty list instead of error

    return jsonify([
        {
            "id": note.note_id,
            "account_id": note.account_id,
            "invoice_id": note.invoice_id,
            "text": note.note_text,
            "completed": note.completed,
            "assigned_to": note.assigned_to,
            "date_created": note.date_created.strftime('%Y-%m-%d %H:%M:%S')
        } for note in notes
    ])

#Create Notes API
@app.route("/notes", methods=["POST"])
def create_note():
    data = request.json
    
    if not data.get("text") or not data.get("user_id"):
        return jsonify({"message": "Missing required fields"}), 400
    
    new_note = Notes(
        user_id=data["user_id"],  
        account_id=data.get("account_id"),
        invoice_id=data.get("invoice_id"),
        note_text=data["text"], 
        note_type=data.get("note_type", "Task"),
        assigned_to=data.get("assigned_to"),
        completed=data.get("completed", False),
    )
    db.session.add(new_note)
    db.session.commit()

    return jsonify({"message": "Task created successfully", "note_id": new_note.note_id}), 201
