import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const analyticsApi = {
  getOverview: async () => {
    const response = await axios.get(`${API_URL}/analytics/overview`);
    return response.data;
  },
  
  getActivity: async (range = '30d') => {
    const response = await axios.get(`${API_URL}/analytics/activity?range=${range}`);
    return response.data;
  }
};
