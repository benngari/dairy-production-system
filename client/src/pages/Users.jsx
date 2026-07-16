import { useEffect, useState, useCallback } from 'react';
import { FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import api from '../services/api';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const ROLES = ['Administrator', 'Production Operator', 'Store Keeper', 'Manager'];

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();
  const { user: currentUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data.users);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (id, role) => {
    try {
      await api.put(`/auth/users/${id}`, { role });
      toast.success('Role updated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleActive = async (u) => {
    try {
      await api.put(`/auth/users/${u._id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/auth/users/${deleteTarget._id}`);
      toast.success('User deleted');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Users</h1>
        <p className="text-sm text-slate-500">Manage user accounts, roles, and access.</p>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner full />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="font-medium text-slate-800">{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        className="input !py-1 !text-xs w-44"
                        value={u.role}
                        disabled={u._id === currentUser.id}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <Badge>{u.isActive ? 'Active' : 'Disabled'}</Badge>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        <button
                          className="btn-ghost !px-2"
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                          disabled={u._id === currentUser.id}
                          onClick={() => handleToggleActive(u)}
                        >
                          {u.isActive ? <FiToggleRight size={18} className="text-secondary-500" /> : <FiToggleLeft size={18} />}
                        </button>
                        <button
                          className="btn-ghost !px-2 text-red-500"
                          title="Delete"
                          disabled={u._id === currentUser.id}
                          onClick={() => setDeleteTarget(u)}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
};

export default Users;
