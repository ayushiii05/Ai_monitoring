import React, { useState, useEffect } from 'react';
import { fetchAIInsights, generateInsightsManual } from '../services/aiService';
import { Brain, Sparkles, Database, RefreshCw, AlertTriangle, ArrowUpRight } from 'lucide-react';

const AIInsightsList = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const data = await fetchAIInsights();
      setInsights(data || []);
    } catch (error) {
      console.error('Failed to load AI Insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateInsightsManual();
      await loadInsights(); // Reload after generation
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'MARKET_WARNING':
        return <AlertTriangle size={20} className="text-rose-500" />;
      case 'SUBURB_TREND':
        return <ArrowUpRight size={20} className="text-violet-500" />;
      default:
        return <Sparkles size={20} className="text-amber-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
      <div className="px-6 py-5 border-b border-gray-200 bg-slate-900 text-white flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Brain size={24} className="text-indigo-400" />
          <h3 className="text-lg leading-6 font-medium">AI Market Intelligence</h3>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-sm font-medium transition-colors"
        >
          <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
          <span>{generating ? 'Analyzing...' : 'Run AI Analysis'}</span>
        </button>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading Intelligence...</div>
        ) : insights.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Sparkles size={32} className="mx-auto mb-3 text-gray-300" />
            <p>No AI insights generated yet.</p>
            <p className="text-sm mt-1">Run the analysis engine to scan the latest market events.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {insights.map((insight) => (
              <div key={insight.id} className="border border-indigo-100 rounded-lg overflow-hidden">
                <div className="bg-indigo-50/50 px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getIcon(insight.insight_type)}
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                  </div>
                  <span className="text-xs font-medium text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full">
                    {Math.round(insight.confidence * 100)}% Confidence
                  </span>
                </div>
                
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* EVIDENCE (FACT) */}
                  <div className="bg-slate-50 border border-slate-200 rounded p-4 relative">
                    <span className="absolute -top-3 left-4 bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded tracking-wider flex items-center shadow-sm">
                      <Database size={10} className="mr-1" /> FACT
                    </span>
                    <p className="text-sm text-gray-800 mt-2 font-mono">
                      {insight.evidence?.fact || 'No specific evidence extracted.'}
                    </p>
                  </div>
                  
                  {/* SUMMARY (INTERPRETATION) */}
                  <div className="bg-amber-50 border border-amber-200 rounded p-4 relative">
                    <span className="absolute -top-3 left-4 bg-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded tracking-wider flex items-center shadow-sm">
                      <Sparkles size={10} className="mr-1" /> INTERPRETATION
                    </span>
                    <p className="text-sm text-gray-800 mt-2 leading-relaxed">
                      {insight.summary}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsList;
