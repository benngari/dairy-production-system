import { useEffect, useState } from 'react';
import { FiDroplet, FiTarget, FiCheckCircle, FiXCircle, FiPlay } from 'react-icons/fi';
import api from '../services/api';
import Spinner from '../components/Spinner';
import { useToast } from '../context/ToastContext';

const ProductionCalculator = () => {
  const [recipes, setRecipes] = useState([]);
  const [recipeId, setRecipeId] = useState('');
  const [mode, setMode] = useState('HAVE_MILK');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [calcResult, setCalcResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [producing, setProducing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get('/recipes', { params: { status: 'Active', limit: 200 } });
      setRecipes(data.recipes);
    };
    load();
  }, []);

  const handleCalculate = async () => {
    if (!recipeId) return toast.error('Please select a recipe');
    if (!quantity || Number(quantity) <= 0) return toast.error('Please enter a valid quantity');

    setCalculating(true);
    setCalcResult(null);
    try {
      const { data } = await api.post('/production/calculate', { recipeId, mode, quantity: Number(quantity) });
      setCalcResult(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  const handleProduce = async () => {
    setProducing(true);
    try {
      const { data } = await api.post('/production/produce', { recipeId, mode, quantity: Number(quantity), notes });
      toast.success(`Production batch ${data.production.batchNumber} created successfully!`);
      setCalcResult(null);
      setQuantity('');
      setNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to produce batch');
    } finally {
      setProducing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Production Calculator</h1>
        <p className="text-sm text-slate-500">Never calculate percentages manually — pick a recipe and let the engine do the math.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-1 space-y-4 h-fit">
          <div className="grid grid-cols-1 gap-2">
            <button
              className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium ${
                mode === 'HAVE_MILK' ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500'
              }`}
              onClick={() => {
                setMode('HAVE_MILK');
                setCalcResult(null);
              }}
            >
              <FiDroplet /> Mode 1: I Have Milk
            </button>
            <button
              className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium ${
                mode === 'WANT_TO_PRODUCE' ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500'
              }`}
              onClick={() => {
                setMode('WANT_TO_PRODUCE');
                setCalcResult(null);
              }}
            >
              <FiTarget /> Mode 2: I Want To Produce
            </button>
          </div>

          <div>
            <label className="label">Recipe</label>
            <select className="input" value={recipeId} onChange={(e) => setRecipeId(e.target.value)}>
              <option value="">Select a recipe...</option>
              {recipes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">{mode === 'HAVE_MILK' ? 'Milk Quantity (Liters)' : 'Desired Finished Product Quantity'}</label>
            <input
              type="number"
              className="input"
              placeholder="e.g. 100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <button className="btn-primary w-full" onClick={handleCalculate} disabled={calculating}>
            {calculating ? 'Calculating...' : 'Calculate Ingredients'}
          </button>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {calculating && <Spinner full />}

          {!calculating && calcResult && (
            <>
              <div className="card p-5">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Recipe</p>
                    <p className="font-semibold text-slate-800">{calcResult.recipe.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Milk Quantity</p>
                    <p className="font-semibold text-slate-800">{calcResult.milkQuantity} L</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Expected Yield</p>
                    <p className="font-semibold text-slate-800">{calcResult.expectedYield}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Status</p>
                    {calcResult.canProduce ? (
                      <p className="font-semibold text-secondary-600 flex items-center gap-1">
                        <FiCheckCircle /> Ready to produce
                      </p>
                    ) : (
                      <p className="font-semibold text-red-600 flex items-center gap-1">
                        <FiXCircle /> Insufficient stock
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-700">Store Checker — Required vs Available</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="table-base w-full">
                    <thead>
                      <tr>
                        <th>Ingredient</th>
                        <th>Required</th>
                        <th>Available</th>
                        <th>Remaining</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calcResult.storeCheck.map((item, i) => (
                        <tr key={i} className={item.status === 'Insufficient' ? 'bg-red-50/60' : ''}>
                          <td className="font-medium">{item.name}</td>
                          <td>
                            {item.required} {item.unit}
                          </td>
                          <td>
                            {item.available} {item.unit}
                          </td>
                          <td className={item.remaining < 0 ? 'text-red-600 font-semibold' : ''}>
                            {item.remaining} {item.unit}
                            {item.shortage > 0 && (
                              <span className="block text-xs text-red-500">
                                Short by {item.shortage} {item.unit}
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                item.status === 'Sufficient'
                                  ? 'bg-secondary-50 text-secondary-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
                  <button
                    className="btn-secondary"
                    disabled={!calcResult.canProduce || producing}
                    onClick={handleProduce}
                    title={!calcResult.canProduce ? 'Cannot produce due to insufficient stock' : ''}
                  >
                    <FiPlay /> {producing ? 'Processing...' : 'Confirm & Produce Batch'}
                  </button>
                </div>
              </div>
            </>
          )}

          {!calculating && !calcResult && (
            <div className="card p-10 flex flex-col items-center justify-center text-center text-slate-400">
              <FiDroplet size={36} className="mb-3" />
              <p>Select a recipe and enter a quantity to calculate ingredient requirements.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductionCalculator;
