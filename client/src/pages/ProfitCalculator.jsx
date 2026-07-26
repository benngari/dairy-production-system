import React, { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';

const ProfitCalculator = () => {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [settings, setSettings] = useState({ labourCostPerHour: 20, consumablesMarkup: 5 });
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get('/recipes').then(res => setRecipes(res.data));
    api.get('/settings').then(res => setSettings(res.data));
  }, []);

  const handleCalculate = async () => {
    try {
      const recipeRes = await api.get(`/recipes/${selectedRecipe}`);
      const recipe = recipeRes.data;
      let ingredientCost = 0;
      for (let item of recipe.ingredients) {
        const quantity = (item.percentage / 100) * 100; // 100L base
        const ing = await api.get(`/ingredients/${item.ingredientId}`);
        ingredientCost += quantity * ing.data.unitCost;
      }
      const labourCost = settings.labourCostPerHour * 2;
      const consumablesCost = ingredientCost * (settings.consumablesMarkup / 100);
      const totalCost = ingredientCost + labourCost + consumablesCost;
      const revenue = 10 * 5; // placeholder
      const profit = revenue - totalCost;

      setResult({
        ingredientCost,
        labourCost,
        consumablesCost,
        totalCost,
        revenue,
        profit
      });
    } catch (err) {
      toast.error('Error calculating profit');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Profit Calculator</h1>
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
            <p>Ingredient Cost: ${result.ingredientCost.toFixed(2)}</p>
            <p>Labour Cost: ${result.labourCost.toFixed(2)}</p>
            <p>Consumables (markup): ${result.consumablesCost.toFixed(2)}</p>
            <p className="font-bold">Total Cost: ${result.totalCost.toFixed(2)}</p>
          </div>
          <div>
            <h3 className="font-semibold">Revenue & Profit</h3>
            <p>Revenue: ${result.revenue.toFixed(2)}</p>
            <p className={`font-bold ${result.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Profit: ${result.profit.toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitCalculator;