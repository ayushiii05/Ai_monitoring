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
    console.error('[AI Route] Generate error:', error);
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

    if (error || !data || data.length === 0) {
      // Fallback to active AIService cache
      const cached = aiService.getCachedInsights();
      return res.json(cached);
    }
    res.json(data);
  } catch (error) {
    const cached = aiService.getCachedInsights();
    res.json(cached);
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

    if (error || !data || data.length === 0) {
      const cached = aiService.getCachedInsights().filter(i => String(i.listing_id) === String(req.params.listing_id));
      return res.json(cached);
    }
    res.json(data);
  } catch (error) {
    res.json([]);
  }
});

// GET AI Insights for a specific suburb
router.get('/ai/suburbs/:suburb/insights', async (req, res) => {
  try {
    const suburbName = req.params.suburb;
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .ilike('suburb', `%${suburbName}%`)
      .order('generated_at', { ascending: false });

    if (error || !data || data.length === 0) {
      const cached = aiService.getCachedInsights().filter(
        i => i.suburb && i.suburb.toLowerCase() === suburbName.toLowerCase()
      );
      if (cached.length > 0) {
        return res.json(cached);
      }
      // Generate on-the-fly for this suburb
      const dynamic = await aiService.generateSuburbInsight(suburbName);
      return res.json(dynamic ? [dynamic] : []);
    }
    res.json(data);
  } catch (error) {
    const dynamic = await aiService.generateSuburbInsight(req.params.suburb);
    res.json(dynamic ? [dynamic] : []);
  }
});

export default router;
