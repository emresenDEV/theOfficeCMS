import api from "./api"; 

// Fetch total company sales for each month
export const fetchCompanySales = async () => {
    try {
        const response = await api.get("/sales/company");
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching company sales:", error);
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
export const fetchBranchSales = async () => {
    try {
        const response = await api.get("/sales/branch");
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching branch sales:", error);
        return {};
    }
};

// Fetch sales of all users in a branch
export const fetchBranchUsersSales = async (branchId) => {
    try {
        const response = await api.get(`/sales/branch-users?branch_id=${branchId}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Error fetching sales for branch ${branchId}:`, error);
        return {};
    }
};