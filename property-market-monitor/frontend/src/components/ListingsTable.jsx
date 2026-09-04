import React, { useState } from 'react';
import { Home, Filter, Search, ChevronLeft, ChevronRight, MapPin, Bed, Bath, Car, Calendar, ExternalLink, ShieldAlert } from 'lucide-react';
import PropertyIntelligenceDrawer from './properties/PropertyIntelligenceDrawer';

const ListingsTable = ({ listings, loading, page, total, limit, setPage }) => {
  const [selectedProperty, setSelectedProperty] = useState(null);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
        <Home className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No properties found</h3>
        <p className="mt-1 text-sm text-gray-500">Try adjusting your filters to see more results.</p>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent/Source</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {listings.map((property) => (
              <tr 
                key={property.id} 
                className="hover:bg-indigo-50 transition-colors cursor-pointer"
                onClick={() => setSelectedProperty(property)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-24 bg-gray-100 rounded-md overflow-hidden">
                      {property.property_images && property.property_images.length > 0 ? (
                        <img className="h-16 w-24 object-cover" src={property.property_images[0].url} alt="" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400"><Home size={20} /></div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{property.street_address || property.address}</div>
                      <div className="text-sm text-gray-500 capitalize">{property.property_type || 'Property'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{property.suburb_name}</div>
                  <div className="text-sm text-gray-500">{property.state_code} {property.postcode}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <div className="flex items-center" title="Bedrooms"><Bed size={16} className="mr-1" /> {property.bedrooms || '-'}</div>
                    <div className="flex items-center" title="Bathrooms"><Bath size={16} className="mr-1" /> {property.bathrooms || '-'}</div>
                    <div className="flex items-center" title="Car Spaces"><Car size={16} className="mr-1" /> {property.garages || '-'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-indigo-600">{property.price || (property.price_numeric ? `$${property.price_numeric.toLocaleString()}` : 'Contact Agent')}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{property.agent_name || property.agent_agency || 'Unknown Agent'}</div>
                  <div className="text-xs text-gray-500 capitalize px-2 py-1 bg-gray-100 inline-block rounded mt-1">{property.source || 'Unknown Source'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2 items-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedProperty(property); }}
                      className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-md flex items-center"
                    >
                      <ShieldAlert size={14} className="mr-1"/> Intelligence
                    </button>
                    {property.url && (
                      <a 
                        href={property.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-500 hover:text-gray-700 inline-flex items-center ml-2"
                        title="View Source"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
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
