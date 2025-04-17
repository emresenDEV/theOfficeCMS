import api from "./api";

// Fetch All Branches
export const fetchBranches = async () => {
    try {
        const response = await api.get("/branches");
        console.log("✅ Fetched Branches:", response.data);
        return response.data.map(branch => ({
            branch_id: branch.branch_id,
            branch_name: branch.branch_name
        }));
    } catch (error) {
        console.error("❌ Error fetching branches:", error.response?.data || error.message);
        return [];
    }
};

// Fetch Branch by ID
export const fetchBranchById = async (branchId) => {
    try {
        const response = await api.get(`/branches/${branchId}`);
        console.log(`✅ Fetched Branch ID ${branchId}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`❌ Error fetching branch ID ${branchId}:`, error.response?.data || error.message);
        return null;
    }
};
