import React, { useState, useEffect } from 'react';
import { X, TrendingDown, Home, Activity, CheckCircle, Clock } from 'lucide-react';
import { eventsApi, monitoringApi } from '../../services/api';
import { fetchAIInsights as fetchInsights } from '../../services/aiService';
import { formatDistanceToNow } from 'date-fns';

const PropertyIntelligenceDrawer = ({ property, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [insights, setInsights] = useState([]);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    if (!property) return;
    
    const fetchDetails = async () => {
      setLoading(true);
      try {
        // Fetch events for this property
        const evData = await eventsApi.getEvents({ limit: 50, listing_id: property.id });
        setEvents(evData.data || []);
        
        // Fetch AI insights for this property
        const inData = await fetchInsights({ limit: 20 });
        const propInsights = inData.filter(i => i.listing_id === property.id);
        setInsights(propInsights);
        
        // Fetch config
        try {
          const cfg = await monitoringApi.getConfig(property.id);
          setConfig(cfg);
        } catch (e) {
          console.log("No config found");
        }
        
      } catch (error) {
        console.error('Failed to fetch property intelligence:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetails();
  }, [property]);

  if (!property) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Drawer panel */}
      <div className="relative w-full max-w-2xl flex flex-col bg-gray-50 shadow-xl overflow-y-auto">
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-start sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{property.address}</h2>
            <p className="text-sm text-gray-500">{property.suburb_name} • {property.bedrooms} Bed • {property.bathrooms} Bath</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current State */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500 uppercase font-semibold">Current Price</p>
              <p className="text-2xl font-bold text-indigo-700">${property.price_numeric?.toLocaleString() || 'N/A'}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
              <p className="text-xl font-bold text-gray-900">{property.status || 'Unknown'}</p>
            </div>
          </div>

          {/* Monitoring config */}
          {config && (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-center justify-between">
              <div className="flex items-center">
                <Activity size={20} className="text-indigo-600 mr-2" />
                <div>
                  <p className="text-sm font-semibold text-indigo-900">Active Monitoring</p>
                  <p className="text-xs text-indigo-700">Checked {config.monitoring_frequency} • Next: {config.next_check_at ? formatDistanceToNow(new Date(config.next_check_at), { addSuffix: true }) : 'Soon'}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.last_sync_status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {config.last_sync_status || 'Pending'}
              </span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading intelligence data...</div>
          ) : (
            <>
              {/* AI Insights */}
              <h3 className="text-md font-semibold text-gray-900 mt-8 mb-2">AI Insights</h3>
              {insights.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
                  No AI insights generated for this property yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.map(i => (
                    <div key={i.id} className="bg-white border-l-4 border-indigo-500 shadow-sm rounded-r-lg p-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-900">{i.title}</h4>
                        <span className="text-xs font-medium bg-gray-100 text-gray-800 px-2 py-1 rounded">Conf: {i.confidence}%</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{i.summary}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Event History */}
              <h3 className="text-md font-semibold text-gray-900 mt-8 mb-2">Market Event History</h3>
              {events.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
                  No market events recorded yet.
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flow-root p-6">
                    <ul className="-mb-8">
                      {events.map((event, eventIdx) => (
                        <li key={event.id}>
                          <div className="relative pb-8">
                            {eventIdx !== events.length - 1 ? (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                  {event.event_type === 'PRICE_CHANGED' ? <TrendingDown size={16} className="text-orange-500"/> :
                                   event.event_type === 'STATUS_CHANGED' || event.event_type === 'SOLD' ? <Home size={16} className="text-green-500"/> :
                                   <Clock size={16} className="text-gray-500" />}
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    <span className="font-medium text-gray-900">{event.event_type.replace('_', ' ')}</span>
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Changed from <span className="font-medium text-gray-700">{event.old_value || 'Unknown'}</span> to <span className="font-medium text-gray-900">{event.new_value}</span>
                                  </p>
                                </div>
                                <div className="whitespace-nowrap text-right text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyIntelligenceDrawer;
