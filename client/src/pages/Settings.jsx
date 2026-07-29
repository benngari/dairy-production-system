import React, { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';

const YOGHURT_SIZES = ['500ml', '1L', '2L', '3L', '5L'];
const MALA_SIZES = ['1L', '2L', '3L', '5L'];

const Settings = () => {
  const [settings, setSettings] = useState({
    sellingPrices: { yoghurt: {}, mala: {} }
  });

  useEffect(() => {
    api.get('/settings').then(res => setSettings(res.data));
  }, []);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handlePriceChange = (product, size, value) => {
    setSettings({
      ...settings,
      sellingPrices: {
        ...settings.sellingPrices,
        [product]: {
          ...settings.sellingPrices?.[product],
          [size]: value === '' ? null : parseFloat(value)
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings', settings);
      toast.success('Settings updated');
    } catch (err) {
      toast.error('Error updating settings');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium">Company Name</label>
          <input name="companyName" value={settings.companyName || ''} onChange={handleChange} className="border p-2 rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Address</label>
          <input name="address" value={settings.address || ''} onChange={handleChange} className="border p-2 rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input name="phone" value={settings.phone || ''} onChange={handleChange} className="border p-2 rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input name="email" value={settings.email || ''} onChange={handleChange} className="border p-2 rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Currency</label>
          <input name="currency" value={settings.currency || ''} onChange={handleChange} className="border p-2 rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Culture Cost per Sachet (KSh)</label>
          <input
            name="cultureCostPerSachet"
            type="number"
            value={settings.cultureCostPerSachet || ''}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Used only if no "Culture" ingredient with a unit cost exists in Inventory.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium">Labour Cost per Batch (KSh)</label>
          <input
            name="labourCostPerBatch"
            type="number"
            value={settings.labourCostPerBatch ?? ''}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Flat labour cost added to every Yoghurt/Mala batch, regardless of size.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Yoghurt Selling Prices (KSh)</h3>
          <div className="grid grid-cols-5 gap-2">
            {YOGHURT_SIZES.map(size => (
              <div key={size}>
                <label className="block text-xs text-gray-500">{size}</label>
                <input
                  type="number"
                  value={settings.sellingPrices?.yoghurt?.[size] ?? ''}
                  onChange={(e) => handlePriceChange('yoghurt', size, e.target.value)}
                  placeholder={size === '2L' ? 'TBD' : ''}
                  className="border p-2 rounded w-full"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Mala Selling Prices (KSh)</h3>
          <div className="grid grid-cols-4 gap-2">
            {MALA_SIZES.map(size => (
              <div key={size}>
                <label className="block text-xs text-gray-500">{size}</label>
                <input
                  type="number"
                  value={settings.sellingPrices?.mala?.[size] ?? ''}
                  onChange={(e) => handlePriceChange('mala', size, e.target.value)}
                  placeholder={size === '2L' ? 'TBD' : ''}
                  className="border p-2 rounded w-full"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">2L prices are left blank until the client confirms them.</p>
        </div>

        <div>
          <label className="block text-sm font-medium">Theme</label>
          <select name="theme" value={settings.theme || 'light'} onChange={handleChange} className="border p-2 rounded w-full">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Save Settings</button>
      </form>
    </div>
  );
};

export default Settings;