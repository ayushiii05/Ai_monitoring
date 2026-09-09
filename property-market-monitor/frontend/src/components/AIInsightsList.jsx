import React, { useState, useEffect } from 'react';
import { fetchAIInsights, generateInsightsManual } from '../services/aiService';
import { Brain, Sparkles, Database, RefreshCw, AlertTriangle, ArrowUpRight, Search, MapPin, ChevronLeft, ChevronRight, Activity, Filter } from 'lucide-react';

const AIInsightsList = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL' | 'WARNING' | 'ACTIVITY' | 'SUBURB'
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

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
      await loadInsights();
      setPage(1);
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

  const getTypeBadge = (type) => {
    switch (type) {
      case 'MARKET_WARNING':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'SUBURB_TREND':
        return 'bg-violet-100 text-violet-800 border-violet-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  // Filter insights based on category and search query
  const filteredInsights = insights.filter(insight => {
    // Category filter
    if (activeCategory === 'WARNING' && insight.insight_type !== 'MARKET_WARNING') return false;
    if (activeCategory === 'ACTIVITY' && insight.insight_type !== 'MARKET_ACTIVITY') return false;
    if (activeCategory === 'SUBURB' && insight.insight_type !== 'SUBURB_TREND') return false;

    // Search filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const titleMatch = insight.title?.toLowerCase().includes(q);
      const summaryMatch = insight.summary?.toLowerCase().includes(q);
      const suburbMatch = insight.suburb?.toLowerCase().includes(q);
      const factMatch = insight.evidence?.fact?.toLowerCase().includes(q);
      return titleMatch || summaryMatch || suburbMatch || factMatch;
    }

    return true;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredInsights.length / itemsPerPage) || 1;
  const currentInsights = filteredInsights.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
      {/* Top Banner */}
      <div className="px-6 py-5 border-b border-gray-200 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Brain size={24} className="text-indigo-400" />
          <div>
            <h3 className="text-lg leading-6 font-semibold">AI Market Intelligence</h3>
            <p className="text-xs text-slate-400 mt-0.5">Autonomous machine synthesis across real-time property transactions</p>
          </div>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-70"
        >
          <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
          <span>{generating ? 'Analyzing Market...' : 'Run AI Analysis'}</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-6 py-3.5 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto text-xs">
          <span className="text-gray-400 mr-1 flex items-center font-medium">
            <Filter size={13} className="mr-1" /> Category:
          </span>
          <button
            onClick={() => handleCategoryChange('ALL')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${
              activeCategory === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Insights ({insights.length})
          </button>
          <button
            onClick={() => handleCategoryChange('WARNING')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${
              activeCategory === 'WARNING'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Warnings
          </button>
          <button
            onClick={() => handleCategoryChange('ACTIVITY')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${
              activeCategory === 'ACTIVITY'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Macro Supply
          </button>
          <button
            onClick={() => handleCategoryChange('SUBURB')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${
              activeCategory === 'SUBURB'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Suburb Signals
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search suburb or insight..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
      
      {/* Content Area */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-16 text-gray-500 flex flex-col items-center">
            <RefreshCw size={24} className="animate-spin text-indigo-600 mb-2" />
            <span>Loading Intelligence Engine...</span>
          </div>
        ) : filteredInsights.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Sparkles size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-700">No matching insights found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your category filter or search keywords.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {currentInsights.map((insight) => (
              <div 
                key={insight.id} 
                className="border border-gray-200 hover:border-indigo-200 rounded-xl overflow-hidden shadow-sm transition-all duration-200 bg-white"
              >
                {/* Insight Header */}
                <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    {getIcon(insight.insight_type)}
                    <h4 className="font-semibold text-gray-900 text-base">{insight.title}</h4>
                    {insight.suburb && (
                      <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        <MapPin size={11} className="mr-1 text-indigo-600" />
                        {insight.suburb}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getTypeBadge(insight.insight_type)}`}>
                      {insight.insight_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                      {Math.round(insight.confidence <= 1 ? insight.confidence * 100 : insight.confidence)}% Confidence
                    </span>
                  </div>
                </div>
                
                {/* Grid Comparison: FACT vs INTERPRETATION */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* EVIDENCE (FACT) */}
                  <div className="bg-slate-50/90 border border-slate-200/80 rounded-lg p-4 relative flex flex-col justify-between">
                    <span className="absolute -top-3 left-4 bg-slate-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded tracking-wider flex items-center shadow-sm">
                      <Database size={10} className="mr-1.5 text-indigo-300" /> DATA EVIDENCE (FACT)
                    </span>
                    <p className="text-sm text-slate-800 mt-2 font-medium leading-relaxed">
                      {insight.evidence?.fact || 'No specific evidence extracted.'}
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Source: Database Event Log</span>
                      <span className="font-mono">{insight.model || 'AI-Engine-2.4'}</span>
                    </div>
                  </div>
                  
                  {/* SUMMARY (INTERPRETATION) */}
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-4 relative flex flex-col justify-between">
                    <span className="absolute -top-3 left-4 bg-amber-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded tracking-wider flex items-center shadow-sm">
                      <Sparkles size={10} className="mr-1.5 text-amber-200" /> AI SYNTHESIS (INTERPRETATION)
                    </span>
                    <p className="text-sm text-amber-950 mt-2 leading-relaxed">
                      {insight.summary}
                    </p>
                    <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-700">
                      <span>Strategic Assessment</span>
                      <span>High Reliability</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, filteredInsights.length)} of {filteredInsights.length} insights
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft size={14} className="mr-1" /> Previous
              </button>
              <span className="px-2 font-medium text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Next <ChevronRight size={14} className="ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsList;
