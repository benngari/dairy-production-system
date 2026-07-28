import React, { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const BOTTLE_SIZES = ['500ml', '1L', '2L', '3L', '5L'];

const Packaging = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ size: '500ml', stock: 0, minStock: 10, unitCost: 0, supplier: '' });
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const res = await api.get('/packaging');
    setItems(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/packaging/${editing}`, form);
        toast.success('Updated');
      } else {
        await api.post('/packaging', form);
        toast.success('Added');
      }
      fetchItems();
      setForm({ size: '500ml', stock: 0, minStock: 10, unitCost: 0, supplier: '' });
      setEditing(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleAdjust = async (id, quantity) => {
    await api.patch(`/packaging/${id}/stock`, { quantity, note: 'Manual' });
    fetchItems();
    toast.success('Stock adjusted');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this packaging size? This cannot be undone.')) return;
    try {
      await api.delete(`/packaging/${id}`);
      toast.success('Packaging deleted');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting packaging');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Bottle / Packaging Inventory</h1>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-3 gap-4">
        <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="border p-2 rounded">
          {BOTTLE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({...form, stock: parseFloat(e.target.value)})} className="border p-2 rounded" />
        <input type="number" placeholder="Min Stock" value={form.minStock} onChange={(e) => setForm({...form, minStock: parseFloat(e.target.value)})} className="border p-2 rounded" />
        <input type="text" placeholder="Supplier" value={form.supplier} onChange={(e) => setForm({...form, supplier: e.target.value})} className="border p-2 rounded" />
        <input type="number" placeholder="Unit Cost" value={form.unitCost} onChange={(e) => setForm({...form, unitCost: parseFloat(e.target.value)})} className="border p-2 rounded" />
        <button type="submit" className="col-span-3 bg-green-600 text-white px-4 py-2 rounded">{editing ? 'Update' : 'Add'} Packaging</button>
      </form>

      <table className="min-w-full bg-white shadow rounded">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Size</th>
            <th>Opening Stock</th>
            <th>Current Stock</th>
            <th>Min</th>
            <th>Supplier</th>
            <th>Cost</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item._id} className="border-b">
              <td className="p-2">{item.size}</td>
              <td>{item.openingStock ?? '-'}</td>
              <td className={item.stock < item.minStock ? 'text-red-600' : ''}>{item.stock}</td>
              <td>{item.minStock}</td>
              <td>{item.supplier}</td>
              <td>{item.unitCost}</td>
              <td>
                <button onClick={() => { setEditing(item._id); setForm(item); }} className="text-blue-600 mr-2">Edit</button>
                <button onClick={() => handleAdjust(item._id, 10)} className="text-green-600 mr-2">+10</button>
                <button onClick={() => handleAdjust(item._id, -10)} className="text-red-600 mr-2">-10</button>
                {user?.role === 'Administrator' && (
                  <button onClick={() => handleDelete(item._id)} className="text-red-800 font-semibold">Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Packaging;