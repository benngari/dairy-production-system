import { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCopy, FiClock, FiSearch, FiPower, FiEye } from 'react-icons/fi';
import api from '../services/api';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import RecipeFormModal from '../components/RecipeFormModal';
import RecipeVersionsModal from '../components/RecipeVersionsModal';
import RecipePreviewModal from '../components/RecipePreviewModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [versionsTarget, setVersionsTarget] = useState(null);
  const [previewTarget, setPreviewTarget] = useState(null);

  const toast = useToast();
  const { hasRole } = useAuth();
  const canManage = hasRole('Administrator', 'Manager');

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/recipes', { params: { search, status, page, limit: 10 } });
      setRecipes(data.recipes);
      setPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, page]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/recipes/${id}/duplicate`);
      toast.success('Recipe duplicated');
      fetchRecipes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to duplicate recipe');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/recipes/${id}/status`);
      toast.success('Recipe status updated');
      fetchRecipes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/recipes/${deleteTarget._id}`);
      toast.success('Recipe deleted');
      setDeleteTarget(null);
      fetchRecipes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete recipe');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Formula Builder</h1>
          <p className="text-sm text-slate-500">Create and manage recipes with unlimited ingredients — no hardcoding.</p>
        </div>
        {canManage && (
          <button
            className="btn-primary"
            onClick={() => {
              setEditingRecipe(null);
              setFormOpen(true);
            }}
          >
            <FiPlus /> New Recipe
          </button>
        )}
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="input pl-9"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <select
          className="input sm:w-48"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Disabled">Disabled</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner full />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Ingredients</th>
                  <th>Yield %</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recipes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-slate-400 py-8">
                      No recipes found.
                    </td>
                  </tr>
                )}
                {recipes.map((r) => (
                  <tr key={r._id}>
                    <td className="font-medium text-slate-800">
                      {r.name}
                      {r.description && <p className="text-xs font-normal text-slate-400">{r.description}</p>}
                    </td>
                    <td>{r.category}</td>
                    <td>{r.ingredients.length} ingredients</td>
                    <td>{r.yieldPercentage}%</td>
                    <td>v{r.currentVersion}</td>
                    <td>
                      <Badge>{r.status}</Badge>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        <button className="btn-ghost !px-2" title="Preview calculation" onClick={() => setPreviewTarget(r)}>
                          <FiEye size={16} />
                        </button>
                        <button className="btn-ghost !px-2" title="Version history" onClick={() => setVersionsTarget(r)}>
                          <FiClock size={16} />
                        </button>
                        {canManage && (
                          <>
                            <button className="btn-ghost !px-2" title="Duplicate" onClick={() => handleDuplicate(r._id)}>
                              <FiCopy size={16} />
                            </button>
                            <button
                              className="btn-ghost !px-2"
                              title={r.status === 'Active' ? 'Disable' : 'Enable'}
                              onClick={() => handleToggleStatus(r._id)}
                            >
                              <FiPower size={16} />
                            </button>
                            <button
                              className="btn-ghost !px-2"
                              title="Edit"
                              onClick={() => {
                                setEditingRecipe(r);
                                setFormOpen(true);
                              }}
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              className="btn-ghost !px-2 text-red-500"
                              title="Delete"
                              onClick={() => setDeleteTarget(r)}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </>
                        )}
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

      {formOpen && (
        <RecipeFormModal
          isOpen={formOpen}
          recipe={editingRecipe}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            fetchRecipes();
          }}
        />
      )}

      {versionsTarget && (
        <RecipeVersionsModal
          isOpen={!!versionsTarget}
          recipe={versionsTarget}
          onClose={() => setVersionsTarget(null)}
          onRestored={() => {
            setVersionsTarget(null);
            fetchRecipes();
          }}
        />
      )}

      {previewTarget && (
        <RecipePreviewModal isOpen={!!previewTarget} recipe={previewTarget} onClose={() => setPreviewTarget(null)} />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Recipe"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
};

export default Recipes;
