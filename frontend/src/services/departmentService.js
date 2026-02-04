import api from "./api";

export const fetchDepartments = async () => {
  try {
    const response = await api.get("/departments");
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching departments:", error.response?.data || error.message);
    return [];
  }
};
