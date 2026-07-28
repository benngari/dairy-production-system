import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ROLES = ['Administrator', 'Manager', 'Production Operator', 'Store Keeper'];

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
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

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <table className="min-w-full bg-white shadow rounded">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Name</th>
            <th className="text-left">Email</th>
            <th className="text-left">Role</th>
            <th className="text-left">Status</th>
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
              <td className="text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              <td>
                <button
                  onClick={() => handleToggleActive(u._id, u.isActive !== false)}
                  disabled={u._id === currentUser?.id}
                  className={`text-sm ${u.isActive !== false ? 'text-red-600' : 'text-green-600'} disabled:text-gray-300`}
                >
                  {u.isActive !== false ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-2">
        You can't change your own role or deactivate your own account — ask another Administrator if you need that changed.
      </p>
    </div>
  );
};

export default Users;