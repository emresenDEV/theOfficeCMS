// invoiceService.js
import api from "./api";

// Fetch All Invoices
export const fetchInvoices = async (userId) => {
    try {
        const response = await api.get(`/invoices?user_id=${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching invoices:", error);
        return [];
    }
};

// Fetch Invoice by ID
export const fetchInvoiceById = async (invoiceId) => {
    try {
        const response = await api.get(`/invoices/${invoiceId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching invoice:", error);
        return null;
    }
};

// Fetch Invoice by Account
export const fetchInvoiceByAccount = async (accountId) => {
    try {
        const response = await api.get(`/invoices?account_id=${accountId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching invoices for account:", error);
        return null;
    }
};



// Fetch Paid Invoices
export const fetchPaidInvoices = async (userId) => {
    try {
        const response = await api.get(`/invoices/paid?user_id=${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching paid invoices:", error);
        return [];
    }
};

// Fetch Unpaid Invoices
export const fetchUnpaidInvoices = async (userId) => {
    try {
        const response = await api.get(`/invoices/unpaid?user_id=${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching unpaid invoices:", error);
        return [];
    }
};

// Fetch Past Due Invoices
export const fetchPastDueInvoices = async (userId) => {
    try {
        const response = await fetch(`http://127.0.0.1:5001/invoices/past_due?user_id=${userId}`);
        if (!response.ok) throw new Error("Failed to fetch past due invoices.");
        return await response.json();
    } catch (error) {
        console.error("❌ API Error - Fetching Past Due Invoices:", error);
        return [];
    }
};


// Fetch Update Invoice
export const updateInvoice = async (invoiceId, updatedData) => {
    try {
        const response = await fetch(`http://127.0.0.1:5001/invoices/${invoiceId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData),
        });

        if (!response.ok) throw new Error("Failed to update invoice.");
        return await response.json();
    } catch (error) {
        console.error("Error updating invoice:", error);
        return null;
        // return { success: false };
    }
};

// Create Invoice
export const createInvoice = async (invoiceData) => {
    try {
        const response = await fetch("http://127.0.0.1:5001/invoices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(invoiceData),
        });

        if (!response.ok) throw new Error("Failed to create invoice.");
        return await response.json();
    } catch (error) {
        console.error("Error creating invoice:", error);
        return { success: false };
    }
};


// ✅ Delete Invoice
export const deleteInvoice = async (invoiceId) => {
    try {
        await api.delete(`/invoices/${invoiceId}`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting invoice:", error);
        return { success: false };
    }
};



// Fetch all invoice_services
export const fetchInvoiceServices = async () => {
    try {
        const response = await api.get("invoice_services");
        return response.data;
    } catch (error) {
        console.error("Error fetching invoice_services:", error);
        return [];
    }
}

// // Fetch all invoices
// export const fetchInvoices = async (userId) => {
//     try {
//         const response = await fetch(`http://127.0.0.1:5001/invoices?user_id=${userId}`);
//         if (!response.ok) throw new Error("Failed to fetch invoices.");
//         return await response.json();
//     } catch (error) {
//         console.error("Error fetching invoices:", error);
//         return [];
//     }
// };


// // Fetch invoices for a specific account
// export const fetchInvoicesByAccount = async (accountId) => {
//     try {
//         const response = await api.get(`/invoices?account_id=${accountId}`);
//         return response.data;
//     } catch (error) {
//         console.error("Error fetching invoices for account:", error);
//         return [];
//     }
// };


// // Fetch Paid Invoices
// export const fetchPaidInvoices = async (userId) => {
//     try {
//         console.log(`🔍 Fetching Paid Invoices for user ${userId}`);
//         const response = await fetch(`http://127.0.0.1:5001/invoices/paid?user_id=${userId}`);
//         if (!response.ok) throw new Error("Failed to fetch paid invoices.");
        
//         const data = await response.json();
//         console.log("✅ API Response - Paid Invoices:", data.length, "invoices found."); // ✅ Debugging Log
//         return data;
//     } catch (error) {
//         console.error("❌ API Error - Fetching Paid Invoices:", error);
//         return [];
//     }
// };



// // Fetch Unpaid Invoices
// export const fetchUnpaidInvoices = async (userId) => {
//     try {
//         const response = await fetch(`http://127.0.0.1:5001/invoices/unpaid?user_id=${userId}`);
//         if (!response.ok) throw new Error("Failed to fetch unpaid invoices.");
//         return await response.json();
//     } catch (error) {
//         console.error("❌ API Error - Fetching Unpaid Invoices:", error);
//         return [];
//     }
// };




// Fetch all services
export const fetchServices = async () => {
    try {
        const response = await api.get("/services");
        return response.data;
    } catch (error) {
        console.error("Error fetching services:", error);
        return [];
    }
}

// Fetch all tax_rates
export const fetchTaxRates = async () => {
    try {
        const response = await api.get("/tax_roles");
        return response.data;
    } catch (error) {
        console.error("Error fetching tax_rates:", error);
    return [];
    }
}

// Fetch all payment_methods
export const fetchPaymentMethods = async () => {
    try {
        const response = await api.get("/payment_methods");
        return response.data;
    } catch (error) {
        console.error("Error fetching payment_methods:", error);
        return [];
    }
}

// Fetch all industries
export const fetchIndustries = async () => {
    try {
        const response = await api.get("/industries");
        return response.data;
    } catch (error) {
        console.error("Error fetching industries:", error);
        return [];
    }
}