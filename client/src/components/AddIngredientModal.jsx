import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const UNITS = ['Liters', 'Kilograms', 'Grams', 'Milliliters'];

const AddIngredientModal = ({ isOpen, onClose, onSaved }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { unit: 'Kilograms', minimumStock: 0 },
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await api.post('/ingredients', {
        ...values,
        minimumStock: Number(values.minimumStock),
      });
      toast.success('Ingredient added successfully');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add ingredient');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Ingredient" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Ingredient Name</label>
          <input className="input" placeholder="e.g. Sugar" {...register('name', { required: 'Name is required' })} />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Category</label>
          <input className="input" placeholder="e.g. Sweetener, Additive, Culture" {...register('category', { required: 'Category is required' })} />
          {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
        </div>
        <div>
          <label className="label">Unit</label>
          <select className="input" {...register('unit', { required: true })}>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Minimum Stock (for low stock alerts)</label>
          <input type="number" step="0.01" className="input" {...register('minimumStock', { min: 0 })} />
        </div>
        <div>
          <label className="label">Supplier (optional)</label>
          <input className="input" placeholder="Supplier name" {...register('supplier')} />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Add Ingredient'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddIngredientModal;
