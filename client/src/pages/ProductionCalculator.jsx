import React, { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import MultiSelect from '../components/MultiSelect';

const FLAVOUR_COLOUR_MAP = {
  'Mango': 'Annatto Colour',
  'Strawberry': 'Red Beet Colour',
  'Lemon Biscuit': 'Lutein',
  'Pineapple': 'Annatto Colour',
  'Vanilla': null
};
const FLAVOURS = Object.keys(FLAVOUR_COLOUR_MAP);
const COLOUR_OPTIONS = ['Annatto Colour', 'Red Beet Colour', 'Lutein'];
const BOTTLE_SIZES = ['500ml', '1L', '2L', '3L', '5L'];
const BOTTLE_LITRES = { '500ml': 0.5, '1L': 1, '2L': 2, '3L': 3, '5L': 5 };

const ProductionCalculator = () => {
  const [calcMode, setCalcMode] = useState('batch'); // 'batch' (Yoghurt/Mala) or 'recipe' (legacy)

  // --- Batch (Yoghurt/Mala) state ---
  const [productType, setProductType] = useState('Yoghurt');
  const [milkLitres, setMilkLitres] = useState('');
  const [flavours, setFlavours] = useState([]);
  const [colours, setColours] = useState([]);
  const [breakdown, setBreakdown] = useState(null);
  const [packaging, setPackaging] = useState(
    BOTTLE_SIZES.reduce((acc, s) => ({ ...acc, [s]: '' }), {})
  );
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState(null);

  // --- Legacy recipe state ---
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [mode, setMode] = useState('haveMilk');
  const [milk, setMilk] = useState('');
  const [output, setOutput] = useState('');
  const [calculation, setCalculation] = useState(null);
  const [storeCheck, setStoreCheck] = useState(null);

  useEffect(() => {
    if (calcMode === 'recipe') {
      api.get('/recipes').then(res => setRecipes(res.data));
    }
  }, [calcMode]);

  const litresPackaged = BOTTLE_SIZES.reduce(
    (sum, s) => sum + (parseFloat(packaging[s]) || 0) * BOTTLE_LITRES[s],
    0
  );
  const remainingLitres = milkLitres ? (parseFloat(milkLitres) - litresPackaged) : 0;

  const handleSuggestColours = () => {
    const suggested = [...new Set(
      flavours.map(f => FLAVOUR_COLOUR_MAP[f]).filter(Boolean)
    )];
    setColours(suggested);
  };

  const handleProductTypeChange = (value) => {
    setProductType(value);
    setBreakdown(null);
    if (value === 'Mala') {
      setFlavours([]);
      setColours([]);
    }
  };

  const handleCalculateBatch = async () => {
    try {
      const res = await api.post('/production/calculate', {
        productType,
        milkLitres: parseFloat(milkLitres),
        flavours: productType === 'Yoghurt' ? flavours : [],
        colours: productType === 'Yoghurt' ? colours : []
      });
      setBreakdown(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error calculating batch');
    }
  };

  const handleSubmitBatch = async () => {
    if (!breakdown) {
      toast.error('Calculate the batch cost first');
      return;
    }
    try {
      const packagingPayload = BOTTLE_SIZES
        .filter(s => parseFloat(packaging[s]) > 0)
        .map(s => ({ size: s, bottles: parseFloat(packaging[s]) }));

      const res = await api.post('/production', {
        productType,
        milkLitres: parseFloat(milkLitres),
        flavours: productType === 'Yoghurt' ? flavours : [],
        colours: productType === 'Yoghurt' ? colours : [],
        packaging: packagingPayload,
        notes
      });
      setResult(res.data);
      toast.success('Batch recorded');
      setBreakdown(null);
      setPackaging(BOTTLE_SIZES.reduce((acc, s) => ({ ...acc, [s]: '' }), {}));
      setNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error recording batch');
    }
  };

  // --- Legacy recipe handlers (unchanged behaviour) ---
  const handleCalculate = async () => {
    try {
      const payload = {
        recipeId: selectedRecipe,
        mode,
        milkQuantity: parseFloat(milk),
        desiredOutput: parseFloat(output)
      };
      const res = await api.post('/production/calculate', payload);
      setCalculation(res.data);
      const checkRes = await api.post('/production/check-store', { recipeId: selectedRecipe, milkQuantity: parseFloat(milk) });
      setStoreCheck(checkRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleProduce = async () => {
    if (!calculation) return;
    try {
      const payload = {
        recipeId: selectedRecipe,
        milkQuantity: parseFloat(milk),
        producedQuantity: parseFloat(output) || parseFloat(milk),
        ingredientsUsed: calculation.ingredients.map(item => ({
          ingredientId: item.ingredientId,
          quantity: item.quantity
        })),
        packagingUsed: [],
        notes: ''
      };
      await api.post('/production', payload);
      toast.success('Production recorded');
      setCalculation(null);
      setStoreCheck(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Production Calculator</h1>
        <div className="flex space-x-2 text-sm">
          <button
            onClick={() => setCalcMode('batch')}
            className={`px-3 py-1 rounded ${calcMode === 'batch' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            Yoghurt / Mala Batch
          </button>
          <button
            onClick={() => setCalcMode('recipe')}
            className={`px-3 py-1 rounded ${calcMode === 'recipe' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            Custom Recipe (legacy)
          </button>
        </div>
      </div>

      {calcMode === 'batch' && (
        <>
          <div className="bg-white p-4 rounded shadow mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Product Type</label>
                <select value={productType} onChange={(e) => handleProductTypeChange(e.target.value)} className="border p-2 rounded w-full">
                  <option value="Yoghurt">Yoghurt</option>
                  <option value="Mala">Mala</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Milk (Litres)</label>
                <input type="number" value={milkLitres} onChange={(e) => setMilkLitres(e.target.value)} className="border p-2 rounded w-full" min="0" step="0.1" />
              </div>
            </div>

            {productType === 'Yoghurt' && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <MultiSelect
                  label="Flavours (select one or more)"
                  options={FLAVOURS}
                  selected={flavours}
                  onChange={setFlavours}
                />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium">Colours</label>
                    <button
                      type="button"
                      onClick={handleSuggestColours}
                      disabled={flavours.length === 0}
                      className="text-xs text-blue-600 hover:underline disabled:text-gray-400"
                    >
                      Suggest from flavours
                    </button>
                  </div>
                  <MultiSelect
                    options={COLOUR_OPTIONS}
                    selected={colours}
                    onChange={setColours}
                    hint="Suggestions are a starting point — add or remove freely."
                  />
                </div>
              </div>
            )}

            {productType === 'Mala' && (
              <p className="text-sm text-gray-500 mt-4">Mala only uses Culture — no flavours or colours apply.</p>
            )}

            <button onClick={handleCalculateBatch} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
              Calculate Cost
            </button>
          </div>

          {breakdown && (
            <div className="bg-white p-4 rounded shadow mb-4">
              <h3 className="font-bold mb-2">Cost Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <p>Labour: KSh {breakdown.labour.toFixed(2)}</p>
                <p>Milk Cost: KSh {breakdown.milkCost.toFixed(2)}</p>
                <p>Sugar ({breakdown.sugarKg.toFixed(2)}kg): KSh {breakdown.sugarCost.toFixed(2)}</p>
                <p>Starch ({breakdown.starchGrams.toFixed(0)}g): KSh {breakdown.starchCost.toFixed(2)}</p>
                <p>Pectin ({breakdown.pectinGrams.toFixed(0)}g): KSh {breakdown.pectinCost.toFixed(2)}</p>
                <p>Culture ({breakdown.cultureSachets.toFixed(2)} sachets): KSh {breakdown.cultureCost.toFixed(2)}</p>
                <p>Consumables (5%): KSh {breakdown.consumablesCost.toFixed(2)}</p>
              </div>

              {breakdown.flavourUsage?.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-semibold text-sm">Flavours</h4>
                  <ul className="text-sm">
                    {breakdown.flavourUsage.map((f, i) => (
                      <li key={i}>{f.name}: {f.ml.toFixed(1)}ml — KSh {f.cost.toFixed(2)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {breakdown.colourUsage?.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-semibold text-sm">Colours</h4>
                  <ul className="text-sm">
                    {breakdown.colourUsage.map((c, i) => (
                      <li key={i}>{c.name}: {c.ml.toFixed(1)}ml — KSh {c.cost.toFixed(2)}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="font-bold mt-3">Total Budget Cost: KSh {breakdown.totalBudgetCost.toFixed(2)}</p>

              <h3 className="font-bold mt-4 mb-2">Package This Batch</h3>
              <div className="grid grid-cols-5 gap-2">
                {BOTTLE_SIZES.map(size => (
                  <div key={size}>
                    <label className="block text-xs text-gray-500">{size} bottles</label>
                    <input
                      type="number"
                      min="0"
                      value={packaging[size]}
                      onChange={(e) => setPackaging({ ...packaging, [size]: e.target.value })}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm text-gray-700">
                <p>Litres packaged: {litresPackaged.toFixed(2)} L</p>
                <p className={remainingLitres < 0 ? 'text-red-600 font-bold' : ''}>
                  Remaining product: {remainingLitres.toFixed(2)} L
                  {remainingLitres < 0 && ' (exceeds milk produced!)'}
                </p>
              </div>

              <textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border p-2 rounded w-full mt-2"
              />

              <button
                onClick={handleSubmitBatch}
                disabled={remainingLitres < 0}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                Record Batch & Packaging
              </button>
            </div>
          )}

          {result && (
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-bold mb-2">Batch Recorded ✅</h3>
              {result.flavours?.length > 0 && (
                <p className="text-sm text-gray-600">Flavours: {result.flavours.join(', ')}</p>
              )}
              {result.colours?.length > 0 && (
                <p className="text-sm text-gray-600">Colours: {result.colours.join(', ')}</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-2">
                <p>Total Cost: KSh {result.costBreakdown.totalBudgetCost.toFixed(2)}</p>
                <p>Total Revenue: KSh {result.revenue.totalRevenue.toFixed(2)}</p>
                <p className={result.profit >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                  Profit: KSh {result.profit.toFixed(2)}
                </p>
                <p>Remaining Product: {result.remainingLitres.toFixed(2)} L</p>
              </div>
              {result.revenue.needsPricing && (
                <p className="text-yellow-600 text-sm mt-2">
                  ⚠️ Some bottle sizes have no selling price set (e.g. 2L) — set them in Settings for accurate revenue.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {calcMode === 'recipe' && (
        <>
          <div className="bg-white p-4 rounded shadow mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Recipe</label>
                <select value={selectedRecipe} onChange={(e) => setSelectedRecipe(e.target.value)} className="border p-2 rounded w-full">
                  <option value="">Select</option>
                  {recipes.map(r => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Mode</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)} className="border p-2 rounded w-full">
                  <option value="haveMilk">I Have Milk</option>
                  <option value="wantProduce">I Want To Produce</option>
                </select>
              </div>
              {mode === 'haveMilk' && (
                <div>
                  <label className="block text-sm font-medium">Milk Quantity (L)</label>
                  <input type="number" value={milk} onChange={(e) => setMilk(e.target.value)} className="border p-2 rounded w-full" />
                </div>
              )}
              {mode === 'wantProduce' && (
                <div>
                  <label className="block text-sm font-medium">Desired Output</label>
                  <input type="number" value={output} onChange={(e) => setOutput(e.target.value)} className="border p-2 rounded w-full" />
                </div>
              )}
            </div>
            <button onClick={handleCalculate} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Calculate</button>
          </div>

          {calculation && (
            <div className="bg-white p-4 rounded shadow mb-4">
              <h3 className="font-bold">Calculation Result</h3>
              <p>Milk: {calculation.milkQuantity} L</p>
              <p>Produced: {calculation.producedQuantity} units</p>
              <h4 className="font-semibold mt-2">Ingredients Required:</h4>
              <ul>
                {calculation.ingredients.map((item, idx) => (
                  <li key={idx}>{item.name}: {item.quantity} {item.unit}</li>
                ))}
              </ul>
              {storeCheck && (
                <div className="mt-2">
                  <p className={storeCheck.canProduce ? 'text-green-600' : 'text-red-600'}>
                    {storeCheck.canProduce ? '✅ Stock sufficient' : '❌ Stock shortage'}
                  </p>
                  {!storeCheck.canProduce && (
                    <ul className="text-red-600">
                      {storeCheck.shortages.map((s, i) => (
                        <li key={i}>{s.ingredient}: need {s.required}, have {s.available} {s.unit}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <button onClick={handleProduce} disabled={!storeCheck?.canProduce} className="mt-4 bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
                Record Production
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductionCalculator;