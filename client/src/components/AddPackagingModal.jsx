import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const PACKAGE_SIZES = ['500ml', '1L', '2L', '3L', '5L'];

const AddPackagingModal = ({ isOpen, onClose, onSaved }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { size: '1L', minimumStock: 0, unitCost: 0 },
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await api.post('/packaging', {
        ...values,
        minimumStock: Number(values.minimumStock),
        unitCost: Number(values.unitCost) || 0,
      });
      toast.success('Packaging type added successfully');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add packaging type');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Packaging Type" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Bottle Name</label>
          <input className="input" placeholder="e.g. Yogurt Bottle, Mala Bottle" {...register('name', { required: 'Name is required' })} />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Size</label>
          <select className="input" {...register('size', { required: true })}>
            {PACKAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Unit Cost (cost per bottle)</label>
          <input type="number" step="0.01" className="input" {...register('unitCost', { min: 0 })} />
        </div>
        <div>
          <label className="label">Minimum Stock (for low stock alerts)</label>
          <input type="number" step="1" className="input" {...register('minimumStock', { min: 0 })} />
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
            {saving ? 'Saving...' : 'Add Packaging'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddPackagingModal;