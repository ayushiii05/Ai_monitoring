import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/analyticsService';
import { Building, Activity, TrendingDown, TrendingUp, Home, Ban, FileCheck, RefreshCw } from 'lucide-react';

const MarketOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const stats = await analyticsApi.getOverview();
      setData(stats);
    } catch (error) {
      console.error('Failed to fetch market overview:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 300000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <div className="p-8 text-center text-gray-500 flex flex-col items-center"><RefreshCw className="animate-spin mb-2" /> Loading Overview...</div>;
  }

  if (!data) return null;

  const StatCard = ({ title, value, icon, colorClass, subtitle }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center transition-transform hover:scale-[1.02]">
      <div className={`p-4 rounded-full mr-4 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString('en-AU') : (value ?? 0)}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Current Market Snapshot</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Monitored Properties" 
          value={data.total_monitored} 
          icon={<Activity size={24} />} 
          colorClass="bg-indigo-100 text-indigo-600"
          subtitle="Actively tracking 24/7"
        />
        <StatCard 
          title="Active Listings" 
          value={data.active_listings} 
          icon={<Building size={24} />} 
          colorClass="bg-blue-100 text-blue-600"
        />
        <StatCard 
          title="Sold Properties" 
          value={data.sold_listings} 
          icon={<Home size={24} />} 
          colorClass="bg-green-100 text-green-600"
        />
        <StatCard 
          title="Under Offer" 
          value={data.under_offer} 
          icon={<FileCheck size={24} />} 
          colorClass="bg-yellow-100 text-yellow-600"
        />
        <StatCard 
          title="Withdrawn" 
          value={data.withdrawn} 
          icon={<Ban size={24} />} 
          colorClass="bg-gray-100 text-gray-600"
        />
        <StatCard 
          title="New Listings (30d)" 
          value={data.new_listings_30d} 
          icon={<TrendingUp size={24} />} 
          colorClass="bg-emerald-100 text-emerald-600"
          subtitle="Added in last 30 days"
        />
        <StatCard 
          title="Price Reductions (30d)" 
          value={data.price_reductions_30d} 
          icon={<TrendingDown size={24} />} 
          colorClass="bg-orange-100 text-orange-600"
          subtitle="Drops in last 30 days"
        />
        <StatCard 
          title="Price Increases (30d)" 
          value={data.price_increases_30d} 
          icon={<TrendingUp size={24} />} 
          colorClass="bg-rose-100 text-rose-600"
          subtitle="Hikes in last 30 days"
        />
      </div>
    </div>
  );
};

export default MarketOverview;
