import express from 'express';
import { MonitoringService } from '../market_data/services/monitoringService.js';
import { MonitoringEngine } from '../market_data/engine.js';
import { supabase } from '../services/supabaseClient.js';

const router = express.Router();
const monitoringService = new MonitoringService();
const engine = new MonitoringEngine();

// Manual test sync from phase 3 (does not save to DB)
router.post('/monitoring/test-sync/:id', async (req, res) => {
  try {
    const listingId = req.params.id;
    const normalizedListing = await monitoringService.testSyncListing(listingId);
    res.json(normalizedListing);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ detail: error.message });
  }
});

// Phase 4: Get monitoring worker status
router.get('/monitoring/status', async (req, res) => {
  try {
    // Monitored listings count
    const { count: monitoredCount } = await supabase
      .from('monitoring_config')
      .select('*', { count: 'exact', head: true })
      .eq('monitoring_enabled', true);

    // Pending listings count
    const now = new Date().toISOString();
    const { count: pendingCount } = await supabase
      .from('monitoring_config')
      .select('*', { count: 'exact', head: true })
      .eq('monitoring_enabled', true)
      .lte('next_check_at', now);

    const { count: pendingNullCount } = await supabase
      .from('monitoring_config')
      .select('*', { count: 'exact', head: true })
      .eq('monitoring_enabled', true)
      .is('next_check_at', null);

    // Failed listings count
    const { count: failedCount } = await supabase
      .from('monitoring_config')
      .select('*', { count: 'exact', head: true })
      .eq('monitoring_enabled', true)
      .eq('last_sync_status', 'error');

    // Next scheduled run
    const { data: nextScheduled } = await supabase
      .from('monitoring_config')
      .select('next_check_at')
      .eq('monitoring_enabled', true)
      .order('next_check_at', { ascending: true })
      .limit(1);

    res.json({
      worker_status: 'running', // assuming active if this endpoint responds
      listings_monitored: monitoredCount || 0,
      listings_pending: (pendingCount || 0) + (pendingNullCount || 0),
      listings_failed: failedCount || 0,
      next_scheduled_run: nextScheduled && nextScheduled.length > 0 ? nextScheduled[0].next_check_at : null
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Phase 4: Manual actual run (saves to DB)
router.post('/monitoring/run/:id', async (req, res) => {
  try {
    const listingId = req.params.id;
    
    // Get current config to retrieve frequency
    const { data: config } = await supabase
      .from('monitoring_config')
      .select('monitoring_frequency')
      .eq('listing_id', listingId)
      .single();

    const frequency = config ? config.monitoring_frequency : 'daily';
    
    // Run the actual pipeline for this listing
    const result = await engine.processListing(listingId, frequency);
    
    if (result.status === 'error') {
      return res.status(500).json({ detail: result.errorMessage });
    }
    
    res.json({ status: 'success', message: 'Listing synced manually successfully.' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
