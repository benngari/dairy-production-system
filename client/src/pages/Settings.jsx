import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import Spinner from '../components/Spinner';
import { useToast } from '../context/ToastContext';

const UNITS = ['Liters', 'Kilograms', 'Grams', 'Milliliters'];

const Settings = () => {
  const { register, handleSubmit, reset } = useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/settings');
        reset(data.settings);
      } catch (err) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await api.put('/settings', values);
      toast.success('Settings updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner full size="lg" />;

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500">Configure company information, default units, and appearance.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <div>
          <label className="label">Company Name</label>
          <input className="input" {...register('companyName')} />
        </div>
        <div>
          <label className="label">Factory Name</label>
          <input className="input" {...register('factoryName')} />
        </div>
        <div>
          <label className="label">Logo URL</label>
          <input className="input" placeholder="https://..." {...register('logoUrl')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Default Milk Unit</label>
            <select className="input" {...register('defaultMilkUnit')}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Theme</label>
            <select className="input" {...register('theme')}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Low Stock Threshold (%)</label>
          <input type="number" className="input" {...register('lowStockThresholdPercent')} />
        </div>
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
