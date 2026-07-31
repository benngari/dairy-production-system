import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ROLES = ['Administrator', 'Manager', 'Production Operator', 'Store Keeper'];

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async ({ isManualRefresh = false } = {}) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data || []);
      if (isManualRefresh) toast.success('User list refreshed');
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  const isOnline = (u) => {
    if (!u.lastActiveAt) return false;
    return (Date.now() - new Date(u.lastActiveAt).getTime()) < 5 * 60 * 1000;
  };

  const handleRoleChange = async (id, role) => {
    try {
      await api.patch(`/users/${id}/role`, { role });
      toast.success('Role updated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating role');
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await api.patch(`/users/${id}/status`, { isActive: !isActive });
      toast.success(!isActive ? 'User activated' : 'User deactivated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch(`/users/${resetTarget._id}/password`, { newPassword });
      toast.success(res.data.message || 'Password reset');
      setResetTarget(null);
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error resetting password');
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={() => fetchUsers({ isManualRefresh: true })}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
        >
          {refreshing && (
            <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block" />
          )}
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold">i</span>
        "Online" reflects activity in the last 5 minutes — it's a proxy, not a live/real-time connection. Use Refresh to get the latest status.
      </p>

      <table className="min-w-full bg-white shadow rounded">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Name</th>
            <th className="text-left">Email</th>
            <th className="text-left">Role</th>
            <th className="text-left">Status</th>
            <th className="text-left" title="Active within the last 5 minutes — not real-time">Online</th>
            <th className="text-left">Last Login</th>
            <th className="text-left">Joined</th>
            <th className="text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id} className="border-b">
              <td className="p-2">{u.name} {u._id === currentUser?.id && <span className="text-xs text-gray-400">(you)</span>}</td>
              <td>{u.email}</td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                  disabled={u._id === currentUser?.id}
                  className="border p-1 rounded text-sm disabled:bg-gray-100"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
              <td>
                <span className={u.isActive !== false ? 'text-green-600' : 'text-red-600'}>
                  {u.isActive !== false ? 'Active' : 'Deactivated'}
                </span>
              </td>
              <td>
                {isOnline(u) ? (
                  <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">Offline</span>
                )}
              </td>
              <td className="text-sm text-gray-500">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</td>
              <td className="text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              <td className="space-x-3">
                <button
                  onClick={() => handleToggleActive(u._id, u.isActive !== false)}
                  disabled={u._id === currentUser?.id}
                  className={`text-sm ${u.isActive !== false ? 'text-red-600' : 'text-green-600'} disabled:text-gray-300`}
                >
                  {u.isActive !== false ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => { setResetTarget(u); setNewPassword(''); }} className="text-sm text-blue-600 hover:underline">
                  Reset Password
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-2">
        You can't change your own role or deactivate your own account — ask another Administrator if you need that changed.
      </p>

      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-1">Reset Password</h3>
            <p className="text-sm text-gray-500 mb-4">For {resetTarget.name} ({resetTarget.email})</p>
            <form onSubmit={handleResetPassword}>
              <input
                type="text"
                placeholder="New password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border rounded mb-4"
                minLength={6}
                required
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setResetTarget(null); setNewPassword(''); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                  Set Password
                </button>
              </div>
            </form>
            <p className="text-xs text-gray-400 mt-3">Share this password with the user directly — it won't be shown again here.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;