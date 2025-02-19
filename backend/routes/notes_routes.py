from flask import Blueprint, request, jsonify
from models import Notes
from database import db

notes_bp = Blueprint("note", __name__)

# Get Notes API
@notes_bp.route("/notes", methods=["GET"])
def get_notes():
    account_id = request.args.get("account_id")

    if account_id:
        notes = Notes.query.filter_by(account_id=account_id).all()
    else:
        notes = Notes.query.all()

    if not notes:
        return jsonify([])  # ✅ Ensure empty list instead of error

    return jsonify([
        {
            "id": note.note_id,
            "account_id": note.account_id,
            "invoice_id": note.invoice_id,
            "note_text": note.note_text,
            "completed": note.completed,
            "date_created": note.date_created.strftime('%Y-%m-%d %H:%M:%S')
        } for note in notes
    ])

#Create Notes API
@notes_bp.route("/notes", methods=["POST"])
def create_note():
    data = request.json
    
    if not data.get("note_text") or not data.get("user_id"):
        return jsonify({"message": "Missing required fields"}), 400
    
    new_note = Notes(
        user_id=data["user_id"],  
        account_id=data.get("account_id"),
        invoice_id=data.get("invoice_id"),
        note_text=data["text"], 
        note_type=data.get("note_type", "Task"),
        completed=data.get("completed", False),
    )
    db.session.add(new_note)
    db.session.commit()

    return jsonify({"message": "Task created successfully", "note_id": new_note.note_id}), 201

# ✅ Fetch all notes for a specific account
# @notes_bp.route("/", methods=["GET"])
# def get_notes_by_account():
#     account_id = request.args.get("account_id", type=int)

#     if not account_id:
#         return jsonify({"error": "Account ID is required"}), 400

#     notes = Note.query.filter_by(account_id=account_id).all()

#     if not notes:
#         return jsonify([]), 200  # Return an empty list instead of 404

#     return jsonify([note.to_dict() for note in notes]), 200

@notes_bp.route("/account/<int:account_id>", methods=["GET"])
def get_notes_by_account(account_id):
    notes = Notes.query.filter_by(account_id=account_id).all()

    if not notes:
        return jsonify([]), 200  # ✅ Return empty list instead of a 404 error

    return jsonify([
        {
            "note_id": note.note_id,
            "account_id": note.account_id,
            "invoice_id": note.invoice_id,
            "user_id": note.user_id,
            "note_text": note.note_text,
            "date_created": note.date_created.strftime('%Y-%m-%d %H:%M:%S')
        } for note in notes
    ]), 200
