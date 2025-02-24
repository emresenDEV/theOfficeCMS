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
        (note.note_text && note.note_text.includes(searchNotes)) ||
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

    // ✅ Format date and time
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
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
                    className="bg-blue-600 text-white px-3 py-2 rounded shadow-lg hover:bg-blue-700 transition-colors"
                >
                    Save Note
                </button>
            </div>

            {/* ✅ Notes Table */}
            <div className="overflow-y-auto h-48 border rounded-lg">
                <table className="w-full">
                    <thead className="sticky top-0 bg-white shadow-sm">
                        <tr>
                            <th className="font-bold p-2 border-b border-r text-left">User</th>
                            <th className="font-bold p-2 border-b border-r text-left">Date</th>
                            <th className="font-bold p-2 border-b border-r text-left whitespace-nowrap">Time</th>
                            <th className="font-bold p-2 border-b border-r text-left">Note</th>
                            <th className="font-bold p-2 border-b text-center whitespace-nowrap">Invoice ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedNotes.map((note, index) => (
                            <tr 
                                key={note.note_id} 
                                className={`hover:bg-gray-50 ${index % 2 === 0 ? "bg-blue-50" : "bg-white"}`}
                            >
                                <td className="p-2 border-b border-r text-left">{note.username || "Unknown User"}</td>
                                <td className="p-2 border-b border-r text-left">{formatDate(note.date_created)}</td>
                                <td className="p-2 border-b border-r text-left whitespace-nowrap">{formatTime(note.date_created)}</td>
                                <td className="p-2 border-b border-r text-left">{note.note_text || "No text provided"}</td>
                                <td className="p-2 border-b text-center">
                                    {note.invoice_id ? (
                                        <button
                                            onClick={() => navigate(`invoices/invoice/${note.invoice_id}`)}
                                            className="bg-blue-600 text-white px-4 py-1 rounded shadow-lg hover:bg-blue-700 transition-colors w-24"
                                        >
                                            {note.invoice_id}
                                        </button>
                                    ) : (
                                        <span className="text-gray-500">N/A</span>
                                    )}
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