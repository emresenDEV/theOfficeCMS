import api from "./api"; 

// Fetch total company sales for each month
export const fetchCompanySales = async (year) => {
    try {
        const response = await api.get("/sales/company", {
            params: { year }
        });
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching company sales:", error.response?.data || error.message);
        return Array(12).fill(0);
    }
};

// Fetch sales for a specific user for each month
export const fetchUserSales = async (userId) => {
    try {
        const response = await api.get(`/sales/user?user_id=${userId}`);
        return response.data; // Ensure backend returns an array of 12 numbers
    } catch (error) {
        console.error(`Error fetching sales for user ${userId}:`, error);
        return Array(12).fill(0); // Default to 0 if error occurs
    }
};

// Fetch branch-wide monthly sales
export const fetchBranchSales = async (year) => {
    try {
        const response = await api.get("/sales/branch", {
            params: { year }
        });
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching branch sales:", error.response?.data || error.message);
        return {};
    }
};

// Fetch sales of all users in a branch
export const fetchBranchUsersSales = async (branchId, year) => {
    try {
        const response = await api.get(`/sales/branch-users?branch_id=${branchId}&year=${year}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error fetching sales for branch ${branchId}:`, error);
        return {};
    }
};