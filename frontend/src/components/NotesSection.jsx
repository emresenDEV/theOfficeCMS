import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { createNote, fetchNotesByAccount } from "../services/notesService";
import { validateInvoiceForAccount } from "../services/invoiceService";
import { formatDateInTimeZone, formatTimeInTimeZone } from "../utils/timezone";

const NotesSection = ({ notes, accountId, userId, setNotes, refreshNotes, invoiceId }) => {
const navigate = useNavigate();
const [searchNotes, setSearchNotes] = useState("");
const [newNote, setNewNote] = useState("");
// Use a local state for the invoice ID input only if the prop isn't provided.
const [inputInvoiceId, setInputInvoiceId] = useState(invoiceId !== undefined ? invoiceId : "");

useEffect(() => {
    console.log("🔄 Notes prop updated:", notes);
}, [notes]);

// Filter notes based on search input
const filteredNotes = notes.filter((note) =>
    searchNotes === "" ||
    (note.username && note.username.toLowerCase().includes(searchNotes.toLowerCase())) ||
    (note.note_text && note.note_text.includes(searchNotes)) ||
    (note.invoice_id && note.invoice_id.toString().includes(searchNotes)) ||
    (note.task_id && note.task_id.toString().includes(searchNotes))
);

// Sort notes from newest to oldest
const sortedNotes = [...filteredNotes].sort(
    (a, b) => new Date(b.date_created) - new Date(a.date_created)
);

// Create a new note
const handleCreateNote = async () => {
    if (!newNote.trim()) return alert("❌ Note text cannot be empty.");
    if (!accountId) return alert("❌ Account ID is missing.");
    if (!userId) return alert("❌ User ID is missing.");

    // Determine the invoice ID to use:
    // - If the component received an invoiceId prop (e.g. on Invoice Details page), use that.
    // - Otherwise, use the value from the local input field.
    const noteInvoiceId = invoiceId !== undefined ? invoiceId : inputInvoiceId;

    // If an invoice ID was provided (or entered), validate it.
    if (noteInvoiceId) {
    const isValidInvoice = await validateInvoiceForAccount(accountId, noteInvoiceId);
    if (!isValidInvoice) {
        alert("❌ Invoice does not exist or is not associated with this account.");
        return;
    }
    }

    const noteData = {
    account_id: accountId,
    user_id: userId,
    invoice_id: noteInvoiceId || null,
    note_text: newNote.trim(),
    };

    console.log("📤 Sending Note Data:", noteData);

    try {
    const response = await createNote(noteData);
    if (response && response.success) {
        await refreshNotes(); // Refresh notes after successful creation
        setNewNote("");       // Clear the note input
        // Clear the input field only if the user is allowed to edit it (i.e. on Account Details page)
        if (invoiceId === undefined) {
        setInputInvoiceId("");
        }
    }
    } catch (error) {
    console.error("❌ Error creating note:", error);
    alert("Failed to create note. Please try again.");
    }
};

// Format date and time for display
const formatDate = (dateString) => {
    return formatDateInTimeZone(dateString, null, {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
    });
};

const formatTime = (dateString) => {
    return formatTimeInTimeZone(dateString, null, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};

return (
    <div className="mt-6 border border-border p-4 rounded-lg bg-card">
    <h2 className="text-xl font-semibold text-foreground">Notes</h2>

    {/* Search Input */}
    <div className="flex justify-between items-center mb-3">
        <input 
        type="text" 
        placeholder="Search notes..." 
        className="border border-border bg-card text-foreground p-2 rounded w-1/3 flex-grow"
        value={searchNotes}
        onChange={(e) => setSearchNotes(e.target.value)}
        />
    </div>

    {/* New Note Input Section */}
    <div className="flex items-center mb-4 space-x-2">
        <input 
        type="text" 
        placeholder="New note..." 
        className="border border-border bg-card text-foreground p-2 rounded flex-grow"
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        />
        {/* Only show the invoice ID input if a fixed invoiceId prop was not provided */}
        {invoiceId === undefined && (
        <input 
            type="number"
            placeholder="Invoice ID (Optional)"
            className="border border-border bg-card text-foreground p-2 rounded w-full sm:w-1/4 appearance-none"
            value={inputInvoiceId}
            onChange={(e) => setInputInvoiceId(e.target.value)}
            pattern="[0-9]*"
            style={{ appearance: "textfield" }}
        />
        )}
        <button 
        onClick={handleCreateNote} 
        className="bg-primary text-primary-foreground px-3 py-2 rounded shadow-sm hover:bg-primary/90 transition-colors"
        >
        Save Note
        </button>
    </div>

    {/* Notes Table */}
    <div className="overflow-auto h-48 border border-border rounded-lg">
        <table className="min-w-[900px] w-full text-foreground">
        <thead className="sticky top-0 bg-card shadow-sm">
            <tr>
            <th className="font-bold p-2 border-b border-r text-left text-muted-foreground">User</th>
            <th className="font-bold p-2 border-b border-r text-left text-muted-foreground">Date</th>
            <th className="font-bold p-2 border-b border-r text-left whitespace-nowrap text-muted-foreground">Time</th>
            <th className="font-bold p-2 border-b border-r text-left text-muted-foreground">Note</th>
            <th className="font-bold p-2 border-b border-r text-center whitespace-nowrap text-muted-foreground">Task</th>
            <th className="font-bold p-2 border-b text-center whitespace-nowrap text-muted-foreground">Invoice</th>
            </tr>
        </thead>
        <tbody>
            {sortedNotes.map((note, index) => (
            <tr 
                key={note.note_id || note.task_note_id} 
                className={`hover:bg-muted/60 ${
                    index % 2 === 0 ? "bg-muted/40" : "bg-card"
                }`}
            >
                <td className="p-2 border-b border-r text-left">{note.username || "Unknown User"}</td>
                <td className="p-2 border-b border-r text-left">{formatDate(note.date_created)}</td>
                <td className="p-2 border-b border-r text-left whitespace-nowrap">{formatTime(note.date_created)}</td>
                <td className="p-2 border-b border-r text-left">{note.note_text || "No text provided"}</td>
                <td className="p-2 border-b border-r text-center">
                {note.task_id ? (
                    <button
                    onClick={() => navigate(`/tasks/${note.task_id}`)}
                    className="bg-secondary text-secondary-foreground px-3 py-1 rounded shadow-sm hover:bg-secondary/80 transition-colors"
                    >
                    #{note.task_id}
                    </button>
                ) : (
                    <span className="text-muted-foreground">—</span>
                )}
                </td>
                <td className="p-2 border-b text-center">
                {note.invoice_id ? (
                    <button
                    onClick={() => navigate(`/invoice/${note.invoice_id}`)}
                    className="bg-secondary text-secondary-foreground px-4 py-1 rounded shadow-sm hover:bg-secondary/80 transition-colors w-24"
                    >
                    {note.invoice_id}
                    </button>
                ) : (
                    <span className="text-muted-foreground">N/A</span>
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
    note_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    // Make username optional in case it's missing from the API
    username: PropTypes.string,
    date_created: PropTypes.string.isRequired,
    note_text: PropTypes.string.isRequired,
    invoice_id: PropTypes.number,
    task_id: PropTypes.number,
    })
).isRequired,
accountId: PropTypes.number.isRequired,
userId: PropTypes.number.isRequired,
setNotes: PropTypes.func.isRequired,
refreshNotes: PropTypes.func.isRequired,
// invoiceId is optional; if provided, the note will auto-associate with it.
invoiceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default NotesSection;
