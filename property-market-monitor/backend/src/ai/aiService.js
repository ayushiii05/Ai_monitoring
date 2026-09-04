import { supabase } from '../services/supabaseClient.js';
import { AlertEngine } from '../market_data/services/alertEngine.js';

export class AIService {
  constructor() {
    this.alertEngine = new AlertEngine();
  }

  /**
   * Main entry point to generate insights.
   * In a real production system, this would gather data and send a prompt to OpenAI/Gemini.
   * Here, we simulate the LLM parsing real data by using deterministic logic on real DB facts.
   */
  async generateInsights() {
    console.log('[AIService] Gathering market data for analysis...');
    
    // 1. Fetch recent events (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentEvents, error } = await supabase
      .from('market_events')
      .select('*, properties(suburb_name)')
      .gte('detected_at', sevenDaysAgo.toISOString());

    if (error) {
      console.error('[AIService] Failed to fetch events:', error);
      throw error;
    }

    const insightsToInsert = [];

    if (!recentEvents || recentEvents.length === 0) {
      // If there are no events, generate a baseline "Stable Market" insight for demo purposes
      insightsToInsert.push({
        insight_type: 'MARKET_ACTIVITY',
        title: 'Market Stability Maintained',
        summary: 'No significant price fluctuations, new listings, or status changes have been detected in the last 7 days. The monitored property market is currently holding steady.',
        evidence: {
          fact: '0 market events were detected across all monitored properties in the past 7 days.',
          event_count: 0
        },
        confidence: 0.95,
        source_event_ids: [],
        model: 'mock-llm-1.0'
      });
    } else {
      // 2. Aggregate Data to pass to our "Model"
      const priceReductions = recentEvents.filter(e => e.event_type === 'PRICE_CHANGED' && e.metadata?.trend === 'reduced');
      const newListings = recentEvents.filter(e => e.event_type === 'NEW_LISTING');
      const soldListings = recentEvents.filter(e => e.event_type === 'SOLD');

      // Analyze Price Reductions
      if (priceReductions.length > 0) {
      const avgDrop = priceReductions.reduce((acc, e) => acc + Math.abs(e.metadata.change_percentage || 0), 0) / priceReductions.length;
      const eventIds = priceReductions.map(e => e.id);
      
      insightsToInsert.push({
        insight_type: 'MARKET_WARNING',
        title: 'Elevated Price Reductions',
        summary: `The market is showing signs of seller price sensitivity. A cluster of price reductions averaging a ${avgDrop.toFixed(1)}% drop suggests that original asking prices may be overvaluing current buyer demand.`,
        evidence: {
          fact: `${priceReductions.length} monitored listings reduced their asking price during the last 7 days.`,
          average_reduction_percentage: avgDrop.toFixed(1),
          event_count: priceReductions.length
        },
        confidence: 0.85,
        source_event_ids: eventIds,
        model: 'mock-llm-1.0'
      });
    }

    // Analyze Suburb Trends (grouping by suburb)
    const suburbCounts = {};
    for (const e of newListings) {
      const sub = e.properties?.suburb_name;
      if (sub) {
        suburbCounts[sub] = (suburbCounts[sub] || 0) + 1;
      }
    }

    for (const [suburb, count] of Object.entries(suburbCounts)) {
      if (count > 0) { // In a real scenario, this threshold might be higher
        const eventIds = newListings.filter(e => e.properties?.suburb_name === suburb).map(e => e.id);
        insightsToInsert.push({
          suburb: suburb,
          insight_type: 'SUBURB_TREND',
          title: `Rising Inventory in ${suburb}`,
          summary: `This sudden influx of properties could lead to increased competition among sellers, potentially driving median prices down in the short term. Buyers may have stronger negotiation power in this area.`,
          evidence: {
            fact: `${count} new listings appeared in ${suburb} in the last 7 days.`,
            new_listing_count: count
          },
          confidence: 0.92,
          source_event_ids: eventIds,
          model: 'mock-llm-1.0'
        });
      }
    }
    } // End of else block

    // Insert Insights into DB
    if (insightsToInsert.length > 0) {
      const { data: savedInsights, error: insertError } = await supabase.from('ai_insights').insert(insightsToInsert).select();
      if (insertError) {
        console.error('[AIService] Failed to save insights:', insertError);
        throw insertError;
      }
      
      // Pass insights to Alert Engine
      if (savedInsights && savedInsights.length > 0) {
        for (const insight of savedInsights) {
          await this.alertEngine.processInsight(insight);
        }
      }
    }

    return { 
      message: 'Analysis complete', 
      insightsGenerated: insightsToInsert.length 
    };
  }
}
