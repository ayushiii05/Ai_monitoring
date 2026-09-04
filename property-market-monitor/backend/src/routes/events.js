import express from 'express';
import { supabase } from '../services/supabaseClient.js';

const router = express.Router();

router.get('/events', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('market_events')
      .select(`
        *,
        properties (
          address,
          suburb_name,
          state_code,
          property_type,
          price_numeric
        )
      `, { count: 'exact' });

    if (req.query.event_type) query = query.eq('event_type', req.query.event_type);
    if (req.query.suburb) query = query.ilike('properties.suburb_name', `%${req.query.suburb}%`);
    if (req.query.property_type) query = query.ilike('properties.property_type', `%${req.query.property_type}%`);
    
    if (req.query.start_date) query = query.gte('detected_at', req.query.start_date);
    if (req.query.end_date) query = query.lte('detected_at', req.query.end_date);

    query = query.range(offset, offset + limit - 1).order('detected_at', { ascending: false });

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

router.get('/events/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('market_events')
      .select('*, properties(*)')
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ detail: 'Event not found' });
      throw error;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get('/listings/:id/events', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('market_events')
      .select('*')
      .eq('listing_id', req.params.id)
      .order('detected_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
