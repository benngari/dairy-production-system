import { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiClock, FiAlertTriangle } from 'react-icons/fi';
import api from '../services/api';
import Spinner from '../components/Spinner';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import AddIngredientModal from '../components/AddIngredientModal';
import AddStockModal from '../components/AddStockModal';
import EditInventoryModal from '../components/EditInventoryModal';
import TransactionHistoryModal from '../components/TransactionHistoryModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [addIngredientOpen, setAddIngredientOpen] = useState(false);
  const [addStockTarget, setAddStockTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const toast = useToast();
  const { hasRole } = useAuth();
  const canManage = hasRole('Administrator', 'Manager', 'Store Keeper');
  const canDelete = hasRole('Administrator', 'Manager');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/inventory', {
        params: { search, lowStockOnly: lowStockOnly || undefined, page, limit: 10 },
      });
      setItems(data.inventory);
      setPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, lowStockOnly, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async () => {
    try {
      await api.delete(`/inventory/${deleteTarget._id}`);
      toast.success('Inventory record deleted');
      setDeleteTarget(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory</h1>
          <p className="text-sm text-slate-500">Manage ingredient stock, suppliers, and transaction history.</p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={() => setAddIngredientOpen(true)}>
            <FiPlus /> Add Ingredient
          </button>
        )}
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="input pl-9"
            placeholder="Search ingredients..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 whitespace-nowrap">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => {
              setPage(1);
              setLowStockOnly(e.target.checked);
            }}
          />
          Low stock only
        </label>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner full />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base w-full">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Minimum</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-slate-400 py-8">
                      No inventory items found.
                    </td>
                  </tr>
                )}
                {items.map((item) => {
                  const isLow = item.stock <= item.minimumStock;
                  return (
                    <tr key={item._id} className={isLow ? 'bg-red-50/50' : ''}>
                      <td className="font-medium text-slate-800">{item.ingredient?.name}</td>
                      <td>{item.ingredient?.category}</td>
                      <td>
                        {item.stock} {item.unit}
                      </td>
                      <td>
                        {item.minimumStock} {item.unit}
                      </td>
                      <td>{item.supplier || '-'}</td>
                      <td>
                        {isLow ? (
                          <span className="badge bg-red-50 text-red-700 flex items-center gap-1 w-fit">
                            <FiAlertTriangle size={12} /> Low Stock
                          </span>
                        ) : (
                          <span className="badge bg-secondary-50 text-secondary-700">In Stock</span>
                        )}
                      </td>
                      <td>
                        <div className="flex justify-end gap-1.5">
                          <button className="btn-ghost !px-2" title="Transaction history" onClick={() => setHistoryTarget(item)}>
                            <FiClock size={16} />
                          </button>
                          {canManage && (
                            <>
                              <button className="btn-outline !py-1.5 !px-3 text-xs" onClick={() => setAddStockTarget(item)}>
                                Add Stock
                              </button>
                              <button className="btn-ghost !px-2" title="Edit" onClick={() => setEditTarget(item)}>
                                <FiEdit2 size={16} />
                              </button>
                            </>
                          )}
                          {canDelete && (
                            <button className="btn-ghost !px-2 text-red-500" title="Delete" onClick={() => setDeleteTarget(item)}>
                              <FiTrash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
      </div>

      {addIngredientOpen && (
        <AddIngredientModal
          isOpen={addIngredientOpen}
          onClose={() => setAddIngredientOpen(false)}
          onSaved={() => {
            setAddIngredientOpen(false);
            fetchItems();
          }}
        />
      )}

      {addStockTarget && (
        <AddStockModal
          isOpen={!!addStockTarget}
          item={addStockTarget}
          onClose={() => setAddStockTarget(null)}
          onSaved={() => {
            setAddStockTarget(null);
            fetchItems();
          }}
        />
      )}

      {editTarget && (
        <EditInventoryModal
          isOpen={!!editTarget}
          item={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            fetchItems();
          }}
        />
      )}

      {historyTarget && (
        <TransactionHistoryModal isOpen={!!historyTarget} itemId={historyTarget._id} onClose={() => setHistoryTarget(null)} />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Inventory Record"
        message={`Are you sure you want to delete the inventory record for "${deleteTarget?.ingredient?.name}"?`}
        confirmLabel="Delete"
      />
    </div>
  );
};

export default Inventory;
