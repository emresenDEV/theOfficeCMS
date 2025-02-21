import api from "./api";

// ✅ Fetch All Industries
export const fetchIndustries = async () => {
    try {
        const response = await api.get("/industries/");
        console.log("✅ Fetched Industries:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching industries:", error.response?.data || error.message);
        return [];
    }
};

// ✅ Create New Industry
export const createIndustry = async (industryName) => {
    try {
        const response = await api.post("/industries/", { industry_name: industryName });
        console.log("✅ Industry Created:", response.data);
        return response.data; // Returns new industry_id
    } catch (error) {
        console.error("❌ Error creating industry:", error.response?.data || error.message);
        return null;
    }
};

// ✅ Update Industry Name (If Needed)
export const updateIndustry = async (industryId, industryName) => {
    try {
        const response = await api.put(`/industries/${industryId}`, { industry_name: industryName });
        console.log("✅ Industry Updated:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Error updating industry:", error.response?.data || error.message);
        return null;
    }
};
