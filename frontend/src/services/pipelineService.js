import api from "./api";

export const fetchPipelineSummary = async (userId, filters = {}) => {
  try {
    const params = { ...filters };
    if (userId) params.user_id = userId;
    const response = await api.get("/pipelines/summary", { params });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching pipeline summary:", error.response?.data || error.message);
    return [];
  }
};

export const fetchPipelineList = async (stage, userId, filters = {}) => {
  try {
    const params = { ...filters };
    if (stage) params.stage = stage;
    if (userId) params.user_id = userId;
    const response = await api.get("/pipelines", { params });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching pipeline list:", error.response?.data || error.message);
    return [];
  }
};

export const fetchPipelineDetail = async (invoiceId, userId) => {
  try {
    const params = userId ? { user_id: userId } : {};
    const response = await api.get(`/pipelines/invoice/${invoiceId}`, { params });
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

export const followPipeline = async (invoiceId, userId) => {
  try {
    const response = await api.post(`/pipelines/invoice/${invoiceId}/follow`, { user_id: userId });
    return response.data;
  } catch (error) {
    console.error("❌ Error following pipeline:", error.response?.data || error.message);
    return null;
  }
};

export const unfollowPipeline = async (invoiceId, userId) => {
  try {
    const response = await api.post(`/pipelines/invoice/${invoiceId}/unfollow`, { user_id: userId });
    return response.data;
  } catch (error) {
    console.error("❌ Error unfollowing pipeline:", error.response?.data || error.message);
    return null;
  }
};
