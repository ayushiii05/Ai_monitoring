import axios from 'axios';
import axiosRetry from 'axios-retry';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' }); // Load .env from root

export class GenericApiProvider {
  constructor() {
    this.baseUrl = process.env.PROPERTY_API_BASE_URL || 'https://api.example.com';
    this.apiKey = process.env.PROPERTY_API_KEY || '';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Configure retries with exponential backoff
    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status >= 500;
      }
    });
  }

  async makeRequest(method, endpoint, config = {}) {
    try {
      const response = await this.client.request({
        method,
        url: endpoint,
        ...config
      });
      return response.data;
    } catch (error) {
      console.error(`[GenericApiProvider] Error fetching ${endpoint}:`, error.message);
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getListing(externalId) {
    return await this.makeRequest('GET', `/listings/${externalId}`);
  }

  async getListingStatus(externalId) {
    const data = await this.getListing(externalId);
    return data ? data.status : null;
  }

  async getListingPrice(externalId) {
    const data = await this.getListing(externalId);
    return data ? data.price : null;
  }

  async getListings(criteria) {
    const response = await this.makeRequest('GET', '/listings', { params: criteria });
    return response.results || [];
  }
}
