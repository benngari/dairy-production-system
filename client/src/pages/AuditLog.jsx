import React, { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';

const ENTITY_TYPES = ['All', 'Production', 'Ingredient', 'Packaging', 'Recipe', 'Settings', 'User'];

const ACTION_COLORS = {
  create: 'text-green-600',
  update: 'text-blue-600',
  delete: 'text-red-600',
  restore: 'text-green-600',
  permanent_delete: 'text-red-800 font-bold',
  role_change: 'text-purple-600',
  password_reset: 'text-orange-600',
  activate: 'text-green-600',
  deactivate: 'text-red-600',
  stock_adjust: 'text-gray-600'
};

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = filter !== 'All' ? `?entityType=${filter}` : '';
      const res = await api.get(`/audit-log${params}`);
      setLogs(res.data || []);
    } catch (err) {
      toast.error('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Audit Log</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {ENTITY_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1 rounded text-sm ${filter === t ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full bg-white shadow rounded">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Date/Time</th>
              <th className="text-left">User</th>
              <th className="text-left">Action</th>
              <th className="text-left">Entity</th>
              <th className="text-left">Label</th>
              <th className="text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log._id} className="border-b">
                <td className="p-2 text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="text-sm">{log.userName}</td>
                <td className={`text-sm capitalize ${ACTION_COLORS[log.action] || ''}`}>{log.action.replace('_', ' ')}</td>
                <td className="text-sm">{log.entityType}</td>
                <td className="text-sm">{log.entityLabel}</td>
                <td className="text-sm text-gray-500">{log.details || '-'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan="6" className="p-4 text-center text-gray-500">No activity recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AuditLog;