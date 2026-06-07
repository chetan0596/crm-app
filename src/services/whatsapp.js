import api from "../api";

export const whatsappApi = {
  // Settings
  getSettings: () => api.get("/whatsapp/settings"),
  saveSettings: (data) => api.post("/whatsapp/settings", data),
  testConnection: () => api.post("/whatsapp/test-connection"),

  // Templates
  getTemplates: () => api.get("/whatsapp/templates"),

  // Send messages
  sendMessage: (payload) => api.post("/whatsapp/send", payload),
  sendToLead: (leadId, payload) => api.post(`/whatsapp/send/lead/${leadId}`, payload),
  sendToCustomer: (customerId, payload) => api.post(`/whatsapp/send/customer/${customerId}`, payload),

  // Message history
  getMessages: (params) => api.get("/whatsapp/messages", { params }),
  getLeadMessages: (leadId) => api.get(`/whatsapp/messages/lead/${leadId}`),

  // Webhook status
  getWebhookStatus: () => api.get("/whatsapp/webhook-status"),
};
