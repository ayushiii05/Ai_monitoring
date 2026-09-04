import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Bell, Settings, Search } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-900 text-white flex-shrink-0 min-h-screen hidden md:block">
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <Search className="text-indigo-400 mr-2" size={24} />
        <span className="text-lg font-bold">Market Monitor</span>
      </div>
      
      <div className="py-6">
        <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Main Menu
        </div>
        <nav className="space-y-1 px-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
            Dashboard
          </NavLink>
          

        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
