// accountService.js
import api from "./api";

// Fetch All Accounts
export const fetchAccounts = async () => {
    try {
        const response = await api.get("/accounts");
        return response.data;
    } catch (error) {
        console.error("Error fetching accounts:", error);
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
