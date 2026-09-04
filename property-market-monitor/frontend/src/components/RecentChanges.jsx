import React, { useState, useEffect } from 'react';
import { fetchEvents } from '../services/eventService';
import { TrendingDown, TrendingUp, Tag, PlusCircle, CheckCircle, XCircle, Info } from 'lucide-react';

const RecentChanges = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetchEvents({ limit: 10 });
        setEvents(response.data || []);
      } catch (error) {
        console.error('Failed to load recent events:', error);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const getEventConfig = (event) => {
    switch (event.event_type) {
      case 'PRICE_CHANGED':
        if (event.metadata?.trend === 'reduced') {
          return {
            icon: <TrendingDown size={18} className="text-green-600" />,
            bgColor: 'bg-green-100',
            label: 'Price Reduced',
            color: 'text-green-800'
          };
        }
        return {
          icon: <TrendingUp size={18} className="text-red-600" />,
          bgColor: 'bg-red-100',
          label: 'Price Increased',
          color: 'text-red-800'
        };
      case 'STATUS_CHANGED':
        return {
          icon: <Tag size={18} className="text-orange-600" />,
          bgColor: 'bg-orange-100',
          label: 'Status Changed',
          color: 'text-orange-800'
        };
      case 'NEW_LISTING':
        return {
          icon: <PlusCircle size={18} className="text-blue-600" />,
          bgColor: 'bg-blue-100',
          label: 'New Listing',
          color: 'text-blue-800'
        };
      case 'SOLD':
        return {
          icon: <CheckCircle size={18} className="text-emerald-600" />,
          bgColor: 'bg-emerald-100',
          label: 'Sold',
          color: 'text-emerald-800'
        };
      case 'WITHDRAWN':
        return {
          icon: <XCircle size={18} className="text-gray-600" />,
          bgColor: 'bg-gray-100',
          label: 'Withdrawn',
          color: 'text-gray-800'
        };
      default:
        return {
          icon: <Info size={18} className="text-indigo-600" />,
          bgColor: 'bg-indigo-100',
          label: 'Listing Updated',
          color: 'text-indigo-800'
        };
    }
  };

  const formatCurrency = (val) => {
    if (!val) return 'N/A';
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
  };

  const getEventDescription = (event) => {
    const address = event.properties?.address || 'Unknown Property';
    const suburb = event.properties?.suburb_name || '';
    const fullAddress = `${address}${suburb ? `, ${suburb}` : ''}`;

    switch (event.event_type) {
      case 'PRICE_CHANGED':
        const oldP = formatCurrency(event.old_value);
        const newP = formatCurrency(event.new_value);
        return (
          <span>
            <strong>{fullAddress}</strong> changed from {oldP} to {newP}
          </span>
        );
      case 'STATUS_CHANGED':
      case 'SOLD':
      case 'WITHDRAWN':
        return (
          <span>
            <strong>{fullAddress}</strong> status changed to {event.new_value}
          </span>
        );
      case 'NEW_LISTING':
        return (
          <span>
            <strong>{fullAddress}</strong> just listed for {formatCurrency(event.metadata?.price)}
          </span>
        );
      default:
        return <span><strong>{fullAddress}</strong> had details updated</span>;
    }
  };

  const timeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  if (loading) {
    return <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">Loading recent changes...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Market Changes</h3>
      </div>
      <ul className="divide-y divide-gray-200">
        {events.length === 0 ? (
          <li className="px-6 py-4 text-gray-500 text-sm">No recent events detected.</li>
        ) : (
          events.map((event) => {
            const config = getEventConfig(event);
            return (
              <li key={event.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${config.bgColor} mr-4`}>
                    {config.icon}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(event.detected_at)}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-900">
                      {getEventDescription(event)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};

export default RecentChanges;
