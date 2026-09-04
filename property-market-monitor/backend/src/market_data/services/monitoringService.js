import { supabase } from '../../services/supabaseClient.js';
import { GenericApiProvider } from '../providers/GenericApiProvider.js';
import { ApiNormalizer } from '../normalizer/apiNormalizer.js';

export class MonitoringService {
  constructor() {
    this.provider = new GenericApiProvider();
    this.normalizer = new ApiNormalizer();
  }

  async testSyncListing(listingId) {
    // 1. Retrieve the listing from Supabase
    const { data: dbData, error: dbError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', listingId);

    if (dbError || !dbData || dbData.length === 0) {
      const err = new Error('Listing not found in database');
      err.status = 404;
      throw err;
    }

    const dbListing = dbData[0];

    // 2. Find external identifier
    const externalId = dbListing.external_listing_id ? String(dbListing.external_listing_id) : String(dbListing.id);

    // 3. Call the provider
    let rawApiData;
    try {
      rawApiData = await this.provider.getListing(externalId);
    } catch (e) {
      const err = new Error(`External API error: ${e.message}`);
      err.status = 502;
      throw err;
    }

    if (!rawApiData) {
      const err = new Error(`External listing ${externalId} not found at provider`);
      err.status = 404;
      throw err;
    }

    // 4. Normalize
    try {
      const normalizedListing = this.normalizer.normalize(rawApiData, 'GenericAPI');
      return normalizedListing;
    } catch (e) {
      const err = new Error(`Normalization error: ${e.message}`);
      err.status = 500;
      throw err;
    }
  }
}
