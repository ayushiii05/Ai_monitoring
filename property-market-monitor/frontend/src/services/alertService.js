import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const fetchAlerts = async () => {
  const response = await axios.get(`${API_URL}/alerts`);
  return response.data;
};

export const fetchUnreadAlerts = async () => {
  const response = await axios.get(`${API_URL}/alerts/unread`);
  return response.data;
};

export const markAlertAsRead = async (id) => {
  const response = await axios.patch(`${API_URL}/alerts/${id}/read`);
  return response.data;
};
