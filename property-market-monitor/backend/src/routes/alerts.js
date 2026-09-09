import express from 'express';
import { supabase } from '../services/supabaseClient.js';
import { AlertEngine } from '../market_data/services/alertEngine.js';

const router = express.Router();
const alertEngine = new AlertEngine();

// GET all alerts
router.get('/alerts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('market_alerts')
      .select('*, properties(address, suburb_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data || data.length === 0) {
      const cached = alertEngine.getAlerts();
      return res.json(cached);
    }
    res.json(data);
  } catch (error) {
    const cached = alertEngine.getAlerts();
    res.json(cached);
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

    if (error || !data || data.length === 0) {
      const unreadData = alertEngine.getUnreadAlerts();
      return res.json(unreadData);
    }
    res.json({ count: count || 0, alerts: data });
  } catch (error) {
    const unreadData = alertEngine.getUnreadAlerts();
    res.json(unreadData);
  }
});

// Mark all alerts as read
router.patch('/alerts/read-all', async (req, res) => {
  try {
    const updated = alertEngine.markAllAsRead();
    try {
      await supabase
        .from('market_alerts')
        .update({
          notification_status: 'READ',
          read_at: new Date().toISOString()
        })
        .eq('notification_status', 'UNREAD');
    } catch (e) {}
    res.json({ success: true, count: updated.length });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Mark an alert as read
router.patch('/alerts/:id/read', async (req, res) => {
  try {
    const alertId = req.params.id;
    const updated = alertEngine.markAlertAsRead(alertId);

    try {
      await supabase
        .from('market_alerts')
        .update({ 
          notification_status: 'READ',
          read_at: new Date().toISOString()
        })
        .eq('id', alertId);
    } catch (dbErr) {}

    res.json(updated || { id: alertId, notification_status: 'READ' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
