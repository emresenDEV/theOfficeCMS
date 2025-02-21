// components/NotesSection.jsx
import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

const NotesSection = ({ notes }) => {
    const [searchNotes, setSearchNotes] = useState("");
    const navigate = useNavigate();

    // ✅ Filter Notes
    const filteredNotes = notes.filter(note => 
        searchNotes === "" ||
        note.username.toLowerCase().includes(searchNotes.toLowerCase()) ||
        note.date_created.includes(searchNotes) ||
        (note.invoice_id && note.invoice_id.toString().includes(searchNotes))
    );

    return (
        <div className="mt-6 border p-4 rounded-lg">
            <h2 className="text-xl font-semibold">Notes</h2>
            <div className="flex justify-between items-center mb-3">
                <input 
                    type="text" 
                    placeholder="Search notes..." 
                    className="border p-2 rounded w-1/3"
                    value={searchNotes}
                    onChange={(e) => setSearchNotes(e.target.value)}
                />
                <button 
                    onClick={() => navigate("/create-note")} 
                    className="bg-blue-500 text-white px-4 ml-2"
                >
                    Create Note
                </button>
            </div>
            <div className="overflow-y-scroll h-48 border">
                <table className="w-full border">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Date</th>
                            <th>Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredNotes.slice(0, 6).map(note => (
                            <tr key={note.note_id}>
                                <td>{note.username}</td>
                                <td>{note.date_created}</td>
                                <td>{note.note_text}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

NotesSection.propTypes = {
    notes: PropTypes.arrayOf(
        PropTypes.shape({
            note_id: PropTypes.number.isRequired,
            username: PropTypes.string,
            date_created: PropTypes.string.isRequired,
            note_text: PropTypes.string.isRequired,
            invoice_id: PropTypes.number
        })
    ).isRequired,
};

export default NotesSection;
