import { useState } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const RecipePreviewModal = ({ isOpen, recipe, onClose }) => {
  const [mode, setMode] = useState('HAVE_MILK');
  const [quantity, setQuantity] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handlePreview = async () => {
    if (!quantity || Number(quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post(`/recipes/${recipe._id}/preview`, { mode, quantity: Number(quantity) });
      setResult(data.result);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to calculate preview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Preview Calculation - ${recipe.name}`} size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              mode === 'HAVE_MILK' ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500'
            }`}
            onClick={() => {
              setMode('HAVE_MILK');
              setResult(null);
            }}
          >
            I Have Milk
          </button>
          <button
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              mode === 'WANT_TO_PRODUCE' ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500'
            }`}
            onClick={() => {
              setMode('WANT_TO_PRODUCE');
              setResult(null);
            }}
          >
            I Want To Produce
          </button>
        </div>

        <div>
          <label className="label">{mode === 'HAVE_MILK' ? 'Milk Quantity (Liters)' : 'Desired Finished Product Quantity'}</label>
          <div className="flex gap-2">
            <input
              type="number"
              className="input"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <button className="btn-primary whitespace-nowrap" onClick={handlePreview} disabled={loading}>
              {loading ? 'Calculating...' : 'Calculate'}
            </button>
          </div>
        </div>

        {result && (
          <div className="rounded-lg bg-slate-50 p-4 space-y-3">
            {mode === 'HAVE_MILK' ? (
              <p className="text-sm text-slate-600">
                Expected Yield: <span className="font-semibold">{result.expectedYield}</span>
              </p>
            ) : (
              <p className="text-sm text-slate-600">
                Required Milk: <span className="font-semibold">{result.requiredMilk} Liters</span>
              </p>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase">
                  <th className="py-1">Ingredient</th>
                  <th className="py-1">%</th>
                  <th className="py-1 text-right">Required Quantity</th>
                </tr>
              </thead>
              <tbody>
                {result.ingredients.map((ing, i) => (
                  <tr key={i} className="border-t border-slate-200">
                    <td className="py-1.5">{ing.name}</td>
                    <td className="py-1.5">{ing.percentage}%</td>
                    <td className="py-1.5 text-right font-medium">
                      {ing.requiredQuantity} {ing.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RecipePreviewModal;
