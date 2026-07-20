import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { PACKAGE_SIZES } from './AddPackagingModal';

const EditPackagingModal = ({ isOpen, item, onClose, onSaved }) => {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: item.name,
      size: item.size,
      stock: item.stock,
      minimumStock: item.minimumStock,
      unitCost: item.unitCost || 0,
      supplier: item.supplier || '',
      reason: '',
    },
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await api.put(`/packaging/${item._id}`, {
        name: values.name,
        size: values.size,
        stock: Number(values.stock),
        minimumStock: Number(values.minimumStock),
        unitCost: Number(values.unitCost) || 0,
        supplier: values.supplier,
        reason: values.reason,
      });
      toast.success('Packaging updated successfully');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update packaging');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit — ${item.name}`} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Bottle Name</label>
          <input className="input" {...register('name', { required: true })} />
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
          <label className="label">Stock Quantity (bottles)</label>
          <input type="number" step="1" className="input" {...register('stock', { required: true, min: 0 })} />
        </div>
        <div>
          <label className="label">Minimum Stock (bottles)</label>
          <input type="number" step="1" className="input" {...register('minimumStock', { required: true, min: 0 })} />
        </div>
        <div>
          <label className="label">Unit Cost (cost per bottle)</label>
          <input type="number" step="0.01" className="input" {...register('unitCost', { min: 0 })} />
        </div>
        <div>
          <label className="label">Supplier</label>
          <input className="input" {...register('supplier')} />
        </div>
        <div>
          <label className="label">Reason for adjustment (if stock changed)</label>
          <input className="input" placeholder="e.g. Stock count correction" {...register('reason')} />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditPackagingModal;