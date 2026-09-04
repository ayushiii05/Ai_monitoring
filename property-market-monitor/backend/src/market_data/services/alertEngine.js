import { supabase } from '../../services/supabaseClient.js';

export class AlertEngine {
  constructor() {
    this.priceReductionThresholdPct = 5.0; // Trigger high severity alert if price drops by > 5%
    this.priceReductionThresholdAmount = 50000; // or if price drops by > $50k
  }

  /**
   * Process an array of newly detected market events to generate alerts.
   */
  async processEvents(events) {
    if (!events || events.length === 0) return;

    const alertsToCreate = [];

    for (const event of events) {
      const alert = this.evaluateEvent(event);
      if (alert) {
        alertsToCreate.push(alert);
      }
    }

    if (alertsToCreate.length > 0) {
      await this.saveAlerts(alertsToCreate);
    }
  }

  evaluateEvent(event) {
    const { event_type, listing_id, metadata, id: event_id } = event;

    // RULE 1: Price Reduction
    if (event_type === 'PRICE_CHANGED' && metadata?.trend === 'reduced') {
      const dropPct = Math.abs(metadata.change_percentage || 0);
      const dropAmount = Math.abs(metadata.change_amount || 0);
      
      if (dropPct >= this.priceReductionThresholdPct || dropAmount >= this.priceReductionThresholdAmount) {
        return {
          listing_id,
          event_id,
          alert_type: 'PRICE_REDUCTION',
          severity: 'HIGH',
          title: 'Major Price Reduction Detected',
          message: `The price dropped by $${dropAmount.toLocaleString()} (${dropPct.toFixed(1)}%).`,
          evidence: metadata
        };
      }
    }

    // RULE 2: Property Sold
    if (event_type === 'SOLD') {
      return {
        listing_id,
        event_id,
        alert_type: 'SOLD',
        severity: 'MEDIUM',
        title: 'Monitored Property Sold',
        message: 'A property you are monitoring has been marked as Sold.',
        evidence: metadata
      };
    }

    // RULE 3: New Listing
    if (event_type === 'NEW_LISTING') {
      return {
        listing_id,
        event_id,
        alert_type: 'NEW_LISTING',
        severity: 'LOW',
        title: 'New Listing Added',
        message: 'A new listing has appeared in your monitored area.',
        evidence: metadata
      };
    }

    return null;
  }

  /**
   * Process a single newly generated AI insight.
   */
  async processInsight(insight) {
    if (insight.insight_type === 'MARKET_WARNING') {
      const alert = {
        listing_id: insight.listing_id || null,
        event_id: null,
        alert_type: 'AI_INSIGHT',
        severity: 'CRITICAL',
        title: `AI Alert: ${insight.title}`,
        message: insight.summary,
        evidence: insight.evidence
      };
      await this.saveAlerts([alert]);
    }
  }

  async saveAlerts(alerts) {
    try {
      // Upsert logic relies on the UNIQUE constraint (event_id, alert_type) 
      // preventing duplicates from being inserted via ON CONFLICT DO NOTHING natively,
      // but since supabase-js handles upserts gracefully if we provide conflict columns.
      // Wait, we will just use .insert() and ignore duplicate errors for simplicity in this engine.
      for (const alert of alerts) {
        const { error } = await supabase.from('market_alerts').insert(alert);
        if (error && error.code !== '23505') { // Ignore unique violation
          console.error(`[AlertEngine] Failed to save alert: ${error.message}`);
        }
      }
    } catch (err) {
      console.error('[AlertEngine] Critical error saving alerts:', err);
    }
  }
}
