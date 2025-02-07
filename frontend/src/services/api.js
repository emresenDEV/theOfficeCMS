import axios from "axios";

// Base URL for Flask API (FIXME: UPDATE TO WHERE BACKEND IS HOSTED)
const API_BASE_URL = "http://127.0.0.1:5000";

// Axios instance for API requests
const api = axios.create({
baseURL: API_BASE_URL,
headers: { "Content-Type": "application/json" },
});

// Fetch all accounts EXPLAINED:
// EXPORT: exports the fetchDataTable function so it can be used in other parts of the app.
// ASYNC () => {: keyword to perform an asynchronous operation (API calls). Allows fetching data from the server without blocking the main thread. UI remains responsive.
// TRY: attempts to fetch the data from the server.
// CATCH: error handling (server issues, network problems). Logs error to console and returns an empty array. Error handling ensures the component doesn't break if the API request fails.
// CONST RESPONSE: makes the GET request to the endpoint ("/dataTableName")
// AWAIT: keyword. Pauses execution of function until api.get is resolved. Once resolved, the response is stored in the response variable. Allows for asynchronous code to be written in a synchronous style.
//  RETURN RESPONSE.DATA: returns the data from the response object. This is the data fetched from the server.

// Fetch Accounts
export const fetchAccounts = async () => {
    try {
        const response = await api.get("/accounts");
        return response.data;
    }
    catch (error) {
        console.error("Error fetching accounts:", error);
        return [];
    }
}

// Fetch Account By ID
export const fetchAccountById = async (accountId) => {
    try {
        const response = await fetch(`http://127.0.0.1:5000/accounts/${accountId}`);
        if (!response.ok) throw new Error("Failed to fetch account.");
        const data = await response.json();
        
        return {
            account_id: data.account_id,
            business_name: data.business_name || "Unknown Business",
            contact_name: data.contact_name || "N/A",
            email: data.email || "N/A",
            phone_number: data.phone_number || "N/A",
        };
    } catch (error) {
        console.error("Error fetching account:", error);
        return null;
    }
};


// Fetch Assigned Accounts
export const fetchAssignedAccounts = async (userId) => {
    try {
        const response = await fetch(`http://127.0.0.1:5000/accounts/assigned?user_id=${userId}`);
        if (!response.ok) throw new Error("Failed to fetch assigned accounts.");
        return await response.json();
    } catch (error) {
        console.error("Error fetching assigned accounts:", error);
        return [];
    }
};


// Fetch all commissions
export const fetchCommissions = async (userId, filter = "month", date = "") => {
    try {
        const url = new URL("http://127.0.0.1:5000/commissions");
        url.searchParams.append("user_id", userId);
        url.searchParams.append("filter", filter);
        if (date) url.searchParams.append("date", date);

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch commissions.");
        return await response.json();
    } catch (error) {
        console.error("Error fetching commissions:", error);
        return [];
    }
};


// Fetch all departments
export const fetchDepartments = async () => {
    try {
        const response = await api.get("/departments");
        return response.data;
    }
    catch (error) {
        console.error("Error fetching departments:", error);
        return [];
    }
}

// Fetch all employee_regions
export const fetchEmployeeRegions = async () => {
    try {
        const response = await API_BASE_URL.get("/employee_regions");
        return response.data;
    }
    catch (error) {
        console.error("Error fetching employee_regions:", error);
        return [];
    }
}

// Fetch all employees
export const fetchEmployees = async () => {
    try {
        const response = await api.get("/employees");
        return response.data;
    } catch (error) {
        console.error("Error fetching employees:", error);
        return [];
    }
};

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

// Fetch Invoices By ID
export const fetchInvoiceById = async (invoiceId) => {
    try {
        const response = await fetch(`http://127.0.0.1:5000/invoices/${invoiceId}`);
        if (!response.ok) throw new Error("Failed to fetch invoice.");
        return await response.json();
    } catch (error) {
        console.error("Error fetching invoice:", error);
        return null;
    }
};
// Fetch Update Invoice
export const updateInvoice = async (invoiceId, updatedData) => {
    try {
        const response = await fetch(`http://127.0.0.1:5000/invoices/${invoiceId}`, {
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

// Delete Invoice
export const deleteInvoice = async (invoiceId) => {
    try {
        const response = await fetch(`http://127.0.0.1:5000/invoices/${invoiceId}`, {
            method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete invoice.");
        return { success: true };
    } catch (error) {
        console.error("Error deleting invoice:", error);
        // return { success: false };
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

// Fetch all invoices
export const fetchInvoices = async () => {
    try {
        const response = await api.get("/invoices");
        return response.data;
    } catch (error) {
        console.error("Error fetching invoices:", error);
    return [];
}
};

// Fetch invoices for a specific account
export const fetchInvoicesByAccount = async (accountId) => {
    try {
        const response = await api.get(`/invoices?account_id=${accountId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching invoices for account:", error);
        return [];
    }
};


// Fetch Paid Invoices
export const fetchPaidInvoices = async (userId) => {
    try {
        const response = await fetch(`http://127.0.0.1:5000/invoices/paid?user_id=${userId}`);
        if (!response.ok) throw new Error("Failed to fetch paid invoices.");
        return await response.json();
    } catch (error) {
        console.error("Error fetching paid invoices:", error);
        return [];
    }
};

//Fetch Unpaid Invoices
export const fetchUnpaidInvoices = async (userId) => {
    try {
        const response = await fetch(`http://127.0.0.1:5000/invoices/unpaid?user_id=${userId}`);
        if (!response.ok) throw new Error("Failed to fetch unpaid invoices.");
        return await response.json();
    } catch (error) {
        console.error("Error fetching unpaid invoices:", error);
        return [];
    }
};

// Fetch Past Due Invoices
export const fetchPastDueInvoices = async (userId) => {
    try {
        const response = await fetch(`http://127.0.0.1:5000/invoices/past_due?user_id=${userId}`);
        if (!response.ok) throw new Error("Failed to fetch past due invoices.");
        return await response.json();
    } catch (error) {
        console.error("Error fetching past due invoices:", error);
        return [];
    }
};

// Create Invoice
export const createInvoice = async (invoiceData) => {
    try {
        const response = await fetch("http://127.0.0.1:5000/invoices", {
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
        const response = await api.get(`/notes?account_id=${accountId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching notes for account:", error);
        return [];
    }
};

// Fetch notes for a specific invoice
export const fetchNotesByInvoice = async (invoiceId) => {
    try {
        const response = await fetch(`http://127.0.0.1:5000/notes?invoice_id=${invoiceId}`);
        if (!response.ok) throw new Error("Failed to fetch invoice notes.");
        return await response.json();
    } catch (error) {
        console.error("Error fetching notes for invoice:", error);
        return [];
    }
};


// Fetch Tasks
export const fetchTasks = async (userId) => {
    try {
        const response = await fetch(`http://127.0.0.1:5000/notes?assigned_to=${userId}`);
        
        if (!response.ok) {
            throw new Error("Failed to fetch tasks.");
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return []; // Return an empty array to prevent crashes
    }
};



// Create Task
export const createTask = async (task) => {
    try {
        const response = await fetch("http://127.0.0.1:5000/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: task.user_id, // User who created the note
                note_text: task.text, // Task description
                assigned_to: task.assigned_to || task.user_id, // Default to self if not assigned
                completed: task.completed || false,
                note_type: "Task" // Helps differentiate from other notes
            }),
        });

        if (!response.ok) throw new Error("Failed to create task.");
        return await response.json();
    } catch (error) {
        console.error("Error creating task:", error);
        return null;
    }
};



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

// Fetch all region_zipcodes
export const fetchRegionZipcodes = async () => {
    try {
        const response = await api.get("/region_zipcodes");
        return response.data;
    } catch (error) {
        console.error("error fetching region_zipcodes:", error);
        return [];
    }
}

// Fetch all regions
export const fetchRegions = async () => {
    try {
        const response = await api.get("/regions");
        return response.data;
    } catch (error) {
        console.error("Error fetching regions:", error);
        return [];
    }
}

// Fetch all roles
export const fetchRoles = async () => {
    try {
        const response = await api.get("/roles");
        return response.data;
    } catch (error) {
        console.error("Error fetching roles", error);
        return [];
    }
}

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

// Fetch all user_roles
export const fetchUserRoles = async () => {
    try {
        const response = await api.get("/user_roles");
        return response.data;
    } catch (error) {
        console.error("Error fetching user_roles:", error);
        return [];
    }
}

// Fetch all users
export const fetchUsers = async () => {
    try {
        const response = await api.get("/users");
        return response.data;
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

// Login User
export const loginUser = async (username, password) => {
    try {
        const response = await fetch("http://127.0.0.1:5000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // Ensure cookies are sent
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            throw new Error("Login failed");
        }

        return await response.json(); // Returns user data
    } catch (error) {
        console.error("Error logging in:", error);
        throw error;
    }
};



export default api;
