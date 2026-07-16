import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const AddStockModal = ({ isOpen, item, onClose, onSaved }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await api.post(`/inventory/${item._id}/add-stock`, {
        quantity: Number(values.quantity),
        reason: values.reason,
      });
      toast.success('Stock added successfully');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add stock');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Stock — ${item.ingredient?.name}`} size="sm">
      <p className="text-sm text-slate-500 mb-4">
        Current stock: <span className="font-semibold text-slate-700">{item.stock} {item.unit}</span>
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Quantity to Add ({item.unit})</label>
          <input
            type="number"
            step="0.01"
            className="input"
            {...register('quantity', { required: 'Quantity is required', min: { value: 0.01, message: 'Must be positive' } })}
          />
          {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
        </div>
        <div>
          <label className="label">Reason / Reference (optional)</label>
          <input className="input" placeholder="e.g. Purchase order #123" {...register('reason')} />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-secondary">
            {saving ? 'Adding...' : 'Add Stock'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddStockModal;
