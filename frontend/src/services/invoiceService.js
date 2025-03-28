// invoiceService.js
import api from "./api";

// Fetch All Invoices
export const fetchInvoices = async (salesRepId) => {
    try {
        const response = await api.get(`/invoices?sales_rep_id=${salesRepId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching invoices:", error);
        return [];
    }
};

// Fetch Invoice by ID
export const fetchInvoiceById = async (invoiceId) => {
    try {
        const response = await api.get(`/invoices/invoice/${invoiceId}`);
        return {
            ...response.data,
            services: response.data.services || []
        };
    } catch (error) {
        console.error("Error fetching invoice:", error);
        return null;
    }
};

// Fetch Invoice by Account
export const fetchInvoiceByAccount = async (accountId, status = null) => {
    try {
        const url = status 
            ? `/invoices/account/${accountId}?status=${status}` 
            : `/invoices/account/${accountId}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching invoices for account:", error);
        return [];
    }
};

// Fetch Update Invoice
export const updateInvoice = async (invoiceId, updatedData) => {
    try {
        const response = await api.put(`/invoices/${invoiceId}`, updatedData);
        return response.data;
    } catch (error) {
        console.error("Error updating invoice:", error);
        return null;
    }
};

// Fetch Invoices by Status
export async function fetchInvoicesByStatus(status) {
    try {
        const response = await api.get(`/invoices/status/${status}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error fetching invoices with status ${status}:`, error);
        throw error;
    }
}


// Invoice Status API Call
export const updateInvoiceStatus = async (invoiceId, status) => {
    if (!invoiceId) {
        console.error("❌ Error: Invoice ID is missing.");
        return null;
    }

    try {
        console.log(`🔍 Sending update request for Invoice ID: ${invoiceId} with status: ${status}`);

        const response = await fetch(`http://127.0.0.1:5001/invoices/${invoiceId}/update_status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json", 
            },
            body: JSON.stringify({ status }),
            credentials: "include", // ✅ Ensures cookies are sent if required
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Failed to update invoice: ${errorText}`);
            throw new Error("Failed to update invoice status.");
        }

        console.log("✅ Invoice status updated successfully!");
        return await response.json();
    } catch (error) {
        console.error("❌ Error updating invoice status:", error);
        return null;
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
};

// Delete an invoice service by ID
export const deleteInvoiceService = async (invoiceServiceId) => {
    try {
        const response = await api.delete(`/invoices/invoice_services/${invoiceServiceId}`);
        return response.data;
        } catch (error) {
        console.error("Error deleting invoice service:", error);
        throw error;
        }
    };
    

//  Validate Invoice: Invoice must be related to account
export const validateInvoiceForAccount = async (accountId, invoiceId) => {
    try {
        const response = await api.get(`/invoices/validate/${accountId}/${invoiceId}`);
        console.log("✅ Invoice validation response:", response.data);
        return response.data.valid;
    } catch (error) {
        console.error("❌ Error validating invoice:", error.response?.data || error.message);
        return false;
    }
};

// Create Payment
export const logInvoicePayment = async (invoiceId, paymentData) => {
    try {
        const response = await api.post(`/invoices/${invoiceId}/log_payment`, paymentData);
        return response.data;
    } catch (error) {
        console.error("❌ Error logging payment:", error.response?.data || error.message);
        return null;
    }
};

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
        const response = await api.get("/invoices/payment_methods");
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

