import React, { useState, useEffect } from 'react';
import { fetchAlerts, markAlertAsRead } from '../services/alertService';
import { Bell, AlertTriangle, ArrowDown, ArrowUp, Info, CheckCircle, Home } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    try {
      const data = await fetchAlerts();
      setAlerts(data || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    // Poll for new alerts every 60 seconds
    const interval = setInterval(loadAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markAlertAsRead(id);
      setAlerts(alerts.map(a => a.id === id ? { ...a, notification_status: 'READ' } : a));
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'PRICE_REDUCTION': return <ArrowDown size={18} />;
      case 'PRICE_INCREASE': return <ArrowUp size={18} />;
      case 'SOLD': return <Home size={18} />;
      case 'AI_INSIGHT': return <AlertTriangle size={18} />;
      default: return <Info size={18} />;
    }
  };

  const unreadCount = alerts.filter(a => a.notification_status === 'UNREAD').length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8 h-96 flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-2">
          <Bell size={20} className="text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Active Alerts</h3>
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
              {unreadCount} New
            </span>
          )}
        </div>
        <button onClick={loadAlerts} className="text-sm text-indigo-600 hover:text-indigo-800">
          Refresh
        </button>
      </div>

      <div className="overflow-y-auto flex-1 p-4 bg-gray-50/50">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 flex flex-col items-center">
            <CheckCircle size={40} className="text-green-300 mb-3" />
            <p className="font-medium text-gray-700">You're all caught up!</p>
            <p className="text-sm">No active market alerts detected.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-4 rounded-lg border flex gap-4 transition-all ${
                  alert.notification_status === 'UNREAD' 
                    ? 'bg-white shadow-md border-indigo-100 border-l-4 border-l-indigo-500' 
                    : 'bg-gray-50 border-gray-200 opacity-70'
                }`}
              >
                <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${getSeverityStyle(alert.severity)}`}>
                  {getIcon(alert.alert_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm font-semibold truncate ${alert.notification_status === 'UNREAD' ? 'text-gray-900' : 'text-gray-600'}`}>
                      {alert.title}
                    </p>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <p className="mt-1 text-sm text-gray-600">
                    {alert.message}
                  </p>
                  
                  {alert.properties?.address && (
                    <p className="mt-2 text-xs font-medium text-gray-500 flex items-center">
                      <Home size={12} className="mr-1" />
                      {alert.properties.address}, {alert.properties.suburb_name}
                    </p>
                  )}
                </div>

                {alert.notification_status === 'UNREAD' && (
                  <button 
                    onClick={() => handleMarkRead(alert.id)}
                    className="self-center shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors"
                    title="Mark as read"
                  >
                    <CheckCircle size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
