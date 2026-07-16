import { useEffect, useState } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const BatchDetailModal = ({ isOpen, batchId, onClose }) => {
  const [production, setProduction] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/production/${batchId}`);
        setProduction(data.production);
      } catch (err) {
        toast.error('Failed to load batch details');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={production ? `Batch ${production.batchNumber}` : 'Batch Details'} size="md">
      {loading ? (
        <Spinner full />
      ) : production ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 uppercase">Recipe</p>
              <p className="font-semibold text-slate-800">{production.recipeName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Mode</p>
              <p className="font-semibold text-slate-800">
                {production.mode === 'HAVE_MILK' ? 'I Have Milk' : 'I Want To Produce'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Milk Used</p>
              <p className="font-semibold text-slate-800">{production.milkQuantity} L</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Expected Yield</p>
              <p className="font-semibold text-slate-800">{production.expectedYield}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Operator</p>
              <p className="font-semibold text-slate-800">{production.operator?.name || production.operatorName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Date &amp; Time</p>
              <p className="font-semibold text-slate-800">{new Date(production.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {production.notes && (
            <div>
              <p className="text-xs text-slate-400 uppercase">Notes</p>
              <p className="text-sm text-slate-600">{production.notes}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-slate-400 uppercase mb-2">Ingredients Used</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase">
                  <th className="py-1">Ingredient</th>
                  <th className="py-1">%</th>
                  <th className="py-1 text-right">Quantity Deducted</th>
                </tr>
              </thead>
              <tbody>
                {production.ingredients.map((ing, i) => (
                  <tr key={i} className="border-t border-slate-100">
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
        </div>
      ) : null}
    </Modal>
  );
};

export default BatchDetailModal;
