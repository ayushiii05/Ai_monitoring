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

    let { data, count, error } = await query;
    if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache'))) {
      // Fallback to existing 'events' table
      let fallbackQuery = supabase
        .from('events')
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

      if (req.query.event_type) fallbackQuery = fallbackQuery.eq('event_type', req.query.event_type);
      if (req.query.start_date) fallbackQuery = fallbackQuery.gte('detected_at', req.query.start_date);
      if (req.query.end_date) fallbackQuery = fallbackQuery.lte('detected_at', req.query.end_date);

      fallbackQuery = fallbackQuery.range(offset, offset + limit - 1).order('detected_at', { ascending: false });

      const fallbackRes = await fallbackQuery;
      data = fallbackRes.data || [];
      count = fallbackRes.count || 0;
      error = fallbackRes.error;
    }

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return res.json({ data: [], total: 0, page, limit });
      }
      throw error;
    }

    res.json({
      data: data || [],
      total: count || 0,
      page,
      limit
    });
  } catch (error) {
    if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
      return res.json({ data: [], total: 0, page: 1, limit: 20 });
    }
    res.status(500).json({ detail: error.message });
  }
});

router.get('/events/:id', async (req, res) => {
  try {
    let { data, error } = await supabase
      .from('market_events')
      .select('*, properties(*)')
      .eq('id', req.params.id)
      .single();

    if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache'))) {
      const fallback = await supabase
        .from('events')
        .select('*, properties(*)')
        .eq('id', req.params.id)
        .single();
      data = fallback.data;
      error = fallback.error;
    }

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
    let { data, error } = await supabase
      .from('market_events')
      .select('*')
      .eq('listing_id', req.params.id)
      .order('detected_at', { ascending: false });

    if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache'))) {
      const fallback = await supabase
        .from('events')
        .select('*')
        .eq('property_id', req.params.id)
        .order('detected_at', { ascending: false });
      data = fallback.data || [];
      error = fallback.error;
    }

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return res.json([]);
      }
      throw error;
    }
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
