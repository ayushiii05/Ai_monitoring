import React, { useState, useEffect } from 'react';
import { monitoringApi } from '../../services/api';
import { Server, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MonitoringHealth = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const data = await monitoringApi.getStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch status', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Checking system health...</div>;
  }

  if (!status) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center">
          <Server className="text-gray-600 mr-2" size={24} />
          <h2 className="text-lg font-semibold text-gray-900">System Health & Worker Status</h2>
        </div>
        <div className="flex items-center">
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-green-700">API Online</span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500 mb-1 flex items-center"><Activity size={16} className="mr-1"/> Engine Status</p>
            <p className="text-xl font-bold text-gray-900">{status.engine_status}</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500 mb-1 flex items-center"><CheckCircle size={16} className="text-green-500 mr-1"/> Active Monitors</p>
            <p className="text-xl font-bold text-gray-900">{status.total_monitored}</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500 mb-1 flex items-center"><Clock size={16} className="text-blue-500 mr-1"/> Pending Checks</p>
            <p className="text-xl font-bold text-gray-900">{status.pending_checks}</p>
          </div>
        </div>

        <h3 className="text-md font-semibold text-gray-900 mb-4">Latest Synchronization Logs</h3>
        {status.recent_logs && status.recent_logs.length > 0 ? (
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {status.recent_logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ID: {log.listing_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.status === 'success' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Success
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.completed_at ? formatDistanceToNow(new Date(log.completed_at), { addSuffix: true }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {log.error_message || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No recent sync logs found.</p>
        )}
      </div>
    </div>
  );
};

export default MonitoringHealth;
