export class ApiNormalizer {
  /**
   * Normalizes a raw dictionary from the generic provider into a normalized object.
   */
  normalize(rawData, sourceName) {
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString();
    };

    return {
      external_listing_id: String(rawData.id || rawData.external_id || ''),
      address: rawData.address || null,
      suburb: rawData.suburb || rawData.city || null,
      state: rawData.state || rawData.province || null,
      postcode: rawData.postcode || rawData.zipcode || null,
      property_type: rawData.property_type || rawData.type || null,
      bedrooms: rawData.bedrooms || rawData.beds || null,
      bathrooms: rawData.bathrooms || rawData.baths || null,
      car_spaces: rawData.car_spaces || rawData.parking || null,
      price: rawData.price || null,
      status: rawData.status || null,
      listing_url: rawData.listing_url || rawData.url || null,
      agent: rawData.agent_name || rawData.agent || null,
      agency: rawData.agency_name || rawData.agency || null,
      images: rawData.images || [],
      listed_at: parseDate(rawData.listed_at || rawData.created_at),
      updated_at: parseDate(rawData.updated_at),
      sold_at: parseDate(rawData.sold_at),
      sold_price: rawData.sold_price || null,
      source: sourceName,
      fetched_at: new Date().toISOString()
    };
  }
}
