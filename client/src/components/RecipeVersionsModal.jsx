import { useEffect, useState } from 'react';
import { FiRotateCcw } from 'react-icons/fi';
import Modal from './Modal';
import Spinner from './Spinner';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const RecipeVersionsModal = ({ isOpen, recipe, onClose, onRestored }) => {
  const [versions, setVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { hasRole } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/recipes/${recipe._id}/versions`);
        setVersions([...data.versions].reverse());
        setCurrentVersion(data.currentVersion);
      } catch (err) {
        toast.error('Failed to load version history');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe._id]);

  const handleRestore = async (versionNumber) => {
    try {
      await api.post(`/recipes/${recipe._id}/versions/${versionNumber}/restore`);
      toast.success(`Restored to version ${versionNumber}`);
      onRestored();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore version');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Version History - ${recipe.name}`} size="md">
      {loading ? (
        <Spinner full />
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {versions.map((v) => (
            <div key={v.versionNumber} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-700 text-sm">
                    Version {v.versionNumber}
                    {v.versionNumber === currentVersion && (
                      <span className="ml-2 badge bg-primary-50 text-primary-700">Current</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">{new Date(v.savedAt).toLocaleString()}</p>
                </div>
                {hasRole('Administrator', 'Manager') && v.versionNumber !== currentVersion && (
                  <button className="btn-outline !py-1.5 !px-3 text-xs" onClick={() => handleRestore(v.versionNumber)}>
                    <FiRotateCcw size={13} /> Restore
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">Yield: {v.yieldPercentage}% &middot; {v.ingredients.length} ingredients</p>
              <ul className="mt-2 text-xs text-slate-500 grid grid-cols-2 gap-x-4 gap-y-1">
                {v.ingredients.map((ing, i) => (
                  <li key={i}>
                    {ing.name}: {ing.percentage}%
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default RecipeVersionsModal;
