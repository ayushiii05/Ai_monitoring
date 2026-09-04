import React, { useState, useEffect } from 'react';
import ListingsTable from '../components/ListingsTable';
import Filters from '../components/Filters';
import RecentChanges from '../components/RecentChanges';
import AIInsightsList from '../components/AIInsightsList';
import AlertsPanel from '../components/AlertsPanel';
import MarketOverview from '../components/analytics/MarketOverview';
import MarketActivity from '../components/analytics/MarketActivity';
import SuburbIntelligence from '../components/intelligence/SuburbIntelligence';
import MonitoringHealth from '../components/system/MonitoringHealth';
import { listingsApi } from '../services/api';
import { LayoutDashboard, Home, Brain, Bell, Settings } from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [filters, setFilters] = useState({
    suburb: '',
    state: '',
    min_price: '',
    max_price: '',
    bedrooms: '',
    bathrooms: ''
  });

  const fetchListings = async () => {
    setLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );
      
      const response = await listingsApi.getListings({
        page,
        limit,
        ...cleanFilters
      });
      setListings(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error("Failed to fetch listings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'properties') {
      fetchListings();
    }
  }, [page, activeTab]);

  const handleSearch = () => {
    if (page !== 1) setPage(1);
    else fetchListings();
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'properties', name: 'Property Monitor', icon: <Home size={18} /> },
    { id: 'intelligence', name: 'Intelligence', icon: <Brain size={18} /> },
    { id: 'alerts', name: 'Alerts', icon: <Bell size={18} /> },
    { id: 'system', name: 'System Health', icon: <Settings size={18} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Property Market Monitor</h1>
        <p className="mt-1 text-sm text-gray-500">Real-time 24/7 AI-powered market intelligence.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8 overflow-x-auto">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className={`mr-2 ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'}`}>
                {tab.icon}
              </span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'overview' && (
          <>
            <MarketOverview />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <MarketActivity />
              <RecentChanges />
            </div>
          </>
        )}

        {activeTab === 'properties' && (
          <>
            <Filters filters={filters} setFilters={setFilters} onSearch={handleSearch} />
            <ListingsTable 
              listings={listings} 
              loading={loading} 
              page={page} 
              total={total} 
              limit={limit} 
              setPage={setPage} 
            />
          </>
        )}

        {activeTab === 'intelligence' && (
          <>
            <SuburbIntelligence />
            <AIInsightsList />
          </>
        )}

        {activeTab === 'alerts' && (
          <AlertsPanel />
        )}

        {activeTab === 'system' && (
          <MonitoringHealth />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
