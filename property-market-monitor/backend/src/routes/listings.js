import express from 'express';
import { supabase } from '../services/supabaseClient.js';

const router = express.Router();

// Helper to fetch any properties marked as SOLD in the events table
async function getSoldPropertyIds() {
  try {
    const { data } = await supabase
      .from('events')
      .select('property_id')
      .eq('event_type', 'SOLD');
    return new Set((data || []).map(e => e.property_id));
  } catch (err) {
    return new Set();
  }
}

// Derive a reliable status for a property
function resolvePropertyStatus(property, soldPropertyIds = new Set()) {
  if (property.status) return property.status;
  const priceStr = (property.price || '').toLowerCase();
  if (soldPropertyIds.has(property.id) || priceStr.includes('sold')) {
    return 'sold';
  }
  if (priceStr.includes('under offer') || priceStr.includes('contract')) {
    return 'under offer';
  }
  if (priceStr.includes('withdrawn') || priceStr.includes('off market')) {
    return 'withdrawn';
  }
  return 'active';
}

router.get('/listings', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    let query = supabase.from('properties').select('*, property_images(url)', { count: 'exact' });

    if (req.query.suburb) query = query.ilike('suburb_name', `%${req.query.suburb}%`);
    if (req.query.state) query = query.ilike('state_code', `%${req.query.state}%`);
    if (req.query.postcode) query = query.eq('postcode', req.query.postcode);
    if (req.query.property_type) query = query.ilike('property_type', `%${req.query.property_type}%`);
    if (req.query.min_price) query = query.gte('price_numeric', req.query.min_price);
    if (req.query.max_price) query = query.lte('price_numeric', req.query.max_price);
    if (req.query.bedrooms) query = query.gte('bedrooms', req.query.bedrooms);
    if (req.query.bathrooms) query = query.gte('bathrooms', req.query.bathrooms);

    query = query.range(offset, offset + limit - 1).order('id', { ascending: false });

    const { data, count, error } = await query;

    if (error) throw error;

    const soldIds = await getSoldPropertyIds();
    const enrichedData = (data || []).map(p => ({
      ...p,
      status: resolvePropertyStatus(p, soldIds)
    }));

    res.json({
      data: enrichedData,
      total: count || 0,
      page,
      limit
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get('/listings/stats', async (req, res) => {
  try {
    const { count, error } = await supabase.from('properties').select('id', { count: 'exact', head: true });
    if (error) throw error;
    res.json({ total_listings: count || 0 });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get('/listings/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*, property_images(url, is_primary, order_index)')
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ detail: 'Listing not found' });
      throw error;
    }
    const soldIds = await getSoldPropertyIds();
    res.json({
      ...data,
      status: resolvePropertyStatus(data, soldIds)
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get('/listings/:id/history', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('listing_snapshots')
      .select('*')
      .eq('listing_id', req.params.id)
      .order('captured_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get('/listings/:id/price-history', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('listing_price_history')
      .select('*')
      .eq('listing_id', req.params.id)
      .order('detected_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get('/listings/:id/status-history', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('listing_status_history')
      .select('*')
      .eq('listing_id', req.params.id)
      .order('detected_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return res.json(data);
    }

    // Fallback to events table for this property
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('property_id', req.params.id)
      .order('detected_at', { ascending: false });

    const statusHistory = (eventData || []).map(e => ({
      id: e.id,
      listing_id: e.property_id,
      old_status: e.payload?.old_status || (e.event_type === 'NEW_LISTING' ? 'None' : 'Active'),
      new_status: e.payload?.new_status || (e.event_type === 'SOLD' ? 'Sold' : 'Active'),
      detected_at: e.detected_at
    }));

    res.json(statusHistory);
  } catch (error) {
    res.json([]);
  }
});

router.get('/listings/:id/monitoring', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('monitoring_config')
      .select('*')
      .eq('listing_id', req.params.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.json(data || null);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.post('/listings/:id/monitoring', async (req, res) => {
  try {
    const payload = {
      listing_id: req.params.id,
      monitoring_enabled: req.body.monitoring_enabled !== undefined ? req.body.monitoring_enabled : true,
      monitoring_frequency: req.body.monitoring_frequency || 'daily'
    };

    const { data, error } = await supabase
      .from('monitoring_config')
      .upsert(payload, { onConflict: 'listing_id' })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.patch('/listings/:id/monitoring', async (req, res) => {
  try {
    const payload = {};
    if (req.body.monitoring_enabled !== undefined) payload.monitoring_enabled = req.body.monitoring_enabled;
    if (req.body.monitoring_frequency !== undefined) payload.monitoring_frequency = req.body.monitoring_frequency;

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ detail: 'No valid fields provided' });
    }

    const { data, error } = await supabase
      .from('monitoring_config')
      .update(payload)
      .eq('listing_id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ detail: 'Monitoring config not found' });
      throw error;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
