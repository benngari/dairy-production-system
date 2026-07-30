import React, { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'ingredients', label: 'Ingredients', endpoint: '/ingredients', nameField: 'name' },
  { id: 'packaging', label: 'Packaging', endpoint: '/packaging', nameField: 'size' },
  { id: 'recipes', label: 'Recipes', endpoint: '/recipes', nameField: 'name' }
];

const Trash = () => {
  const [tab, setTab] = useState('ingredients');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeTab = TABS.find(t => t.id === tab);

  useEffect(() => {
    fetchTrash();
  }, [tab]);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await api.get(`${activeTab.endpoint}/trash`);
      setItems(res.data || []);
    } catch (err) {
      toast.error('Failed to load trash');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.patch(`${activeTab.endpoint}/${id}/restore`);
      toast.success('Restored');
      fetchTrash();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error restoring item');
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Permanently delete this item? This cannot be undone.')) return;
    try {
      await api.delete(`${activeTab.endpoint}/${id}/permanent`);
      toast.success('Permanently deleted');
      fetchTrash();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting item');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Trash</h1>
      <p className="text-sm text-gray-500 mb-4">
        Deleted items are kept here until permanently removed. Production batches are not included — deleting a batch immediately restores its stock and cannot be undone from here.
      </p>

      <div className="flex space-x-2 mb-4">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1 rounded text-sm ${tab === t.id ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full bg-white shadow rounded">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Name</th>
              <th className="text-left">Deleted By</th>
              <th className="text-left">Deleted At</th>
              <th className="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item._id} className="border-b">
                <td className="p-2">{item[activeTab.nameField]}</td>
                <td className="text-sm text-gray-500">{item.deletedBy?.name || 'Unknown'}</td>
                <td className="text-sm text-gray-500">{item.deletedAt ? new Date(item.deletedAt).toLocaleString() : '-'}</td>
                <td>
                  <button onClick={() => handleRestore(item._id)} className="text-green-600 text-sm mr-3 hover:underline">Restore</button>
                  <button onClick={() => handlePermanentDelete(item._id)} className="text-red-700 text-sm font-semibold hover:underline">Delete Forever</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan="4" className="p-4 text-center text-gray-500">Trash is empty.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Trash;