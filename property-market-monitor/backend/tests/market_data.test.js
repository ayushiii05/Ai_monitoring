import { jest } from '@jest/globals';
import axios from 'axios';
import { GenericApiProvider } from '../src/market_data/providers/GenericApiProvider.js';
import { ApiNormalizer } from '../src/market_data/normalizer/apiNormalizer.js';

describe('GenericApiProvider', () => {
  let provider;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    provider = new GenericApiProvider();
    jest.spyOn(provider.client, 'request');
  });

  it('should fetch a listing successfully', async () => {
    const mockData = { id: 'ext-123', price: 500000, status: 'active' };
    
    provider.client.request.mockResolvedValueOnce({ data: mockData });

    const result = await provider.getListing('ext-123');
    expect(result).toEqual(mockData);
    expect(provider.client.request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'GET',
      url: '/listings/ext-123'
    }));
  });

  it('should return null when a listing is not found (404)', async () => {
    const error = new Error('Not found');
    error.response = { status: 404 };
    
    provider.client.request.mockRejectedValueOnce(error);

    const result = await provider.getListing('ext-invalid');
    expect(result).toBeNull();
  });
});

describe('ApiNormalizer', () => {
  it('should normalize raw api data', () => {
    const normalizer = new ApiNormalizer();
    const rawData = {
      id: 'abc',
      address: '123 Test St',
      city: 'Testville',
      price: 850000,
      created_at: '2023-01-01T12:00:00.000Z'
    };

    const normalized = normalizer.normalize(rawData, 'TestProvider');
    
    expect(normalized.external_listing_id).toBe('abc');
    expect(normalized.address).toBe('123 Test St');
    expect(normalized.suburb).toBe('Testville');
    expect(normalized.price).toBe(850000);
    expect(normalized.source).toBe('TestProvider');
    expect(normalized.listed_at).toBe('2023-01-01T12:00:00.000Z');
  });
});
