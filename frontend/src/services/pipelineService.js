import api from "./api";

export const fetchPipelineSummary = async (userId) => {
  try {
    const response = await api.get("/pipelines/summary", {
      params: userId ? { user_id: userId } : {},
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching pipeline summary:", error.response?.data || error.message);
    return [];
  }
};

export const fetchPipelineList = async (stage, userId) => {
  try {
    const params = {};
    if (stage) params.stage = stage;
    if (userId) params.user_id = userId;
    const response = await api.get("/pipelines", { params });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching pipeline list:", error.response?.data || error.message);
    return [];
  }
};

export const fetchPipelineDetail = async (invoiceId) => {
  try {
    const response = await api.get(`/pipelines/invoice/${invoiceId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching pipeline detail:", error.response?.data || error.message);
    return null;
  }
};

export const updatePipelineStage = async (invoiceId, payload) => {
  try {
    const response = await api.post(`/pipelines/invoice/${invoiceId}/status`, payload);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating pipeline stage:", error.response?.data || error.message);
    return null;
  }
};

export const addPipelineNote = async (invoiceId, payload) => {
  try {
    const response = await api.post(`/pipelines/invoice/${invoiceId}/note`, payload);
    return response.data;
  } catch (error) {
    console.error("❌ Error adding pipeline note:", error.response?.data || error.message);
    return null;
  }
};
