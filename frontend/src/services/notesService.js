// notesService.js
import api from "./api";

// Fetch all notes
export const fetchNotes = async () => {
    try {
        const response = await api.get("/notes");
        return response.data;
    } catch (error) {
        console.error("Error fetching notes:", error);
        return [];
    }
}
// Fetch notes for a specific account
export const fetchNotesByAccount = async (accountId) => {
    try {
        const response = await api.get(`/notes/account/${accountId}`);
        console.log(`✅ Fetched Notes for Account ${accountId}:`, response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching notes for account:", error);
        return [];
    }
};

// Fetch notes for a specific invoice
export const fetchNotesByInvoice = async (invoiceId) => {
    try {
        const response = await api.get(`/notes?invoice_id=${invoiceId}`);
        if (!response.ok) throw new Error("Failed to fetch invoice notes.");
        return await response.json();
    } catch (error) {
        console.error("Error fetching notes for invoice:", error);
        return [];
    }
};