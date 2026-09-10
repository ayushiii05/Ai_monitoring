import React from 'react';
import { Filter, RotateCcw, MapPin } from 'lucide-react';

const COMMON_SUBURBS = [
  'Point Piper',
  'Parramatta',
  'Sydney',
  'Richmond',
  'Pascoe Vale',
  'Kingston',
  'Belconnen',
  'Griffith',
  'Gungahlin',
  'Braddon',
  'Phillip',
  'Denman Prospect',
  'Barton',
  'Deakin',
  'Forrest'
];

const Filters = ({ filters, setFilters, onSearch }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  const handleReset = () => {
    setFilters({
      suburb: '',
      state: '',
      min_price: '',
      max_price: '',
      bedrooms: '',
      bathrooms: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
        <div className="flex items-center text-sm font-semibold text-gray-800">
          <Filter size={15} className="text-indigo-600 mr-2" />
          <span>Filter Properties</span>
          {hasActiveFilters && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Active Filters
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium text-gray-500 hover:text-indigo-600 flex items-center transition-colors cursor-pointer"
          >
            <RotateCcw size={12} className="mr-1" />
            Reset all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Keyword/Suburb */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Suburb</label>
          <div className="relative">
            <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="suburb"
              list="suburbs-datalist"
              value={filters.suburb}
              onChange={handleChange}
              placeholder="e.g. Point Piper"
              className="w-full pl-8 pr-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <datalist id="suburbs-datalist">
              {COMMON_SUBURBS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        </div>
        
        {/* State */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
          <select
            name="state"
            value={filters.state}
            onChange={handleChange}
            className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="">All States</option>
            <option value="NSW">NSW</option>
            <option value="VIC">VIC</option>
            <option value="QLD">QLD</option>
            <option value="WA">WA</option>
            <option value="SA">SA</option>
            <option value="TAS">TAS</option>
            <option value="ACT">ACT</option>
            <option value="NT">NT</option>
          </select>
        </div>

        {/* Min Price */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Min Price</label>
          <input
            type="number"
            name="min_price"
            value={filters.min_price}
            onChange={handleChange}
            placeholder="Min ($)"
            className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Max Price</label>
          <input
            type="number"
            name="max_price"
            value={filters.max_price}
            onChange={handleChange}
            placeholder="Max ($)"
            className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Bedrooms */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Min Bedrooms</label>
          <select
            name="bedrooms"
            value={filters.bedrooms}
            onChange={handleChange}
            className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="">Any</option>
            <option value="1">1+ Bed</option>
            <option value="2">2+ Beds</option>
            <option value="3">3+ Beds</option>
            <option value="4">4+ Beds</option>
            <option value="5">5+ Beds</option>
          </select>
        </div>

        {/* Bathrooms */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Min Bathrooms</label>
          <select
            name="bathrooms"
            value={filters.bathrooms}
            onChange={handleChange}
            className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="">Any</option>
            <option value="1">1+ Bath</option>
            <option value="2">2+ Baths</option>
            <option value="3">3+ Baths</option>
          </select>
        </div>
      </div>
    </form>
  );
};

export default Filters;
