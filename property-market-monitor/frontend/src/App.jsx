import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import PropertyDetails from './pages/PropertyDetails';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
