import express from 'express';
import { supabase } from '../services/supabaseClient.js';

const router = express.Router();

// Get Market Overview stats
router.get('/analytics/overview', async (req, res) => {
  try {
    // 1. Total monitored listings
    const { count: totalMonitored } = await supabase
      .from('monitoring_config')
      .select('*', { count: 'exact', head: true })
      .eq('monitoring_enabled', true);

    // 2. Active, Sold, Under Offer, Withdrawn counts
    // We get these from the properties table
    const { data: propertiesStatus } = await supabase
      .from('properties')
      .select('status');

    let activeCount = 0;
    let soldCount = 0;
    let underOfferCount = 0;
    let withdrawnCount = 0;

    if (propertiesStatus) {
      propertiesStatus.forEach(p => {
        const s = (p.status || '').toLowerCase();
        if (s.includes('active') || s.includes('current')) activeCount++;
        else if (s.includes('sold')) soldCount++;
        else if (s.includes('offer') || s.includes('contract')) underOfferCount++;
        else if (s.includes('withdraw') || s.includes('off')) withdrawnCount++;
      });
    }

    // 3. New listings, Price reductions, Price increases (from market_events in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentEvents } = await supabase
      .from('market_events')
      .select('event_type, metadata')
      .gte('created_at', thirtyDaysAgo.toISOString());

    let newListings = 0;
    let priceReductions = 0;
    let priceIncreases = 0;

    if (recentEvents) {
      recentEvents.forEach(e => {
        if (e.event_type === 'NEW_LISTING') newListings++;
        if (e.event_type === 'PRICE_CHANGED') {
          if (e.metadata?.trend === 'reduced') priceReductions++;
          if (e.metadata?.trend === 'increased') priceIncreases++;
        }
      });
    }

    res.json({
      total_monitored: totalMonitored || 0,
      active_listings: activeCount,
      sold_listings: soldCount,
      under_offer: underOfferCount,
      withdrawn: withdrawnCount,
      new_listings_30d: newListings,
      price_reductions_30d: priceReductions,
      price_increases_30d: priceIncreases
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Market Activity over time
router.get('/analytics/activity', async (req, res) => {
  try {
    const { range } = req.query; // '24h', '7d', '30d', '90d'
    
    let days = 30;
    if (range === '24h') days = 1;
    else if (range === '7d') days = 7;
    else if (range === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: events, error } = await supabase
      .from('market_events')
      .select('event_type, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group events by date (or hour if 24h)
    const grouped = {};
    events.forEach(e => {
      let key;
      const d = new Date(e.created_at);
      if (days === 1) {
        key = `${d.getHours()}:00`; // Group by hour
      } else {
        key = d.toISOString().split('T')[0]; // Group by date
      }
      
      if (!grouped[key]) {
        grouped[key] = { date: key, NEW_LISTING: 0, SOLD: 0, PRICE_CHANGED: 0, STATUS_CHANGED: 0, WITHDRAWN: 0 };
      }
      
      if (grouped[key][e.event_type] !== undefined) {
        grouped[key][e.event_type]++;
      }
    });

    res.json(Object.values(grouped));
  } catch (error) {
    console.error('Analytics activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
