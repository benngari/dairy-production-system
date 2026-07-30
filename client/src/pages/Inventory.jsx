import React, { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

const Inventory = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', unit: '', stock: 0, minStock: 10, supplier: '', unitCost: 0 });
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/ingredients');
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/ingredients/${editing}`, form);
        toast.success('Updated');
      } else {
        await api.post('/ingredients', form);
        toast.success('Added');
      }
      fetchItems();
      setForm({ name: '', unit: '', stock: 0, minStock: 10, supplier: '', unitCost: 0 });
      setEditing(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleAdjust = async (id, quantity) => {
    await api.patch(`/ingredients/${id}/stock`, { quantity, note: 'Manual adjustment' });
    fetchItems();
    toast.success('Stock adjusted');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Move this ingredient to trash?')) return;
    try {
      await api.delete(`/ingredients/${id}`);
      toast.success('Moved to trash');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting ingredient');
    }
  };

  return (
    <div>
      <h1 className="page-title">Inventory</h1>

      <form onSubmit={handleSubmit} className="app-card mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label-field">Name</label>
          <input type="text" placeholder="e.g. Sugar" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" required />
        </div>
        <div>
          <label className="label-field">Unit</label>
          <input type="text" placeholder="e.g. kg" value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} className="input-field" required />
        </div>
        <div>
          <label className="label-field">Stock</label>
          <input type="number" value={form.stock} onChange={(e) => setForm({...form, stock: parseFloat(e.target.value)})} className="input-field" />
        </div>
        <div>
          <label className="label-field">Min Stock</label>
          <input type="number" value={form.minStock} onChange={(e) => setForm({...form, minStock: parseFloat(e.target.value)})} className="input-field" />
        </div>
        <div>
          <label className="label-field">Supplier</label>
          <input type="text" value={form.supplier} onChange={(e) => setForm({...form, supplier: e.target.value})} className="input-field" />
        </div>
        <div>
          <label className="label-field">Unit Cost (KSh)</label>
          <input type="number" value={form.unitCost} onChange={(e) => setForm({...form, unitCost: parseFloat(e.target.value)})} className="input-field" />
        </div>
        <div className="sm:col-span-3">
          <button type="submit" className="btn-primary">{editing ? 'Update' : 'Add'} Ingredient</button>
          {editing && (
            <button
              type="button"
              onClick={() => { setEditing(null); setForm({ name: '', unit: '', stock: 0, minStock: 10, supplier: '', unitCost: 0 }); }}
              className="btn-secondary ml-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <Spinner label="Loading inventory..." />
      ) : items.length === 0 ? (
        <EmptyState icon="📦" title="No ingredients yet" subtitle="Add your first ingredient above to start tracking stock." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Unit</th>
                <th>Stock</th>
                <th>Min</th>
                <th>Supplier</th>
                <th>Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id}>
                  <td className="font-medium">{item.name}</td>
                  <td>{item.unit}</td>
                  <td className={item.stock < item.minStock ? 'text-red-600 font-medium' : ''}>{item.stock}</td>
                  <td>{item.minStock}</td>
                  <td>{item.supplier}</td>
                  <td>KSh {item.unitCost}</td>
                  <td className="space-x-2">
                    <button onClick={() => { setEditing(item._id); setForm(item); }} className="text-blue-600 text-sm hover:underline">Edit</button>
                    <button onClick={() => handleAdjust(item._id, 10)} className="text-green-600 text-sm hover:underline">+10</button>
                    <button onClick={() => handleAdjust(item._id, -10)} className="text-red-600 text-sm hover:underline">-10</button>
                    {user?.role === 'Administrator' && (
                      <button onClick={() => handleDelete(item._id)} className="btn-danger-text">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Inventory;