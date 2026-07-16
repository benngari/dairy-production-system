import { useEffect, useState, useCallback } from 'react';
import { FiSearch, FiEye } from 'react-icons/fi';
import api from '../services/api';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';
import BatchDetailModal from '../components/BatchDetailModal';
import { useToast } from '../context/ToastContext';

const ProductionHistory = () => {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [detailTarget, setDetailTarget] = useState(null);

  const toast = useToast();

  const fetchProductions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/production', {
        params: { search, startDate: startDate || undefined, endDate: endDate || undefined, page, limit: 10 },
      });
      setProductions(data.productions);
      setPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      toast.error('Failed to load production history');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, startDate, endDate, page]);

  useEffect(() => {
    fetchProductions();
  }, [fetchProductions]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Production History</h1>
        <p className="text-sm text-slate-500">Full record of every production batch, searchable and filterable.</p>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="input pl-9"
            placeholder="Search by batch number or recipe..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <input
          type="date"
          className="input sm:w-44"
          value={startDate}
          onChange={(e) => {
            setPage(1);
            setStartDate(e.target.value);
          }}
        />
        <input
          type="date"
          className="input sm:w-44"
          value={endDate}
          onChange={(e) => {
            setPage(1);
            setEndDate(e.target.value);
          }}
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner full />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base w-full">
              <thead>
                <tr>
                  <th>Batch Number</th>
                  <th>Recipe</th>
                  <th>Mode</th>
                  <th>Milk Used</th>
                  <th>Operator</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {productions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-slate-400 py-8">
                      No production batches found.
                    </td>
                  </tr>
                )}
                {productions.map((p) => (
                  <tr key={p._id}>
                    <td className="font-medium text-slate-800">{p.batchNumber}</td>
                    <td>{p.recipeName}</td>
                    <td>{p.mode === 'HAVE_MILK' ? 'I Have Milk' : 'I Want To Produce'}</td>
                    <td>{p.milkQuantity} L</td>
                    <td>{p.operator?.name || p.operatorName}</td>
                    <td>{new Date(p.createdAt).toLocaleString()}</td>
                    <td>
                      <div className="flex justify-end">
                        <button className="btn-ghost !px-2" onClick={() => setDetailTarget(p)}>
                          <FiEye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
      </div>

      {detailTarget && (
        <BatchDetailModal isOpen={!!detailTarget} batchId={detailTarget._id} onClose={() => setDetailTarget(null)} />
      )}
    </div>
  );
};

export default ProductionHistory;
