// components/CreateNote.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const CreateNote = ({ onSave }) => {
    const [noteText, setNoteText] = useState("");
    const navigate = useNavigate();

    const handleSave = () => {
        if (!noteText.trim()) {
            alert("Note cannot be empty!");
            return;
        }
        onSave(noteText);
        navigate(-1); // Go back to the previous page
    };
// Notes have: note_id (PK), acccount_id (attached to account, required), invoice_id (if attached to invoice), user_id (who created), note_text, date_created (timestamp).
// Order should be:
// -date (MM/DD/YYYY 00:00 AM/PM)
// -user_id (Created By:  username)
// -note_text
    return (
        <div className="p-6 max-w-3xl mx-auto bg-white shadow-lg rounded-lg">
            <h2 className="text-xl font-semibold">Create New Note</h2>
            <textarea 
                className="border p-2 w-full rounded mt-2"
                rows="4"
                placeholder="Write your note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
            ></textarea>
            <button 
                onClick={handleSave} 
                className="bg-green-500 text-white px-4 py-2 rounded mt-3"
            >
                Save Note
            </button>
        </div>
    );
};

// ✅ PropTypes Validation
CreateNote.propTypes = {
    onSave: PropTypes.func.isRequired, // Callback function to handle saving the note
};

export default CreateNote;
