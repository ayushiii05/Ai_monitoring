import React, { useState } from 'react';
import { Home, Filter, Search, ChevronLeft, ChevronRight, MapPin, Bed, Bath, Car, Calendar, ExternalLink, ShieldAlert } from 'lucide-react';
import PropertyIntelligenceDrawer from './properties/PropertyIntelligenceDrawer';

const ListingsTable = ({ listings, loading, error, onRetry, onReset, page, total, limit, setPage }) => {
  const [selectedProperty, setSelectedProperty] = useState(null);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-red-200">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load properties</h3>
        <p className="mt-1 text-sm text-red-600">{error}</p>
        <p className="mt-1 text-xs text-gray-400">Make sure the backend server is running on http://localhost:5001</p>
        {onRetry && (
          <button 
            onClick={onRetry} 
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-14 bg-white rounded-lg shadow-sm border border-gray-200">
        <Home className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-2 text-base font-semibold text-gray-900">No properties found</h3>
        <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
          No listings match your current filter criteria. Try adjusting or clearing your filters.
        </p>
        {onReset && (
          <button
            onClick={onReset}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-xs text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {listings.map((property) => {
              const formatPrice = (p) => {
                if (p.price && p.price.trim() !== '' && p.price !== 'null') {
                  return p.price;
                }
                if (p.price_numeric && p.price_numeric > 0) {
                  return `$${Number(p.price_numeric).toLocaleString('en-AU')}`;
                }
                return 'Contact Agent';
              };

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
              const hasImage = property.property_images && property.property_images.length > 0 && property.property_images[0].url;

              return (
                <tr 
                  key={property.id} 
                  className="hover:bg-indigo-50/60 transition-colors cursor-pointer"
                  onClick={() => setSelectedProperty(property)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-24 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                        {hasImage ? (
                          <img 
                            className="h-16 w-24 object-cover" 
                            src={property.property_images[0].url} 
                            alt={property.street_address || property.address || ''} 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50">
                            <Home size={20} />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900 truncate max-w-xs">{property.street_address || property.address}</div>
                        <div className="text-xs text-gray-500 capitalize mt-0.5">{property.property_type || 'Property'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{property.suburb_name}</div>
                    <div className="text-xs text-gray-500">{property.state_code} {property.postcode || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="flex items-center" title="Bedrooms"><Bed size={15} className="mr-1 text-gray-400" /> {property.bedrooms || '-'}</div>
                      <div className="flex items-center" title="Bathrooms"><Bath size={15} className="mr-1 text-gray-400" /> {property.bathrooms || '-'}</div>
                      <div className="flex items-center" title="Car Spaces"><Car size={15} className="mr-1 text-gray-400" /> {property.garages || '-'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-indigo-600">{formatPrice(property)}</span>
                      {externalUrl && (
                        <a
                          href={externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Open source listing"
                          className="text-gray-400 hover:text-indigo-600 ml-2 p-1.5 rounded-md hover:bg-gray-100 transition-colors inline-flex items-center"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-medium">{total}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${page === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${page === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>

      {selectedProperty && (
        <PropertyIntelligenceDrawer 
          property={selectedProperty} 
          onClose={() => setSelectedProperty(null)} 
        />
      )}
    </div>
  );
};

export default ListingsTable;
