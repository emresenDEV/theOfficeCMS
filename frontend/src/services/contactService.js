import api from "./api";

export const fetchContacts = async (params = {}) => {
  try {
    const response = await api.get("/contacts", { params });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching contacts:", error.response?.data || error.message);
    return [];
  }
};

export const fetchContactById = async (contactId, userId) => {
  try {
    const response = await api.get(`/contacts/${contactId}`, {
      params: userId ? { user_id: userId } : {},
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching contact:", error.response?.data || error.message);
    return null;
  }
};

export const createContact = async (payload) => {
  try {
    const response = await api.post("/contacts", payload);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating contact:", error.response?.data || error.message);
    throw error;
  }
};

export const updateContact = async (contactId, payload) => {
  try {
    const response = await api.put(`/contacts/${contactId}`, payload);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating contact:", error.response?.data || error.message);
    return null;
  }
};

export const updateContactAccounts = async (contactId, payload) => {
  try {
    const response = await api.put(`/contacts/${contactId}/accounts`, payload);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating contact accounts:", error.response?.data || error.message);
    return null;
  }
};

export const followContact = async (contactId, userId) => {
  try {
    const response = await api.post(`/contacts/${contactId}/follow`, { user_id: userId });
    return response.data;
  } catch (error) {
    console.error("❌ Error following contact:", error.response?.data || error.message);
    return null;
  }
};

export const unfollowContact = async (contactId, userId) => {
  try {
    const response = await api.post(`/contacts/${contactId}/unfollow`, { user_id: userId });
    return response.data;
  } catch (error) {
    console.error("❌ Error unfollowing contact:", error.response?.data || error.message);
    return null;
  }
};

export const createContactInteraction = async (contactId, payload) => {
  try {
    const response = await api.post(`/contacts/${contactId}/interactions`, payload);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating interaction:", error.response?.data || error.message);
    return null;
  }
};

export const backfillContacts = async (payload = {}) => {
  try {
    const response = await api.post("/contacts/backfill", payload);
    return response.data;
  } catch (error) {
    console.error("❌ Error backfilling contacts:", error.response?.data || error.message);
    return null;
  }
};
