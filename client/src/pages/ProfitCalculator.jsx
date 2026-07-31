import React, { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ProfitCalculator = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('daily');

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState([]);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [settings, setSettings] = useState({ labourCostPerHour: 20, consumablesMarkup: 5 });
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (tab === 'daily') fetchDailyStock();
  }, [tab, date]);

  useEffect(() => {
    if (tab === 'legacy') {
      api.get('/recipes').then(res => setRecipes(res.data));
      api.get('/settings').then(res => setSettings(res.data));
    }
  }, [tab]);

  const fetchDailyStock = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/daily-stock?date=${date}`);
      setRows(res.data || []);
      setEdits({});
    } catch (err) {
      toast.error('Failed to load daily stock');
    } finally {
      setLoading(false);
    }
  };

  const getEdited = (row) => ({
    addedStock: edits[row._id]?.addedStock ?? row.addedStock,
    closingStock: edits[row._id]?.closingStock ?? row.closingStock
  });

  const handleEditChange = (rowId, field, value) => {
    const row = rows.find(r => r._id === rowId);
    setEdits({
      ...edits,
      [rowId]: { ...getEdited(row), [field]: parseFloat(value) || 0 }
    });
  };

  const handleSaveAll = async () => {
    const changedIds = Object.keys(edits);
    if (changedIds.length === 0) {
      toast('No changes to save');
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        changedIds.map(id => api.put(`/daily-stock/${id}`, edits[id]))
      );
      toast.success(`Saved ${changedIds.length} ${changedIds.length === 1 ? 'entry' : 'entries'}`);
      fetchDailyStock();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRow = async (row) => {
    if (!window.confirm(`Move ${row.productType} ${row.size} (${date}) to trash?`)) return;
    try {
      await api.delete(`/daily-stock/${row._id}`);
      toast.success('Moved to trash');
      fetchDailyStock();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting entry');
    }
  };

  const computeSold = (row) => {
    const e = getEdited(row);
    return row.openingStock + e.addedStock - e.closingStock;
  };
  const computeRevenue = (row) => computeSold(row) * row.unitPrice;

  const totals = rows.reduce((acc, row) => {
    acc.sold += computeSold(row);
    acc.revenue += computeRevenue(row);
    return acc;
  }, { sold: 0, revenue: 0 });

  const hasUnsavedChanges = Object.keys(edits).length > 0;
  const yoghurtRows = rows.filter(r => r.productType === 'Yoghurt');
  const malaRows = rows.filter(r => r.productType === 'Mala');

  const renderTable = (title, tableRows) => (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="font-bold mb-2">{title}</h3>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Size</th>
            <th>Opening Stock</th>
            <th>Add Stock</th>
            <th>Closing Stock</th>
            <th>Sold</th>
            <th>Unit Price</th>
            <th>Revenue</th>
            {user?.role === 'Administrator' && <th></th>}
          </tr>
        </thead>
        <tbody>
          {tableRows.map(row => {
            const e = getEdited(row);
            const sold = computeSold(row);
            const isDirty = !!edits[row._id];
            return (
              <tr key={row._id} className={`border-b ${isDirty ? 'bg-amber-50' : ''}`}>
                <td className="py-1">{row.size}</td>
                <td className="text-center">{row.openingStock}</td>
                <td className="text-center">
                  <input
                    type="number"
                    value={e.addedStock}
                    onChange={(ev) => handleEditChange(row._id, 'addedStock', ev.target.value)}
                    className="border p-1 rounded w-16 text-center"
                  />
                </td>
                <td className="text-center">
                  <input
                    type="number"
                    value={e.closingStock}
                    onChange={(ev) => handleEditChange(row._id, 'closingStock', ev.target.value)}
                    className="border p-1 rounded w-16 text-center"
                  />
                </td>
                <td className={`text-center font-medium ${sold < 0 ? 'text-red-600' : ''}`}>{sold}</td>
                <td className="text-center">KSh {row.unitPrice}</td>
                <td className="text-center font-medium">KSh {computeRevenue(row).toFixed(2)}</td>
                {user?.role === 'Administrator' && (
                  <td className="text-center">
                    <button onClick={() => handleDeleteRow(row)} className="text-red-600 text-xs hover:underline">Delete</button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Profit Calculator</h1>
        <div className="flex space-x-2 text-sm">
          <button
            onClick={() => setTab('daily')}
            className={`px-3 py-1 rounded ${tab === 'daily' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            Daily Stock & Revenue
          </button>
          <button
            onClick={() => setTab('legacy')}
            className={`px-3 py-1 rounded ${tab === 'legacy' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            Recipe Profit (legacy)
          </button>
        </div>
      </div>

      {tab === 'daily' && (
        <>
          <div className="bg-white p-4 rounded shadow mb-4 flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border p-2 rounded"
            />
            <p className="text-xs text-gray-500 flex-1 min-w-[200px]">
              Opening stock is carried forward automatically from the previous day's closing stock.
            </p>
            <button
              onClick={handleSaveAll}
              disabled={saving || !hasUnsavedChanges}
              className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : hasUnsavedChanges ? `Save All (${Object.keys(edits).length})` : 'Save All'}
            </button>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              {renderTable('Yoghurt', yoghurtRows)}
              {renderTable('Mala', malaRows)}

              <div className="bg-white p-4 rounded shadow grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-gray-500 text-sm">Total Bottles Sold Today</h3>
                  <p className="text-2xl font-bold">{totals.sold}</p>
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Total Revenue Today</h3>
                  <p className="text-2xl font-bold text-green-600">KSh {totals.revenue.toFixed(2)}</p>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'legacy' && (
        <LegacyProfitCalculator
          recipes={recipes}
          selectedRecipe={selectedRecipe}
          setSelectedRecipe={setSelectedRecipe}
          settings={settings}
          result={result}
          setResult={setResult}
        />
      )}
    </div>
  );
};

const LegacyProfitCalculator = ({ recipes, selectedRecipe, setSelectedRecipe, settings, result, setResult }) => {
  const handleCalculate = async () => {
    try {
      const recipeRes = await api.get(`/recipes/${selectedRecipe}`);
      const recipe = recipeRes.data;
      let ingredientCost = 0;
      for (let item of recipe.ingredients) {
        const quantity = (item.percentage / 100) * 100;
        const ing = await api.get(`/ingredients/${item.ingredientId}`);
        ingredientCost += quantity * ing.data.unitCost;
      }
      const labourCost = settings.labourCostPerHour * 2;
      const consumablesCost = ingredientCost * (settings.consumablesMarkup / 100);
      const totalCost = ingredientCost + labourCost + consumablesCost;
      const revenue = 10 * 5;
      const profit = revenue - totalCost;

      setResult({ ingredientCost, labourCost, consumablesCost, totalCost, revenue, profit });
    } catch (err) {
      toast.error('Error calculating profit');
    }
  };

  return (
    <>
      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="flex space-x-4">
          <select value={selectedRecipe} onChange={(e) => setSelectedRecipe(e.target.value)} className="border p-2 rounded">
            <option value="">Select Recipe</option>
            {recipes.map(r => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
          <button onClick={handleCalculate} className="bg-blue-600 text-white px-4 py-2 rounded">Calculate Profit</button>
        </div>
      </div>
      {result && (
        <div className="bg-white p-4 rounded shadow grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">Cost Breakdown</h3>
            <p>Ingredient Cost: KSh {result.ingredientCost.toFixed(2)}</p>
            <p>Labour Cost: KSh {result.labourCost.toFixed(2)}</p>
            <p>Consumables (markup): KSh {result.consumablesCost.toFixed(2)}</p>
            <p className="font-bold">Total Cost: KSh {result.totalCost.toFixed(2)}</p>
          </div>
          <div>
            <h3 className="font-semibold">Revenue & Profit</h3>
            <p>Revenue: KSh {result.revenue.toFixed(2)}</p>
            <p className={`font-bold ${result.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Profit: KSh {result.profit.toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfitCalculator;