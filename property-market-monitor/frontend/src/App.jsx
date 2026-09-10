import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import PropertyDetails from './pages/PropertyDetails';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary title="Application Error">
      <Router>
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-auto">
            <ErrorBoundary title="Page Load Error">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/property/:id" element={<PropertyDetails />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

