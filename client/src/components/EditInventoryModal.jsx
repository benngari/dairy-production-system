import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const EditInventoryModal = ({ isOpen, item, onClose, onSaved }) => {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      stock: item.stock,
      minimumStock: item.minimumStock,
      supplier: item.supplier || '',
      reason: '',
    },
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await api.put(`/inventory/${item._id}`, {
        stock: Number(values.stock),
        minimumStock: Number(values.minimumStock),
        supplier: values.supplier,
        reason: values.reason,
      });
      toast.success('Inventory updated successfully');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update inventory');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit — ${item.ingredient?.name}`} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Stock Quantity ({item.unit})</label>
          <input type="number" step="0.01" className="input" {...register('stock', { required: true, min: 0 })} />
        </div>
        <div>
          <label className="label">Minimum Stock ({item.unit})</label>
          <input type="number" step="0.01" className="input" {...register('minimumStock', { required: true, min: 0 })} />
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

export default EditInventoryModal;
