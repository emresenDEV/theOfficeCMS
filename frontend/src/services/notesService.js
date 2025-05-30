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
        const response = await api.get(`/notes/account/${accountId}`, {
            params: { timestamp: Date.now() } // cache busting if needed
        });
        console.log("✅ Fetched Notes for Account", accountId, ":", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching notes:", error.response?.data || error.message);
        return [];
    }
};




// Fetch notes for a specific invoice
// export const fetchNotesByInvoice = async (invoiceId) => {
//     try {
//         const response = await api.get(`/notes?invoice_id=${invoiceId}`);
//         if (!response.ok) throw new Error("Failed to fetch invoice notes.");
//         return await response.json();
//     } catch (error) {
//         console.error("Error fetching notes for invoice:", error);
//         return [];
//     }
// };
export const fetchNotesByInvoice = async (invoiceId) => {
    try {
        // Adjust the endpoint to match your backend configuration.
        const response = await api.get(`/notes/invoice/${invoiceId}`);
        console.log("✅ Fetched Notes for Invoice:", response.data);
        return response.data;
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