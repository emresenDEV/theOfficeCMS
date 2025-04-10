import api from "./api";

// Fetch all services
export const fetchServices = async () => {
    try {
        const response = await api.get("/services");
        return response.data;
    } catch (error) {
        console.error("Error fetching services:", error);
        return [];
    }
};

// Create new service
export const createService = async (serviceData) => {
    try {
        const response = await api.post("/services", serviceData);
        return response.data;
    } catch (error) {
        console.error("Error creating service:", error);
        return null;
    }
};

// Update service
export const updateService = async (serviceId, updatedData) => {
    try {
        const response = await api.put(`/services/${serviceId}`, updatedData);
        return response.data;
    } catch (error) {
        console.error("Error updating service:", error);
        return null;
    }
};
