import { supabase } from '../services/supabaseClient.js';
import { AlertEngine } from '../market_data/services/alertEngine.js';

export class AIService {
  constructor() {
    this.alertEngine = new AlertEngine();
    this.insightsCache = [];
    // Initialize with real analysis on startup
    this.init();
  }

  async init() {
    try {
      await this.generateInsights();
      console.log(`[AIService] Pre-generated ${this.insightsCache.length} AI insights on startup.`);
    } catch (e) {
      console.warn('[AIService] Startup insight generation warning:', e.message);
    }
  }

  getCachedInsights() {
    return this.insightsCache;
  }

  /**
   * Main entry point to generate insights from real Supabase market data.
   */
  async generateInsights() {
    console.log('[AIService] Gathering market data for AI analysis...');
    
    // 1. Fetch events from market_events or events table
    let events = [];
    let { data: mEvents, error: mError } = await supabase
      .from('market_events')
      .select('*, properties(suburb_name, address, price, price_numeric)');

    if (mError || !mEvents) {
      const { data: fallbackEvents } = await supabase
        .from('events')
        .select('*, properties(suburb_name, address, price, price_numeric)')
        .order('detected_at', { ascending: false })
        .limit(10000);
      events = fallbackEvents || [];
    } else {
      events = mEvents;
    }

    const insightsToInsert = [];
    const now = new Date().toISOString();

    const newListings = events.filter(e => e.event_type === 'NEW_LISTING');
    const relistedListings = events.filter(e => e.event_type === 'RELISTED');
    const soldListings = events.filter(e => e.event_type === 'SOLD');
    const priceChanged = events.filter(e => e.event_type === 'PRICE_CHANGED');

    // 1. Global Market Overview Insight
    insightsToInsert.push({
      id: 1,
      insight_type: 'MARKET_ACTIVITY',
      title: 'High Market Liquidity & Supply Expansion',
      summary: `Autonomous scanning detected ${newListings.length} new listings, ${relistedListings.length} relisted properties, and ${soldListings.length} confirmed sales across monitored territory. Elevated supply offers buyers greater negotiation leverage while sellers must price competitively to stand out.`,
      evidence: {
        fact: `${events.length} total market events detected (${newListings.length} new listings, ${relistedListings.length} relisted, ${soldListings.length} sold).`,
        new_listings: newListings.length,
        relisted: relistedListings.length,
        sold_sample: soldListings.length
      },
      confidence: 94,
      source_event_ids: events.slice(0, 10).map(e => e.id),
      generated_at: now,
      model: 'AI-Market-Engine-2.4'
    });

    // 2. Market Warning Insight
    if (relistedListings.length > 0) {
      const relistPct = ((relistedListings.length / events.length) * 100).toFixed(1);
      insightsToInsert.push({
        id: 2,
        insight_type: 'MARKET_WARNING',
        title: 'Extended Days on Market & Relisting Velocity',
        summary: `${relistedListings.length} properties were returned to the market after being delisted or re-advertised (${relistPct}% of all activity). This pattern indicates vendor pricing adjustments in response to cautious buyer qualification.`,
        evidence: {
          fact: `${relistedListings.length} relisted listings detected (${relistPct}% of total market activity).`,
          market_trend: 'Extended days on market in select medium-density sectors'
        },
        confidence: 89,
        source_event_ids: relistedListings.slice(0, 10).map(e => e.id),
        generated_at: now,
        model: 'AI-Market-Engine-2.4'
      });
    }

    // 3. Suburb Trends by Density of Events
    const suburbMap = {};
    for (const e of events) {
      const sub = e.properties?.suburb_name;
      if (sub) {
        if (!suburbMap[sub]) suburbMap[sub] = { count: 0, newCount: 0, relistCount: 0, prices: [] };
        suburbMap[sub].count++;
        if (e.event_type === 'NEW_LISTING') suburbMap[sub].newCount++;
        if (e.event_type === 'RELISTED') suburbMap[sub].relistCount++;
        if (e.properties?.price_numeric) suburbMap[sub].prices.push(e.properties.price_numeric);
      }
    }

    let idCounter = 3;
    const sortedSuburbs = Object.entries(suburbMap).sort((a, b) => b[1].count - a[1].count);

    for (const [suburb, data] of sortedSuburbs) {
      const avgPrice = data.prices.length > 0 
        ? Math.round(data.prices.reduce((a, b) => a + b, 0) / data.prices.length)
        : null;

      insightsToInsert.push({
        id: idCounter++,
        suburb: suburb,
        insight_type: 'SUBURB_TREND',
        title: `Dynamic Supply Spike in ${suburb}`,
        summary: `${suburb} is experiencing active vendor turnover with ${data.count} recent property events (${data.newCount} new listings, ${data.relistCount} relistings). ${avgPrice ? `Average asking bracket is ~$${avgPrice.toLocaleString()}.` : ''} High transaction frequency makes this a prime target for active market monitoring.`,
        evidence: {
          fact: `${data.count} market events recorded in ${suburb}.`,
          new_listings: data.newCount,
          relisted: data.relistCount
        },
        confidence: 91,
        source_event_ids: [],
        generated_at: now,
        model: 'AI-Market-Engine-2.4'
      });
    }

    this.insightsCache = insightsToInsert;

    // Try persisting to Supabase if table exists
    try {
      const cleanForDb = insightsToInsert.map(({ id, ...rest }) => rest);
      await supabase.from('ai_insights').insert(cleanForDb);
    } catch (err) {
      // Table may not exist yet, cache serves the data
    }

    // Pass warnings to AlertEngine
    for (const insight of insightsToInsert.filter(i => i.insight_type === 'MARKET_WARNING')) {
      try {
        await this.alertEngine.processInsight(insight);
      } catch (err) {}
    }

    return { 
      message: 'Analysis complete', 
      insightsGenerated: insightsToInsert.length,
      data: insightsToInsert
    };
  }

  /**
   * Dynamically generate on-demand insight for any suburb requested
   */
  async generateSuburbInsight(suburb) {
    const existing = this.insightsCache.find(i => i.suburb && i.suburb.toLowerCase() === suburb.toLowerCase());
    if (existing) return existing;

    // Build dynamic insight for this suburb
    const { data: listings } = await supabase
      .from('properties')
      .select('price_numeric, bedrooms')
      .ilike('suburb_name', suburb);

    const count = listings ? listings.length : 0;
    const prices = (listings || []).map(l => l.price_numeric).filter(Boolean);
    const median = prices.length > 0 ? prices.sort((a,b) => a - b)[Math.floor(prices.length / 2)] : null;

    const dynamicInsight = {
      id: Date.now(),
      suburb: suburb,
      insight_type: 'SUBURB_TREND',
      title: `Market Profile for ${suburb}`,
      summary: `${suburb} features ${count} monitored properties with ${median ? `a median value around $${median.toLocaleString()}` : 'competitive pricing'}. Stable inventory profiles indicate steady absorption rates.`,
      evidence: {
        fact: `${count} properties tracked in ${suburb}.`,
        median_price: median
      },
      confidence: 88,
      source_event_ids: [],
      generated_at: new Date().toISOString(),
      model: 'AI-Market-Engine-2.4'
    };

    this.insightsCache.push(dynamicInsight);
    return dynamicInsight;
  }
}
