import api from "./api";

export const fetchRegions = async () => {
    try {
        const response = await api.get("/regions/");
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching regions:", error.response?.data || error.message);
        return [];
    }
};

export const createRegion = async (regionName) => {
    try {
        const response = await api.post("/regions/", { region_name: regionName });
        return response.data;
    } catch (error) {
        console.error("❌ Error creating region:", error.response?.data || error.message);
        return null;
    }
};

export const updateRegion = async (regionId, regionName) => {
    try {
        const response = await api.put(`/regions/${regionId}`, { region_name: regionName });
        return response.data;
    } catch (error) {
        console.error("❌ Error updating region:", error.response?.data || error.message);
        return null;
    }
};
