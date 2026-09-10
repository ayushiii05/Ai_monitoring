import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listingsApi } from '../services/api';
import { ArrowLeft, MapPin, Bed, Bath, Car, Home, ExternalLink, Phone, Mail, Building } from 'lucide-react';
import { safeTimeAgo, safeFormatDate } from '../utils/dateUtils';

const PropertyDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [monitoringConfig, setMonitoringConfig] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchListingData = async () => {
      try {
        const [
          data,
          priceHist,
          statusHist,
          monitoring
        ] = await Promise.all([
          listingsApi.getListing(id),
          listingsApi.getPriceHistory(id).catch(() => []),
          listingsApi.getStatusHistory(id).catch(() => []),
          listingsApi.getMonitoringConfig(id).catch(() => null)
        ]);
        
        setProperty(data);
        setPriceHistory(priceHist);
        setStatusHistory(statusHist);
        setMonitoringConfig(monitoring);
        setActiveImageIndex(0);
      } catch (err) {
        setError("Failed to load property details");
      } finally {
        setLoading(false);
      }
    };
    fetchListingData();
  }, [id]);

  const toggleMonitoring = async () => {
    try {
      const newStatus = !monitoringConfig?.monitoring_enabled;
      const updated = await listingsApi.updateMonitoringConfig(id, {
        monitoring_enabled: newStatus
      });
      setMonitoringConfig(updated);
    } catch (err) {
      console.error("Failed to update monitoring config", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">{error || "Property not found"}</h3>
        <Link to="/" className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-500 font-medium">
          <ArrowLeft className="mr-2" size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const images = property.property_images && property.property_images.length > 0 
    ? property.property_images.map(img => img.url)
    : [];

  const mainImage = images[activeImageIndex] || images[0] || null;

  const getExternalUrl = (p) => {
    if (p.url && (p.url.startsWith('http://') || p.url.startsWith('https://')) && !p.url.includes('propradar.com.au')) {
      // If it's an allhomes URL for a non-ACT state (like NSW Point Piper or Parramatta), Allhomes redirects to homepage:
      if (p.url.includes('allhomes.com.au') && p.state_code && p.state_code !== 'ACT') {
        const fullSearch = `${p.street_address || p.address || ''}, ${p.suburb_name || ''} ${p.state_code || ''}`.trim();
        return `https://www.domain.com.au/search-result?search=${encodeURIComponent(fullSearch)}`;
      }
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
        <ArrowLeft className="mr-2" size={16} /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header/Hero Section */}
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2 bg-gray-100 flex flex-col justify-between relative min-h-[320px]">
            <div className="w-full h-80 bg-gray-900/5 flex items-center justify-center relative overflow-hidden">
              {mainImage ? (
                <img 
                  src={mainImage} 
                  alt={property.address} 
                  className="w-full h-full object-cover transition-all duration-300" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <Home size={64} className="text-gray-300" />
              )}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-full text-sm font-bold text-indigo-700 shadow-sm border border-indigo-100">
                {formattedPrice}
              </div>
            </div>

            {/* Image Thumbnail Strip if multiple images exist */}
            {images.length > 1 && (
              <div className="p-3 bg-gray-50 border-t border-gray-200 flex space-x-2 overflow-x-auto">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx ? 'border-indigo-600 scale-105 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="md:w-1/2 p-6 lg:p-8 flex flex-col justify-between">
            <div>
              <div className="mb-2.5 flex items-center gap-2">
                <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md capitalize border border-indigo-100">
                  {property.property_type || 'Residential'}
                </span>
                <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md capitalize">
                  {property.source || 'Domain'}
                </span>
                <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md capitalize ${
                  (property.status || '').toLowerCase() === 'sold' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}>
                  {property.status || 'Active'}
                </span>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                {property.street_address || property.address}
              </h1>
              <p className="text-gray-500 flex items-center text-sm mb-6">
                <MapPin size={16} className="mr-1.5 text-indigo-500 shrink-0" />
                {property.suburb_name}{property.state_code ? `, ${property.state_code}` : ''} {property.postcode || ''}
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <Bed size={20} className="text-indigo-600 mb-1" />
                  <span className="font-bold text-gray-900">{property.bedrooms || '-'}</span>
                  <span className="text-[11px] text-gray-500 uppercase tracking-wider">Beds</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <Bath size={20} className="text-indigo-600 mb-1" />
                  <span className="font-bold text-gray-900">{property.bathrooms || '-'}</span>
                  <span className="text-[11px] text-gray-500 uppercase tracking-wider">Baths</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <Car size={20} className="text-indigo-600 mb-1" />
                  <span className="font-bold text-gray-900">{property.garages || '-'}</span>
                  <span className="text-[11px] text-gray-500 uppercase tracking-wider">Cars</span>
                </div>
              </div>
            </div>

            {externalUrl && (
              <a 
                href={externalUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 flex justify-center items-center font-semibold text-sm shadow-sm transition-colors"
              >
                View Source Listing <ExternalLink size={16} className="ml-2" />
              </a>
            )}
          </div>
        </div>

        {/* Details Section */}
        <div className="p-6 lg:p-8 border-t border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Property Description</h2>
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed bg-white p-5 rounded-lg border border-gray-200 shadow-xs">
            {property.description ? (
              <div dangerouslySetInnerHTML={{ __html: property.description.replace(/\n/g, '<br/>') }} />
            ) : (
              <p className="text-gray-500 italic">No description provided for this listing.</p>
            )}
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Agent & Agency</h3>
              <p className="text-base font-bold text-gray-900">{property.agent_name || 'Listing Agent'}</p>
              <p className="text-sm font-medium text-indigo-600 mt-0.5 flex items-center">
                <Building size={14} className="mr-1.5" />
                {property.agent_agency || 'Independent Agency'}
              </p>
              {property.agent_phone && (
                <p className="text-xs text-gray-600 mt-2 flex items-center">
                  <Phone size={13} className="mr-1.5 text-gray-400" />
                  {property.agent_phone}
                </p>
              )}
              {property.agent_email && (
                <p className="text-xs text-indigo-600 mt-1 flex items-center">
                  <Mail size={13} className="mr-1.5 text-gray-400" />
                  {property.agent_email}
                </p>
              )}
            </div>
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Property Specifications</h3>
              <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
                <dt className="text-gray-500">Floor Size:</dt>
                <dd className="text-gray-900 font-semibold">{property.floor_size || 'N/A'}</dd>
                <dt className="text-gray-500">Land Size:</dt>
                <dd className="text-gray-900 font-semibold">{property.land_size || 'N/A'}</dd>
                <dt className="text-gray-500">First Monitored:</dt>
                <dd className="text-gray-900 font-semibold">{safeFormatDate(property.created_at)}</dd>
                <dt className="text-gray-500">Last Synced:</dt>
                <dd className="text-gray-900 font-semibold">{safeFormatDate(property.updated_at)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Monitoring & History Sections */}
      <div className="mt-8 space-y-6">
        
        {/* Monitoring Config Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">24/7 Monitoring Status</h2>
              <p className="text-xs text-gray-500">Automated price changes and market status detection</p>
            </div>
            <button 
              onClick={toggleMonitoring}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                monitoringConfig?.monitoring_enabled 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {monitoringConfig?.monitoring_enabled ? 'Active (Click to Disable)' : 'Inactive (Click to Enable)'}
            </button>
          </div>
          {!monitoringConfig ? (
            <p className="text-gray-500 italic text-sm">No active monitoring configuration registered.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-semibold">Frequency</p>
                <p className="font-bold text-gray-900 capitalize mt-1">{monitoringConfig.monitoring_frequency || 'Hourly'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-semibold">Last Checked</p>
                <p className="font-bold text-gray-900 mt-1">{safeTimeAgo(monitoringConfig.last_checked_at, 'Recently')}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-semibold">Sync Status</p>
                <p className="font-bold text-emerald-700 capitalize mt-1">{monitoringConfig.last_sync_status || 'Operational'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Price History Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Price History</h2>
          {priceHistory.length === 0 ? (
            <p className="text-gray-500 italic text-sm">No historical price adjustments detected since initial monitoring began.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Date Detected</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Old Price</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">New Price</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Change</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {priceHistory.map((hist) => (
                    <tr key={hist.id}>
                      <td className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-900">{safeFormatDate(hist.detected_at)}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-500">${hist.old_price?.toLocaleString()}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-sm font-bold text-gray-900">${hist.new_price?.toLocaleString()}</td>
                      <td className={`px-4 py-2.5 whitespace-nowrap text-sm font-semibold ${hist.change_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {hist.change_amount > 0 ? '+' : ''}{hist.change_amount?.toLocaleString()} ({hist.change_percentage}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status History Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Status History</h2>
          {statusHistory.length === 0 ? (
            <p className="text-gray-500 italic text-sm">No status changes detected. Currently actively tracked on market.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Date Detected</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Old Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">New Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {statusHistory.map((hist) => (
                    <tr key={hist.id}>
                      <td className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-900">{safeFormatDate(hist.detected_at)}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-500 capitalize">{hist.old_status}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-sm font-semibold text-gray-900 capitalize">{hist.new_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PropertyDetails;
