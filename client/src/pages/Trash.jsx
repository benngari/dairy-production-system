import React, { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';

const CATEGORY_TABS = [
  { id: 'ingredients', label: 'Ingredients', endpoint: '/ingredients', labelFn: (item) => item.name },
  { id: 'packaging', label: 'Packaging', endpoint: '/packaging', labelFn: (item) => item.size },
  { id: 'recipes', label: 'Recipes', endpoint: '/recipes', labelFn: (item) => item.name },
  { id: 'dailyStock', label: 'Daily Stock', endpoint: '/daily-stock', labelFn: (item) => `${item.productType} ${item.size} - ${new Date(item.date).toLocaleDateString()}` }
];
const TABS = [{ id: 'all', label: 'All' }, ...CATEGORY_TABS];

const Trash = () => {
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrash();
  }, [tab]);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      if (tab === 'all') {
        const results = await Promise.all(
          CATEGORY_TABS.map(t => api.get(`${t.endpoint}/trash`).then(res => (res.data || []).map(item => ({ ...item, _category: t.id, _endpoint: t.endpoint, _label: t.labelFn(item) }))))
        );
        const merged = results.flat().sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
        setItems(merged);
      } else {
        const activeTab = CATEGORY_TABS.find(t => t.id === tab);
        const res = await api.get(`${activeTab.endpoint}/trash`);
        setItems((res.data || []).map(item => ({ ...item, _category: tab, _endpoint: activeTab.endpoint, _label: activeTab.labelFn(item) })));
      }
    } catch (err) {
      toast.error('Failed to load trash');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (item) => {
    try {
      await api.patch(`${item._endpoint}/${item._id}/restore`);
      toast.success('Restored');
      fetchTrash();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error restoring item');
    }
  };

  const handlePermanentDelete = async (item) => {
    if (!window.confirm('Permanently delete this item? This cannot be undone.')) return;
    try {
      await api.delete(`${item._endpoint}/${item._id}/permanent`);
      toast.success('Permanently deleted');
      fetchTrash();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting item');
    }
  };

  const categoryLabel = (id) => CATEGORY_TABS.find(t => t.id === id)?.label || id;

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
              {tab === 'all' && <th className="p-2 text-left">Category</th>}
              <th className={tab === 'all' ? 'text-left' : 'p-2 text-left'}>Item</th>
              <th className="text-left">Deleted By</th>
              <th className="text-left">Deleted At</th>
              <th className="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={`${item._category}-${item._id}`} className="border-b">
                {tab === 'all' && <td className="p-2 text-xs text-gray-500">{categoryLabel(item._category)}</td>}
                <td className={tab === 'all' ? '' : 'p-2'}>{item._label}</td>
                <td className="text-sm text-gray-500">{item.deletedBy?.name || 'Unknown'}</td>
                <td className="text-sm text-gray-500">{item.deletedAt ? new Date(item.deletedAt).toLocaleString() : '-'}</td>
                <td>
                  <button onClick={() => handleRestore(item)} className="text-green-600 text-sm mr-3 hover:underline">Restore</button>
                  <button onClick={() => handlePermanentDelete(item)} className="text-red-700 text-sm font-semibold hover:underline">Delete Forever</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={tab === 'all' ? 5 : 4} className="p-4 text-center text-gray-500">Trash is empty.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Trash;