import React, { useState, useEffect } from 'react';
import { fetchAlerts, markAlertAsRead, markAllAlertsAsRead } from '../services/alertService';
import { Bell, AlertTriangle, ArrowDown, ArrowUp, Info, CheckCircle, CheckCheck, Home, RefreshCw, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'CRITICAL' | 'SALES'
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = async () => {
    try {
      const data = await fetchAlerts();
      setAlerts(data || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const handleMarkRead = async (id) => {
    try {
      await markAlertAsRead(id);
      setAlerts(prev => prev.map(a => String(a.id) === String(id) ? { ...a, notification_status: 'READ' } : a));
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAlertsAsRead();
      setAlerts(prev => prev.map(a => ({ ...a, notification_status: 'READ' })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
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

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-600 text-white';
      case 'HIGH': return 'bg-amber-600 text-white';
      case 'MEDIUM': return 'bg-blue-600 text-white';
      case 'LOW': return 'bg-gray-500 text-white';
      default: return 'bg-slate-500 text-white';
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

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (activeFilter === 'UNREAD') return alert.notification_status === 'UNREAD';
    if (activeFilter === 'CRITICAL') return alert.severity === 'CRITICAL' || alert.severity === 'HIGH';
    if (activeFilter === 'SALES') return alert.alert_type === 'SOLD' || alert.alert_type === 'PRICE_REDUCTION';
    return true;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8 min-h-[600px] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center space-x-3">
          <Bell size={22} className="text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Active Market Alerts</h3>
          {unreadCount > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold animate-pulse">
              {unreadCount} New
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
              All Caught Up
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            >
              <CheckCheck size={14} className="mr-1.5" />
              Mark All as Read
            </button>
          )}

          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 shadow-sm transition-colors"
          >
            <RefreshCw size={13} className={`mr-1.5 ${refreshing ? 'animate-spin text-indigo-600' : 'text-gray-500'}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="px-6 py-2.5 border-b border-gray-200 bg-white flex items-center space-x-2 text-xs overflow-x-auto">
        <span className="text-gray-400 mr-2 flex items-center font-medium">
          <Filter size={13} className="mr-1" /> Filter:
        </span>
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1 rounded-full font-medium transition-colors ${
            activeFilter === 'ALL'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({alerts.length})
        </button>
        <button
          onClick={() => setActiveFilter('UNREAD')}
          className={`px-3 py-1 rounded-full font-medium transition-colors ${
            activeFilter === 'UNREAD'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setActiveFilter('CRITICAL')}
          className={`px-3 py-1 rounded-full font-medium transition-colors ${
            activeFilter === 'CRITICAL'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Critical & High
        </button>
        <button
          onClick={() => setActiveFilter('SALES')}
          className={`px-3 py-1 rounded-full font-medium transition-colors ${
            activeFilter === 'SALES'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Sales & Relistings
        </button>
      </div>

      {/* Alerts List */}
      <div className="flex-1 p-6 bg-gray-50/40 overflow-y-auto">
        {loading ? (
          <div className="text-center py-16 text-gray-500 flex flex-col items-center">
            <RefreshCw size={24} className="animate-spin text-indigo-600 mb-2" />
            <span>Loading active alerts...</span>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-20 text-gray-500 flex flex-col items-center">
            <CheckCircle size={44} className="text-green-400 mb-3" />
            <p className="font-semibold text-gray-800 text-base">You're all caught up!</p>
            <p className="text-sm text-gray-500 mt-1">
              {activeFilter === 'UNREAD' 
                ? 'No unread alerts remaining. Switch to "All" to view past notifications.' 
                : 'No active market alerts matching this filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => {
              const isUnread = alert.notification_status === 'UNREAD';
              return (
                <div 
                  key={alert.id} 
                  className={`p-5 rounded-lg border flex flex-col sm:flex-row gap-4 transition-all duration-200 ${
                    isUnread 
                      ? 'bg-white shadow-sm border-indigo-200 border-l-4 border-l-indigo-600 hover:shadow-md' 
                      : 'bg-white/80 border-gray-200 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-sm ${getSeverityStyle(alert.severity)}`}>
                    {getIcon(alert.alert_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase ${getSeverityBadge(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <h4 className={`text-sm font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                          {alert.title}
                        </h4>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                      {alert.message}
                    </p>
                    
                    {alert.properties?.address && (
                      <div className="mt-3 flex items-center text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-md inline-flex border border-gray-100">
                        <Home size={13} className="mr-1.5 text-indigo-500" />
                        <span>{alert.properties.address}</span>
                        {alert.properties.suburb_name && (
                          <span className="ml-1 text-gray-400">• {alert.properties.suburb_name}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="sm:self-center shrink-0 flex items-center justify-end pt-2 sm:pt-0">
                    {isUnread ? (
                      <button 
                        onClick={() => handleMarkRead(alert.id)}
                        className="inline-flex items-center text-xs text-gray-500 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 px-3 py-1.5 rounded-md transition-colors font-medium"
                        title="Mark as read"
                      >
                        <CheckCircle size={14} className="mr-1.5 text-gray-400 group-hover:text-indigo-600" />
                        Mark Read
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic px-2 py-1 bg-gray-50 rounded">
                        Read
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
