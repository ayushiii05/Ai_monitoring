import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, TrendingDown, TrendingUp, Home, Activity, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import api, { eventsApi, monitoringApi } from '../../services/api';
import { fetchAIInsights as fetchInsights, fetchPropertyIntelligence } from '../../services/aiService';
import { safeTimeAgo } from '../../utils/dateUtils';
import ErrorBoundary from '../common/ErrorBoundary';

const PropertyIntelligenceDrawerContent = ({ property, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [insights, setInsights] = useState([]);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    if (!property) return;
    
    const fetchDetails = async () => {
      setLoading(true);
      try {
        // 1. Fetch events for this specific property
        let propEvents = [];
        try {
          const res = await api.get(`/listings/${property.id}/events`);
          if (Array.isArray(res.data) && res.data.length > 0) {
            propEvents = res.data;
          }
        } catch (e) {
          // Fallback to global events filtered by property_id
          try {
            const evData = await eventsApi.getEvents({ limit: 100 });
            const list = Array.isArray(evData) ? evData : (evData?.data || []);
            propEvents = list.filter(ev => String(ev.property_id) === String(property.id) || String(ev.listing_id) === String(property.id));
          } catch (err2) {
            console.warn("Could not fetch events:", err2);
          }
        }
        setEvents(propEvents);
        
        // 2. Fetch AI insights for this property
        try {
          let propInsights = [];
          try {
            const direct = await fetchPropertyIntelligence(property.id);
            if (Array.isArray(direct) && direct.length > 0) {
              propInsights = direct;
            }
          } catch (e) {}

          if (propInsights.length === 0) {
            const inData = await fetchInsights();
            const list = Array.isArray(inData) ? inData : (inData?.data || []);
            propInsights = list.filter(i => 
              String(i.listing_id) === String(property.id) ||
              (property.suburb_name && i.suburb && i.suburb.toLowerCase() === property.suburb_name.toLowerCase())
            );
          }
          setInsights(propInsights);
        } catch (e) {
          setInsights([]);
        }
        
        // 3. Fetch config
        try {
          const cfg = await monitoringApi.getConfig(property.id);
          setConfig(cfg);
        } catch (e) {
          setConfig(null);
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

  const getExternalUrl = (p) => {
    if (p.url && (p.url.startsWith('http://') || p.url.startsWith('https://')) && !p.url.includes('propradar.com.au')) {
      return p.url;
    }
    const slugify = (text) => (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const addressPart = slugify(p.street_address || p.address);
    const suburbPart = slugify(p.suburb_name);
    const isAct = p.state_code === 'ACT' || (!p.state_code && p.address?.toUpperCase().includes('ACT'));
    
    if (isAct) {
      const statePart = 'act';
      const postcodePart = p.postcode || '';
      const slug = [addressPart, suburbPart, statePart, postcodePart].filter(Boolean).join('-');
      return slug ? `https://www.allhomes.com.au/${slug}` : null;
    }

    const fullSearch = `${p.street_address || p.address || ''}, ${p.suburb_name || ''} ${p.state_code || ''}`.trim();
    return `https://www.domain.com.au/search-result?search=${encodeURIComponent(fullSearch)}`;
  };
  const externalUrl = getExternalUrl(property);

  const formattedPrice = property.price && property.price.trim() !== '' && property.price !== 'null'
    ? property.price
    : property.price_numeric && Number(property.price_numeric) > 0
    ? `$${Number(property.price_numeric).toLocaleString('en-AU')}`
    : 'Contact Agent';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      
      {/* Drawer panel */}
      <div className="relative w-full max-w-2xl flex flex-col bg-gray-50 shadow-2xl overflow-y-auto">
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-start sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{property.street_address || property.address || 'Property Details'}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {property.suburb_name} {property.state_code ? `• ${property.state_code}` : ''} • {property.bedrooms || '-'} Bed • {property.bathrooms || '-'} Bath • {property.garages || '-'} Car
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to={`/property/${property.id}`}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-xs"
              title="Open dedicated property analytics page"
            >
              Full Page
            </Link>
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                title="Open listing on source website"
              >
                <ExternalLink size={13} className="mr-1" />
                View Source
              </a>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Current State */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-xs border border-gray-200">
              <p className="text-xs text-gray-500 uppercase font-semibold">Current Price</p>
              <p className="text-2xl font-bold text-indigo-700 mt-1">{formattedPrice}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-xs border border-gray-200">
              <p className="text-xs text-gray-500 uppercase font-semibold">Listing Status</p>
              <p className="text-xl font-bold text-gray-900 mt-1 capitalize">{property.status || 'Active'}</p>
            </div>
          </div>

          {/* Monitoring config */}
          {config && (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-center justify-between">
              <div className="flex items-center">
                <Activity size={20} className="text-indigo-600 mr-3 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-indigo-900">Active 24/7 Monitoring</p>
                  <p className="text-xs text-indigo-700">
                    Checked {config.monitoring_frequency || 'periodically'} • Next: {config.next_check_at ? safeTimeAgo(config.next_check_at) : 'Soon'}
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${config.last_sync_status === 'success' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                {config.last_sync_status || 'Monitoring'}
              </span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-gray-500 flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
              Loading property intelligence...
            </div>
          ) : (
            <>
              {/* AI Insights */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">AI Intelligence Insights</h3>
                {insights.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
                    No specific AI market warnings or trends detected for this property yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {insights.map(i => (
                      <div key={i.id} className="bg-white border-l-4 border-indigo-500 shadow-xs rounded-r-lg p-4 border border-gray-200 border-l-transparent">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-gray-900 text-sm">{i.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{i.summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Event History */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Market Event Timeline</h3>
                {events.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
                    No price shifts or status changes recorded yet for this property.
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flow-root p-6">
                      <ul className="-mb-8">
                        {events.map((event, eventIdx) => {
                          const eventDate = safeTimeAgo(event.detected_at || event.created_at);
                          const typeLabel = (event.event_type || 'UPDATE').replace(/_/g, ' ');

                          let changeDescription = null;
                          if (event.event_type === 'PRICE_CHANGED') {
                            const fmt = (v) => v ? (typeof v === 'number' ? `$${v.toLocaleString('en-AU')}` : String(v)) : 'Unknown';
                            changeDescription = `Price changed from ${fmt(event.old_value)} to ${fmt(event.new_value)}`;
                          } else if (event.event_type === 'STATUS_CHANGED' || event.event_type === 'SOLD') {
                            changeDescription = `Status updated to ${event.new_value || event.event_type}`;
                          } else if (event.event_type === 'NEW_LISTING') {
                            changeDescription = 'Initial market listing detected';
                          } else {
                            changeDescription = event.payload?.reason || event.new_value || 'Listing data synchronized';
                          }

                          return (
                            <li key={event.id || eventIdx}>
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
                                      <p className="text-sm font-medium text-gray-900 capitalize">{typeLabel.toLowerCase()}</p>
                                      <p className="text-sm text-gray-500 mt-0.5">
                                        {changeDescription}
                                      </p>
                                    </div>
                                    <div className="whitespace-nowrap text-right text-xs text-gray-400">
                                      {eventDate}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const PropertyIntelligenceDrawer = (props) => (
  <ErrorBoundary title="Error opening Property Drawer" onReset={props.onClose}>
    <PropertyIntelligenceDrawerContent {...props} />
  </ErrorBoundary>
);

export default PropertyIntelligenceDrawer;
