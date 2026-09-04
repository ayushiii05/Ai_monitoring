import express from 'express';
import { supabase } from '../services/supabaseClient.js';
import { AIService } from '../ai/aiService.js';

const router = express.Router();
const aiService = new AIService();

// Manually trigger the AI analysis job
router.post('/ai/generate', async (req, res) => {
  try {
    const result = await aiService.generateInsights();
    res.json(result);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET Global AI Insights
router.get('/ai/insights', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET AI Insights for a specific property
router.get('/ai/listings/:listing_id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('listing_id', req.params.listing_id)
      .order('generated_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// GET AI Insights for a specific suburb
router.get('/ai/suburbs/:suburb/insights', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .ilike('suburb', `%${req.params.suburb}%`)
      .order('generated_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
