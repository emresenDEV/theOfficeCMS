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
// export const fetchNotesByAccount = async (accountId) => {
//     try {
//         const response = await api.get(`/notes/account/${accountId}`);
//         console.log(`✅ Fetched Notes for Account ${accountId}:`, response.data);
//         return response.data;
//     } catch (error) {
//         console.error("Error fetching notes for account:", error);
//         return [];
//     }
// };
export const fetchNotesByAccount = async (accountId) => {
    try {
        const response = await fetch(
            `http://127.0.0.1:5001/notes/account/${accountId}?timestamp=${Date.now()}`, // ✅ Cache-busting query param
            { credentials: "include" }
        );
        if (!response.ok) throw new Error("❌ Failed to fetch notes");

        const data = await response.json();
        console.log("✅ Fetched Notes for Account", accountId, ":", data);
        return data;
    } catch (error) {
        console.error("❌ Error fetching notes:", error);
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

// Create a New Note
export const createNote = async (noteData) => {
    try {
        const response = await api.post("/notes/", noteData);
        console.log("✅ Note successfully created:", response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error("❌ Error creating note:", error.response?.data || error.message);
        return { success: false, message: error.response?.data || "Failed to create note." };
    }
};