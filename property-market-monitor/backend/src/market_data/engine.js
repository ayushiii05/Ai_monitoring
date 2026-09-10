import cron from 'node-cron';
import { supabase } from '../services/supabaseClient.js';
import { GenericApiProvider } from './providers/GenericApiProvider.js';
import { ApiNormalizer } from './normalizer/apiNormalizer.js';
import { ChangeDetector } from './services/changeDetector.js';
import { AlertEngine } from './services/alertEngine.js';
import { monitoringConfigStore } from '../services/monitoringConfigStore.js';

export class MonitoringEngine {
  constructor() {
    this.provider = new GenericApiProvider();
    this.normalizer = new ApiNormalizer();
    this.changeDetector = new ChangeDetector();
    this.alertEngine = new AlertEngine();
    this.isRunning = false;
    
    // Frequency to milliseconds mapping
    this.frequencyMs = {
      '15 minutes': 15 * 60 * 1000,
      '30 minutes': 30 * 60 * 1000,
      '1 hour': 60 * 60 * 1000,
      '6 hours': 6 * 60 * 60 * 1000,
      '24 hours': 24 * 60 * 60 * 1000,
      'daily': 24 * 60 * 60 * 1000 // default fallback
    };
  }

  start() {
    console.log('[MonitoringEngine] Engine initialized. Scheduling job to run every minute.');
    cron.schedule('* * * * *', async () => {
      if (this.isRunning) {
        console.log('[MonitoringEngine] Previous cycle still running. Skipping this tick.');
        return;
      }
      this.isRunning = true;
      try {
        await this.runCycle();
      } catch (err) {
        console.error('[MonitoringEngine] Critical error in run cycle:', err);
      } finally {
        this.isRunning = false;
      }
    });
  }

  async runCycle() {
    const now = new Date().toISOString();

    let allConfigs = [];
    try {
      const { data: configs, error } = await supabase
        .from('monitoring_config')
        .select('listing_id, monitoring_frequency')
        .eq('monitoring_enabled', true)
        .lte('next_check_at', now);

      if (!error && configs) {
        const { data: nullConfigs } = await supabase
          .from('monitoring_config')
          .select('listing_id, monitoring_frequency')
          .eq('monitoring_enabled', true)
          .is('next_check_at', null);

        allConfigs = [...configs, ...(nullConfigs || [])];
      } else {
        allConfigs = monitoringConfigStore.getDueConfigs(now);
      }
    } catch (e) {
      allConfigs = monitoringConfigStore.getDueConfigs(now);
    }
    const uniqueListingIds = [...new Set(allConfigs.map(c => c.listing_id))];

    console.log(`[MonitoringEngine] Found ${uniqueListingIds.length} listings due for check.`);

    // Process sequentially (or in batches) to respect rate limits
    for (const config of allConfigs) {
      if (uniqueListingIds.includes(config.listing_id)) {
        await this.processListing(config.listing_id, config.monitoring_frequency);
        // Remove from set to prevent double processing
        uniqueListingIds.splice(uniqueListingIds.indexOf(config.listing_id), 1);
      }
    }
    
    console.log('[MonitoringEngine] Cycle completed.');
  }

  calculateNextCheckAt(frequencyString) {
    const ms = this.frequencyMs[frequencyString] || this.frequencyMs['daily'];
    return new Date(Date.now() + ms).toISOString();
  }

  async processListing(listingId, frequency = 'daily') {
    const startTime = new Date().toISOString();
    let status = 'success';
    let errorMessage = null;

    console.log(`[MonitoringEngine] Processing listing ${listingId}...`);
    try {
      // 1. Get properties DB record
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', listingId);

      if (propError || !properties || properties.length === 0) {
        throw new Error('Listing not found in database');
      }
      
      const dbListing = properties[0];
      const externalId = dbListing.external_listing_id ? String(dbListing.external_listing_id) : String(dbListing.id);

      // 2. Fetch external API
      const rawApiData = await this.provider.getListing(externalId);
      if (!rawApiData) {
        throw new Error(`External listing ${externalId} not found at provider`);
      }

      // 3. Normalize
      const normalizedListing = this.normalizer.normalize(rawApiData, 'GenericAPI');

      // 4. Get last snapshot
      const { data: snapshots, error: snapError } = await supabase
        .from('listing_snapshots')
        .select('*')
        .eq('listing_id', listingId)
        .order('captured_at', { ascending: false })
        .limit(1);

      if (snapError) throw snapError;
      
      const currentSnapshot = snapshots && snapshots.length > 0 ? snapshots[0] : null;

      // 5. Detect changes
      const events = this.changeDetector.detect(currentSnapshot, normalizedListing);

      // 6. Save new snapshot if there are changes or it's the first time
      const snapshotPayload = {
        listing_id: listingId,
        price: String(normalizedListing.price),
        status: normalizedListing.status,
        property_data: normalizedListing,
        source: 'GenericAPI'
      };
      
      await supabase.from('listing_snapshots').insert(snapshotPayload);

      // 7. Save market events
      let priceChange = null;
      let statusChange = null;

      if (events && events.length > 0) {
        const generatedEvents = [];
        for (const event of events) {
          const { data: savedEvent, error: insertError } = await supabase.from('market_events').insert({
            listing_id: listingId,
            event_type: event.event_type,
            old_value: event.old_value,
            new_value: event.new_value,
            metadata: event.metadata,
            source: 'GenericAPI'
          }).select().single();

          if (!insertError && savedEvent) {
            generatedEvents.push(savedEvent);
          }

          // Track specific changes to update the parent table
          if (event.event_type === 'PRICE_CHANGED') {
            priceChange = true;
          }
          if (event.event_type === 'STATUS_CHANGED' || event.event_type === 'SOLD' || event.event_type === 'WITHDRAWN') {
            statusChange = true;
          }
        }
        
        // Pass events to Alert Engine
        if (generatedEvents.length > 0) {
          await this.alertEngine.processEvents(generatedEvents);
        }
      }
      
      // Update properties table price and status for frontend visibility
      if (priceChange || statusChange) {
        await supabase.from('properties').update({
           price_numeric: normalizedListing.price,
           status: normalizedListing.status
        }).eq('id', listingId);
      }

    } catch (error) {
      status = 'error';
      errorMessage = error.message;
      console.error(`[MonitoringEngine] Error processing listing ${listingId}:`, error);
    }

    const endTime = new Date().toISOString();

    // 8. Update monitoring_config
    const nextCheckAt = this.calculateNextCheckAt(frequency);
    await supabase.from('monitoring_config').update({
      last_checked_at: endTime,
      next_check_at: nextCheckAt,
      last_sync_status: status,
      last_sync_error: errorMessage,
      updated_at: endTime
    }).eq('listing_id', listingId);

    // 9. Save sync_log
    await supabase.from('sync_logs').insert({
      listing_id: listingId,
      provider: 'GenericAPI',
      started_at: startTime,
      completed_at: endTime,
      status: status,
      error_message: errorMessage
    });
    
    return { status, errorMessage };
  }
}
