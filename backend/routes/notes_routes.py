from flask import Blueprint, request, jsonify
from models import Notes, Users
from database import db
from audit import create_audit_log

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
        return jsonify([])  #  Ensure empty list instead of error

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
@notes_bp.route("/", methods=["POST"])
def create_note():
    data = request.json
    try:
        print(f"🔍 Incoming Data: {data}")
        # Extract note data
        account_id = data.get("account_id")
        user_id = data.get("user_id")
        invoice_id = data.get("invoice_id")
        note_text = data.get("note_text")

        if not account_id or not user_id or not note_text:
            return jsonify({"error": "Missing required fields"}), 400
        
        # Fetch the user's information based on user_id
        user = Users.query.get(user_id)
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        new_note = Notes(
            account_id=account_id,
            user_id=user_id,
            invoice_id=invoice_id if invoice_id else None,
            note_text=note_text,
            date_created=db.func.current_timestamp()
        )

        db.session.add(new_note)
        db.session.flush()

        create_audit_log(
            entity_type="note",
            entity_id=new_note.note_id,
            action="create",
            user_id=user_id,
            account_id=account_id,
            invoice_id=invoice_id,
            after_data={
                "note_id": new_note.note_id,
                "account_id": new_note.account_id,
                "user_id": new_note.user_id,
                "invoice_id": new_note.invoice_id,
                "note_text": new_note.note_text,
                "date_created": new_note.date_created.strftime("%Y-%m-%d %H:%M:%S")
                if new_note.date_created
                else None,
            },
        )

        db.session.commit()
        
        return jsonify({
            "success": True,
                "data": {
                "note_id": new_note.note_id,
                "account_id": new_note.account_id,
                "user_id": new_note.user_id,
                "username": user.username,
                "invoice_id": new_note.invoice_id,
                "note_text": new_note.note_text,
                "date_created": new_note.date_created.strftime("%Y-%m-%d %H:%M:%S")
                }
        }), 201

    except Exception as e:
        print(f"❌ Error creating note: {str(e)}")
        return jsonify({"error": "An error occurred while creating the note"}), 500


# Fetch all notes for a specific account


@notes_bp.route("/account/<int:account_id>", methods=["GET"])
def get_notes_by_account(account_id):
    try:
        # Proper JOIN with Users table to fetch username
        notes = db.session.query(Notes, Users.username).join(
            Users, Notes.user_id == Users.user_id
        ).filter(Notes.account_id == account_id).all()

        notes_list = [
            {
                "note_id": note.Notes.note_id,
                "account_id": note.Notes.account_id,
                "user_id": note.Notes.user_id,
                "username": note.username,  
                "invoice_id": note.Notes.invoice_id,
                "note_text": note.Notes.note_text,
                "date_created": note.Notes.date_created.strftime("%Y-%m-%d %H:%M:%S")
            }
            for note in notes
        ]

        return jsonify(notes_list), 200

    except Exception as e:
        print(f"❌ Error fetching notes: {str(e)}")
        return jsonify({"error": "An error occurred while fetching notes"}), 500
    
#  Get Notes by Invoice ID
@notes_bp.route("/invoice/<int:invoice_id>", methods=["GET"])
def get_notes_by_invoice(invoice_id):
    try:
        notes = db.session.query(Notes, Users.username).join(
            Users, Notes.user_id == Users.user_id
        ).filter(Notes.invoice_id == invoice_id).all()
        if not notes:
            return jsonify([]), 200  # Return an empty list if no notes found

        notes_list = [
            {
                "note_id": note.Notes.note_id,
                "account_id": note.Notes.account_id,
                "user_id": note.Notes.user_id,
                "username": note.username,
                "invoice_id": note.Notes.invoice_id,
                "note_text": note.Notes.note_text,
                "date_created": note.Notes.date_created.strftime("%Y-%m-%d %H:%M:%S") if note.Notes.date_created else None,
            }
            for note in notes
        ]
        return jsonify(notes_list), 200
    except Exception as e:
        print(f"❌ Error fetching notes for invoice: {str(e)}")
        return jsonify({"error": "An error occurred while fetching notes"}), 500
