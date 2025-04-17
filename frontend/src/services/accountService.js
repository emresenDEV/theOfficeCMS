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

// ✅ Fetch Account Metrics (Revenue, Tasks, Last Invoice Date)
export const fetchAccountMetrics = async (salesRepId) => {
    try {
        const response = await api.get(`/accounts/account_metrics?sales_rep_id=${salesRepId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching account metrics:", error);
        return [];
    }
};

// Fetch Assigned Accounts
export const fetchAssignedAccounts = async (userId) => {
    try {
        //Use `sales_rep_id` instead of `user_id`
        const response = await api.get(`/accounts/assigned?sales_rep_id=${userId}`);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching assigned accounts:", error);
        return [];
    }
};


// Fetch Account Details by Account ID
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

// Create a New Account
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

// Update an Existing Account
export const updateAccount = async (accountId, accountData, userId) => {
    try {
        const updatedData = { ...accountData, updated_by_user_id: userId };
        const response = await api.put(`/accounts/update/${accountId}`, updatedData);
        console.log("✅ Account updated in DB:", response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error("❌ Error updating account:", error.response?.data || error.message);
        return { success: false, message: error.response?.data || "Update failed" };
    }
};

