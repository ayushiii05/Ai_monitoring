import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const fetchEvents = async (params = {}) => {
  const response = await axios.get(`${API_URL}/events`, { params });
  return response.data;
};

export const fetchEventById = async (id) => {
  const response = await axios.get(`${API_URL}/events/${id}`);
  return response.data;
};

export const fetchListingEvents = async (listingId) => {
  const response = await axios.get(`${API_URL}/listings/${listingId}/events`);
  return response.data;
};
