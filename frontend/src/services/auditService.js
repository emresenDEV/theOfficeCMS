import api from "./api";

export const fetchAuditLogs = async (params = {}) => {
  try {
    const response = await api.get("/audit", { params });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching audit logs:", error.response?.data || error.message);
    return [];
  }
};

export const fetchAuditSummary = async (days = 7) => {
  try {
    const response = await api.get("/audit/summary", { params: { days } });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching audit summary:", error.response?.data || error.message);
    return null;
  }
};
