import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const listingsApi = {
  getListings: async (params) => {
    const response = await api.get('/listings', { params });
    return response.data;
  },
  getListing: async (id) => {
    const response = await api.get(`/listings/${id}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/listings/stats');
    return response.data;
  },
  getPriceHistory: async (id) => {
    const response = await api.get(`/listings/${id}/price-history`);
    return response.data;
  },
  getStatusHistory: async (id) => {
    const response = await api.get(`/listings/${id}/status-history`);
    return response.data;
  },
  getMonitoringConfig: async (id) => {
    const response = await api.get(`/listings/${id}/monitoring`);
    return response.data;
  },
  updateMonitoringConfig: async (id, payload) => {
    try {
      const response = await api.patch(`/listings/${id}/monitoring`, payload);
      return response.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // Doesn't exist yet, create it via POST
        const response = await api.post(`/listings/${id}/monitoring`, payload);
        return response.data;
      }
      throw err;
    }
  }
};

export const eventsApi = {
  getEvents: async (params) => {
    const response = await api.get('/events', { params });
    return response.data;
  }
};

export const monitoringApi = {
  getStatus: async () => {
    const response = await api.get('/monitoring/status');
    return response.data;
  },
  getConfig: async (id) => {
    const response = await api.get(`/listings/${id}/monitoring`);
    return response.data;
  }
};

export default api;
