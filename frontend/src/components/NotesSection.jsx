import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { createNote, fetchNotesByAccount } from "../services/notesService";
import { validateInvoiceForAccount } from "../services/invoiceService";

const NotesSection = ({ notes, accountId, userId, setNotes, refreshNotes }) => {
    const [searchNotes, setSearchNotes] = useState("");
    const [newNote, setNewNote] = useState("");
    const [invoiceId, setInvoiceId] = useState("");
    const navigate = useNavigate();

    // ✅ Update local state when notes prop changes
    useEffect(() => {
        console.log("🔄 Notes prop updated:", notes);
    }, [notes]);

    // ✅ Filter Notes (Search Parameters)
    const filteredNotes = notes.filter((note) => 
        searchNotes === "" ||
        (note.username && note.username.toLowerCase().includes(searchNotes.toLowerCase())) ||
        (note.date_created && note.date_created.includes(searchNotes)) ||
        (note.invoice_id && note.invoice_id.toString().includes(searchNotes))
    );

    // ✅ Sort notes from newest to oldest
    const sortedNotes = [...filteredNotes].sort(
        (a, b) => new Date(b.date_created) - new Date(a.date_created)
    );

    // ✅ Create a New Note with Validation
    const handleCreateNote = async () => {
        if (!newNote.trim()) return alert("❌ Note text cannot be empty.");
        if (!accountId) return alert("❌ Account ID is missing.");
        if (!userId) return alert("❌ User ID is missing.");

        // ✅ Validate invoice ID if provided
        if (invoiceId) {
            const isValidInvoice = await validateInvoiceForAccount(accountId, invoiceId);
            if (!isValidInvoice) {
                alert("❌ Invoice does not exist or is not associated with this account.");
                return;
            }
        }

        const noteData = {
            account_id: accountId,
            user_id: userId,
            invoice_id: invoiceId || null,
            note_text: newNote.trim(),
        };

        console.log("📤 Sending Note Data:", noteData);

        try {
            const response = await createNote(noteData);
            if (response && response.success) {
                await refreshNotes();  // ✅ Fetch new notes from backend
                setNewNote("");  // ✅ Clear form inputs
                setInvoiceId("");
            }
        } catch (error) {
            console.error("❌ Error creating note:", error);
            alert("Failed to create note. Please try again.");
        }
    };

    return (
        <div className="mt-6 border p-4 rounded-lg">
            <h2 className="text-xl font-semibold">Notes</h2>

            {/* ✅ Search Notes */}
            <div className="flex justify-between items-center mb-3">
                <input 
                    type="text" 
                    placeholder="Search notes..." 
                    className="border p-2 rounded w-1/3 flex-grow"
                    value={searchNotes}
                    onChange={(e) => setSearchNotes(e.target.value)}
                />
            </div>

            {/* ✅ Create New Note Section */}
            <div className="flex items-center mb-4 space-x-2">
                <input 
                    type="text" 
                    placeholder="New note..." 
                    className="border p-2 rounded flex-grow"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                />
                <input 
                    type="number"
                    placeholder="Invoice ID (Optional)"
                    className="border p-2 rounded w-1/4 appearance-none"
                    value={invoiceId}
                    onChange={(e) => setInvoiceId(e.target.value)}
                    pattern="[0-9]*"
                    style={{ appearance: "textfield" }}
                />
                <button 
                    onClick={handleCreateNote} 
                    className="bg-blue-600 text-white px-3 py-2 rounded shadow-lg hover:bg-blue-600 transition-colors"
                >
                    Save Note
                </button>
            </div>

            {/* ✅ Notes Table */}
            <div className="overflow-y-scroll h-48 border">
                <table className="w-full border">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Date</th>
                            <th>Note</th>
                            <th>Invoice ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedNotes.map((note) => (
                            <tr key={note.note_id}>
                                <td>{note.username || "Unknown User"}</td>
                                <td>
                                    {note.date_created
                                        ? new Date(note.date_created).toLocaleString("en-US", {
                                            month: "2-digit",
                                            day: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true,
                                        })
                                        : "Invalid Date"}
                                </td>
                                <td>{note.note_text || "No text provided"}</td>
                                <td>
                                    {note.invoice_id ? (
                                        <button
                                            onClick={() => navigate(`/invoices/${note.invoice_id}`)}
                                            className="text-blue-500 underline"
                                        >
                                            {note.invoice_id}
                                        </button>
                                    ) : "N/A"}
                                </td>
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
            username: PropTypes.string.isRequired,
            date_created: PropTypes.string.isRequired,
            note_text: PropTypes.string.isRequired,
            invoice_id: PropTypes.number
        })
    ).isRequired,
    accountId: PropTypes.number.isRequired,
    userId: PropTypes.number.isRequired,
    setNotes: PropTypes.func.isRequired,
    refreshNotes: PropTypes.func.isRequired,
};

export default NotesSection;
