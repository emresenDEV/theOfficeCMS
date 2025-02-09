// regionService.js
import api from "./api";
const API_BASE_URL = "http://127.0.0.1:5001";

// Fetch all region_zipcodes
export const fetchRegionZipcodes = async () => {
    try {
        const response = await api.get("/region_zipcodes");
        return response.data;
    } catch (error) {
        console.error("error fetching region_zipcodes:", error);
        return [];
    }
}

// Fetch all regions
export const fetchRegions = async () => {
    try {
        const response = await api.get("/regions");
        return response.data;
    } catch (error) {
        console.error("Error fetching regions:", error);
        return [];
    }
}

// Fetch all employee_regions
export const fetchEmployeeRegions = async () => {
    try {
        const response = await API_BASE_URL.get("/employee_regions");
        return response.data;
    }
    catch (error) {
        console.error("Error fetching employee_regions:", error);
        return [];
    }
}