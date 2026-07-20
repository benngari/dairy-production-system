import { useEffect, useState } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const typeStyles = {
  IN: 'bg-secondary-50 text-secondary-700',
  OUT: 'bg-red-50 text-red-700',
  ADJUSTMENT: 'bg-amber-50 text-amber-700',
};

const PackagingTransactionHistoryModal = ({ isOpen, itemId, onClose }) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/packaging/${itemId}`);
        setItem(data.item);
      } catch (err) {
        toast.error('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const transactions = item?.transactions ? [...item.transactions].reverse() : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Transaction History${item ? ' — ' + item.name : ''}`} size="md">
      {loading ? (
        <Spinner full />
      ) : transactions.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No transactions recorded yet.</p>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-2">
          {transactions.map((t) => (
            <div key={t._id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
              <div>
                <span className={`badge ${typeStyles[t.type]}`}>{t.type}</span>
                <p className="text-sm text-slate-600 mt-1">{t.reason || 'No reason provided'}</p>
                {t.reference && <p className="text-xs text-slate-400">Ref: {t.reference}</p>}
              </div>
              <div className="text-right">
                <p className={`font-semibold ${t.quantity < 0 ? 'text-red-600' : 'text-secondary-600'}`}>
                  {t.quantity > 0 ? '+' : ''}
                  {t.quantity} bottles
                </p>
                <p className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleString()}</p>
                {t.performedBy?.name && <p className="text-xs text-slate-400">by {t.performedBy.name}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default PackagingTransactionHistoryModal;