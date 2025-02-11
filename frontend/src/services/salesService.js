import api from "./api"; // Ensure you have API instance set up

// Fetch total company sales for each month
export const fetchCompanySales = async () => {
    try {
        const response = await api.get("/sales/company");
        return response.data; // Ensure backend returns an array of 12 numbers
    } catch (error) {
        console.error("Error fetching company sales:", error);
        return Array(12).fill(0); // Default to 0 if error occurs
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
