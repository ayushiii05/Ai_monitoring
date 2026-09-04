import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const fetchAIInsights = async () => {
  const response = await axios.get(`${API_URL}/ai/insights`);
  return response.data;
};

export const fetchPropertyIntelligence = async (listingId) => {
  const response = await axios.get(`${API_URL}/ai/listings/${listingId}`);
  return response.data;
};

export const fetchSuburbIntelligence = async (suburb) => {
  const response = await axios.get(`${API_URL}/ai/suburbs/${suburb}/insights`);
  return response.data;
};

export const generateInsightsManual = async () => {
  const response = await axios.post(`${API_URL}/ai/generate`);
  return response.data;
};
