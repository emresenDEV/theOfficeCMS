// accountService.js
import api from "./api";

// Fetch All Accounts
export const fetchAccounts = async () => {
    try {
        const response = await api.get("/accounts");
        console.log("✅ Fetched Accounts:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching accounts:", error.response?.data || error.message);
        return [];
    }
};

// Fetch Account By ID
export const fetchAccountById = async (accountId) => {
    try {
        const response = await api.get(`/accounts/${accountId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching account:", error);
        return { business_name: "Unknown Account" };
    }
};

// Fetch Assigned Accounts
export const fetchAssignedAccounts = async (userId) => {
    try {
        const response = await api.get(`/accounts/assigned?user_id=${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching assigned accounts:", error);
        return [];
    }
};

// ✅ Fetch Account Details by Account ID
export const fetchAccountDetails = async (accountId) => {
    try {
        const response = await api.get(`/accounts/details/${accountId}`);
        console.log(`✅ Fetched Account Details for ID ${accountId}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`❌ Error fetching account details for ID ${accountId}:`, error.response?.data || error.message);
        return null;
    }
};

// ✅ Create a New Account
export const createAccount = async (accountData) => {
    try {
        const response = await api.post("/accounts/", accountData);
        console.log("✅ Account Created:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error creating account:", error.response?.data || error.message);
        return null;
    }
};

// ✅ Update an Existing Account

export const updateAccount = async (accountId, accountData) => {
    try {
        const response = await api.put(`/accounts/update/${accountId}`, accountData);
        console.log("✅ Account updated in DB:", response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error("❌ Error updating account:", error.response?.data || error.message);
        return { success: false, message: error.response?.data || "Update failed" };
    }
};
// // Fetch Accounts
// export const fetchAccounts = async () => {
//     try {
//         const response = await api.get("/accounts");
//         return response.data;
//     }
//     catch (error) {
//         console.error("Error fetching accounts:", error);
//         return [];
//     }
// }

// // Fetch Account By ID
// export const fetchAccountById = async (accountId) => {
//     try {
//         const response = await fetch(`http://127.0.0.1:5001/accounts/${accountId}`);
//         if (!response.ok) throw new Error("Failed to fetch account.");
//         return await response.json();
//     } catch (error) {
//         console.error("Error fetching account:", error);
//         return { business_name: "Unknown Account" };
//     }
// };


// // Fetch Assigned Accounts
// export const fetchAssignedAccounts = async (userId) => {
//     try {
//         const response = await fetch(`http://127.0.0.1:5001/accounts/assigned?user_id=${userId}`);
//         if (!response.ok) throw new Error("Failed to fetch assigned accounts.");
//         return await response.json();
//     } catch (error) {
//         console.error("Error fetching assigned accounts:", error);
//         return [];
//     }
// };
