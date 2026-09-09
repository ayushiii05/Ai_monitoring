import React, { useState, useEffect } from 'react';
import { listingsApi } from '../../services/api';
import { fetchAIInsights as fetchInsights, fetchSuburbIntelligence } from '../../services/aiService';
import { MapPin, TrendingUp, DollarSign, Activity } from 'lucide-react';

const SuburbIntelligence = () => {
  const [suburb, setSuburb] = useState('');
  const [suburbsList, setSuburbsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    // Fetch unique suburbs (simplified for MVP)
    const loadSuburbs = async () => {
      try {
        const res = await listingsApi.getListings({ limit: 1000 });
        const unique = [...new Set(res.data.map(p => p.suburb_name).filter(Boolean))];
        setSuburbsList(unique.sort());
      } catch (err) {}
    };
    loadSuburbs();
  }, []);

  const analyzeSuburb = async () => {
    if (!suburb) return;
    setLoading(true);
    try {
      // Fetch listings for suburb
      const { data: listings } = await listingsApi.getListings({ suburb, limit: 500 });
      
      // Calculate Stats
      let active = 0;
      let sold = 0;
      const prices = [];
      
      listings.forEach(l => {
        const s = (l.status || '').toLowerCase();
        const p = (l.price || '').toLowerCase();

        if (s.includes('sold') || p.includes('sold')) {
          sold++;
        } else if (s.includes('withdrawn') || s.includes('off market') || p.includes('withdrawn')) {
          // Withdrawn / off market
        } else {
          // Any currently monitored listing without a sold flag is an active listing
          active++;
        }

        if (l.price_numeric) prices.push(l.price_numeric);
      });

      const medianPrice = prices.length > 0 
        ? prices.sort((a,b) => a - b)[Math.floor(prices.length / 2)] 
        : null;

      setStats({
        total: listings.length,
        active,
        sold,
        medianPrice
      });

      // Fetch AI Insights for suburb
      const allInsights = await fetchInsights();
      let suburbInsights = allInsights.filter(i => 
        (i.suburb && i.suburb.toLowerCase() === suburb.toLowerCase()) || 
        (i.properties && i.properties.suburb_name?.toLowerCase() === suburb.toLowerCase())
      );

      if (suburbInsights.length === 0) {
        try {
          const direct = await fetchSuburbIntelligence(suburb);
          if (Array.isArray(direct) && direct.length > 0) {
            suburbInsights = direct;
          }
        } catch (e) {}
      }

      setInsights(suburbInsights);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeSuburb();
  }, [suburb]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <MapPin className="text-indigo-600 mr-2" size={24} />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Suburb Intelligence</h2>
            <p className="text-sm text-gray-500">Deep-dive into localized market metrics</p>
          </div>
        </div>
        
        <select 
          className="border border-gray-300 rounded-md shadow-sm py-2 px-4 w-full sm:w-64 focus:ring-indigo-500 focus:border-indigo-500"
          value={suburb}
          onChange={(e) => setSuburb(e.target.value)}
        >
          <option value="">-- Select a Suburb --</option>
          {suburbsList.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {!suburb ? (
        <div className="p-12 text-center text-gray-400">
          Select a suburb from the dropdown to view localized market intelligence.
        </div>
      ) : loading ? (
        <div className="p-12 text-center text-gray-400">Analyzing market data for {suburb}...</div>
      ) : (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
              <p className="text-sm font-medium text-indigo-600 mb-1">Total Tracked</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-sm font-medium text-blue-600 mb-1">Active Market</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.active || 0}</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-100">
              <p className="text-sm font-medium text-green-600 mb-1">Sold Activity</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.sold || 0}</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
              <p className="text-sm font-medium text-purple-600 mb-1">Median Price</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.medianPrice ? `$${stats.medianPrice.toLocaleString()}` : 'N/A'}
              </p>
            </div>
          </div>

          <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="mr-2" size={18} />
            AI Suburb Insights
          </h3>
          
          {insights.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No AI insights generated specifically for this suburb yet.</p>
          ) : (
            <div className="space-y-4">
              {insights.map(insight => (
                <div key={insight.id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-indigo-900">{insight.title}</h4>
                  </div>
                  <p className="text-sm text-gray-700">{insight.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuburbIntelligence;
