import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listingsApi } from '../services/api';
import { ArrowLeft, MapPin, Bed, Bath, Car, Home, ExternalLink } from 'lucide-react';

const PropertyDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [monitoringConfig, setMonitoringConfig] = useState(null);

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
        <Link to="/" className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-500">
          <ArrowLeft className="mr-2" size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const mainImage = property.property_images && property.property_images.length > 0 
    ? property.property_images[0].url 
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="mr-2" size={16} /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header/Hero Section */}
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2 h-64 md:h-auto bg-gray-100 flex items-center justify-center relative">
            {mainImage ? (
              <img src={mainImage} alt={property.address} className="w-full h-full object-cover" />
            ) : (
              <Home size={64} className="text-gray-300" />
            )}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold text-indigo-700 shadow-sm">
              {property.price || (property.price_numeric ? `$${property.price_numeric.toLocaleString()}` : 'Contact Agent')}
            </div>
          </div>
          
          <div className="md:w-1/2 p-6 lg:p-8 flex flex-col justify-center">
            <div className="mb-2">
              <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded capitalize">
                {property.property_type || 'Property'}
              </span>
              <span className="ml-2 inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded capitalize">
                {property.source || 'Unknown Source'}
              </span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.street_address || property.address}</h1>
            <p className="text-gray-500 flex items-center mb-6">
              <MapPin size={16} className="mr-1" />
              {property.suburb_name}, {property.state_code} {property.postcode}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                <Bed size={20} className="text-gray-400 mb-1" />
                <span className="font-semibold text-gray-900">{property.bedrooms || '-'}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Beds</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                <Bath size={20} className="text-gray-400 mb-1" />
                <span className="font-semibold text-gray-900">{property.bathrooms || '-'}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Baths</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                <Car size={20} className="text-gray-400 mb-1" />
                <span className="font-semibold text-gray-900">{property.garages || '-'}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Cars</span>
              </div>
            </div>

            {property.url && (
              <a 
                href={property.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 flex justify-center items-center font-medium transition-colors"
              >
                View Original Listing <ExternalLink size={18} className="ml-2" />
              </a>
            )}
          </div>
        </div>

        {/* Details Section */}
        <div className="p-6 lg:p-8 border-t border-gray-100 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Description</h2>
          <div className="prose prose-sm max-w-none text-gray-600">
            {property.description ? (
              <div dangerouslySetInnerHTML={{ __html: property.description.replace(/\n/g, '<br/>') }} />
            ) : (
              <p>No description available.</p>
            )}
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Agent Information</h3>
              <p className="text-gray-900 font-medium">{property.agent_name || 'Not provided'}</p>
              <p className="text-gray-600">{property.agent_agency}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Property Details</h3>
              <dl className="grid grid-cols-2 gap-y-2">
                <dt className="text-gray-500">Land Size:</dt>
                <dd className="text-gray-900">{property.land_size || 'Unknown'}</dd>
                <dt className="text-gray-500">Listed At:</dt>
                <dd className="text-gray-900">{property.created_at ? new Date(property.created_at).toLocaleDateString() : 'Unknown'}</dd>
                <dt className="text-gray-500">Updated At:</dt>
                <dd className="text-gray-900">{property.updated_at ? new Date(property.updated_at).toLocaleDateString() : 'Unknown'}</dd>
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
            <h2 className="text-lg font-semibold text-gray-900">Monitoring Status</h2>
            <button 
              onClick={toggleMonitoring}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                monitoringConfig?.monitoring_enabled 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {monitoringConfig?.monitoring_enabled ? 'Active (Click to Disable)' : 'Inactive (Click to Enable)'}
            </button>
          </div>
          {!monitoringConfig ? (
            <p className="text-gray-500 italic">No monitoring history available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Frequency</p>
                <p className="font-semibold text-gray-900 capitalize">{monitoringConfig.monitoring_frequency || 'N/A'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Last Checked</p>
                <p className="font-semibold text-gray-900">{monitoringConfig.last_checked_at ? new Date(monitoringConfig.last_checked_at).toLocaleString() : 'Never'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Last Sync Status</p>
                <p className="font-semibold text-gray-900 capitalize">{monitoringConfig.last_sync_status || 'Pending'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Price History Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Price History</h2>
          {priceHistory.length === 0 ? (
            <p className="text-gray-500 italic">No monitoring history available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date Detected</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Old Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">New Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {priceHistory.map((hist) => (
                    <tr key={hist.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{new Date(hist.detected_at).toLocaleString()}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">${hist.old_price?.toLocaleString()}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-gray-900">${hist.new_price?.toLocaleString()}</td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${hist.change_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status History</h2>
          {statusHistory.length === 0 ? (
            <p className="text-gray-500 italic">No monitoring history available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date Detected</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Old Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">New Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {statusHistory.map((hist) => (
                    <tr key={hist.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{new Date(hist.detected_at).toLocaleString()}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 capitalize">{hist.old_status}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-gray-900 capitalize">{hist.new_status}</td>
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
