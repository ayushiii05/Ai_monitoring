import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/analyticsService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MarketActivity = () => {
  const [data, setData] = useState([]);
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const stats = await analyticsApi.getActivity(range);
      setData(stats);
    } catch (error) {
      console.error('Failed to fetch market activity:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [range]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Market Activity Over Time</h2>
          <p className="text-sm text-gray-500">Volume of market events detected</p>
        </div>
        <select 
          className="border border-gray-300 rounded-md text-sm py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {loading && data.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-gray-400">Loading chart data...</div>
      ) : data.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-gray-400">No market events recorded in this period.</div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} minTickGap={30} />
              <YAxis tick={{fontSize: 12}} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Area type="monotone" dataKey="NEW_LISTING" name="New Listings" stroke="#818cf8" fillOpacity={1} fill="url(#colorNew)" />
              <Area type="monotone" dataKey="SOLD" name="Properties Sold" stroke="#34d399" fillOpacity={1} fill="url(#colorSold)" />
              <Area type="monotone" dataKey="PRICE_CHANGED" name="Price Changes" stroke="#fbbf24" fillOpacity={1} fill="url(#colorPrice)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default MarketActivity;
