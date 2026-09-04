import express from 'express';
import { supabase } from '../services/supabaseClient.js';

const router = express.Router();

// GET all alerts
router.get('/alerts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('market_alerts')
      .select('*, properties(address, suburb_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET unread alerts count and list
router.get('/alerts/unread', async (req, res) => {
  try {
    const { data, error, count } = await supabase
      .from('market_alerts')
      .select('*, properties(address, suburb_name)', { count: 'exact' })
      .eq('notification_status', 'UNREAD')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ count: count || 0, alerts: data });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Mark an alert as read
router.patch('/alerts/:id/read', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('market_alerts')
      .update({ 
        notification_status: 'READ',
        read_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
