export class ChangeDetector {
  /**
   * Compares the latest fetched property data with the last known snapshot.
   * Returns an array of events detailing meaningful market changes.
   * 
   * @param {Object} currentSnapshot The most recent row from `listing_snapshots`
   * @param {Object} fetchedListing The normalized listing from the provider
   * @returns {Array} List of market event objects to be inserted
   */
  detect(currentSnapshot, fetchedListing) {
    const events = [];

    if (!currentSnapshot) {
      events.push({
        event_type: 'NEW_LISTING',
        old_value: null,
        new_value: fetchedListing.status || 'ACTIVE',
        metadata: { price: fetchedListing.price }
      });
      return events;
    }

    // 1. Check for PRICE_CHANGED
    const oldPrice = currentSnapshot.price ? parseFloat(currentSnapshot.price) : null;
    const newPrice = fetchedListing.price ? parseFloat(fetchedListing.price) : null;

    if (oldPrice !== newPrice && (oldPrice !== null || newPrice !== null)) {
      const changeAmount = oldPrice && newPrice ? newPrice - oldPrice : null;
      const changePercentage = oldPrice && newPrice ? ((newPrice - oldPrice) / oldPrice) * 100 : null;
      
      events.push({
        event_type: 'PRICE_CHANGED',
        old_value: oldPrice ? oldPrice.toString() : null,
        new_value: newPrice ? newPrice.toString() : null,
        metadata: {
          change_amount: changeAmount,
          change_percentage: changePercentage,
          trend: changeAmount < 0 ? 'reduced' : 'increased'
        }
      });
    }

    // 2. Check for Status Changes
    const oldStatus = currentSnapshot.status ? currentSnapshot.status.toUpperCase() : '';
    const newStatus = fetchedListing.status ? fetchedListing.status.toUpperCase() : '';

    if (oldStatus !== newStatus) {
      // General status change
      events.push({
        event_type: 'STATUS_CHANGED',
        old_value: oldStatus,
        new_value: newStatus,
        metadata: {}
      });

      // Derived specific events
      if (newStatus === 'SOLD') {
        events.push({
          event_type: 'SOLD',
          old_value: oldStatus,
          new_value: newStatus,
          metadata: { sold_price: fetchedListing.sold_price, sold_at: fetchedListing.sold_at }
        });
      } else if (newStatus === 'WITHDRAWN' || newStatus === 'OFF_MARKET') {
        events.push({
          event_type: 'WITHDRAWN',
          old_value: oldStatus,
          new_value: newStatus,
          metadata: {}
        });
      }
    }

    // 3. Check for LISTING_UPDATED (meaningful details)
    const oldData = currentSnapshot.property_data || {};
    const trackableFields = ['bedrooms', 'bathrooms', 'car_spaces', 'property_type', 'agent', 'agency', 'listing_url'];
    
    let hasDetailsChanged = false;
    const detailChanges = {};

    for (const field of trackableFields) {
      const oldVal = oldData[field] !== undefined && oldData[field] !== null ? String(oldData[field]).trim().toLowerCase() : '';
      const newVal = fetchedListing[field] !== undefined && fetchedListing[field] !== null ? String(fetchedListing[field]).trim().toLowerCase() : '';

      if (oldVal !== newVal) {
        hasDetailsChanged = true;
        detailChanges[field] = { old: oldData[field], new: fetchedListing[field] };
      }
    }

    if (hasDetailsChanged) {
      events.push({
        event_type: 'LISTING_UPDATED',
        old_value: null,
        new_value: null,
        metadata: { changes: detailChanges }
      });
    }

    return events;
  }
}
