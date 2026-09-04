import express from 'express';
import { supabase } from '../services/supabaseClient.js';

const router = express.Router();

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

    res.json({
      data,
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
    res.json(data);
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

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ detail: error.message });
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
