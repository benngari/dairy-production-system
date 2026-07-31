import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Reports = () => {
  const [tab, setTab] = useState('history');
  const [history, setHistory] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [period, setPeriod] = useState('daily');
  const [summary, setSummary] = useState([]);

  const [ingredientUsage, setIngredientUsage] = useState([]);
  const [consumption, setConsumption] = useState({ ingredients: [], packaging: [] });
  const [dailyStockHistory, setDailyStockHistory] = useState([]);
  const [dailyStockSummary, setDailyStockSummary] = useState([]);

  const { user } = useAuth();

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (tab === 'summary') fetchSummary();
    if (tab === 'ingredients') fetchIngredientUsage();
    if (tab === 'consumption') fetchConsumption();
    if (tab === 'daily-stock') fetchDailyStockData();
  }, [tab, period]);

  const fetchHistory = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const res = await api.get(`/reports/production-history?${params}`);
      setHistory(res.data || []);
    } catch (err) {
      setHistory([]);
    }
  };

  const handleDeleteBatch = async (item) => {
    if (!item.productionId) {
      toast.error('This record has no linked batch to delete (legacy data)');
      return;
    }
    if (!window.confirm('Delete this batch? This restores ingredient and bottle stock.')) return;
    try {
      await api.delete(`/production/${item.productionId}`);
      toast.success('Batch deleted, stock restored');
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting batch');
    }
  };

  const handleDeleteDailyStock = async (item) => {
    if (!window.confirm(`Move ${item.productType} ${item.size} (${new Date(item.date).toLocaleDateString()}) to trash?`)) return;
    try {
      await api.delete(`/daily-stock/${item._id}`);
      toast.success('Moved to trash');
      fetchDailyStockData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting entry');
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get(`/reports/summary?period=${period}`);
      setSummary(res.data || []);
    } catch (err) {
      setSummary([]);
    }
  };

  const fetchIngredientUsage = async () => {
    try {
      const res = await api.get('/reports/ingredient-usage');
      setIngredientUsage(res.data || []);
    } catch (err) {
      setIngredientUsage([]);
    }
  };

  const fetchConsumption = async () => {
    try {
      const res = await api.get('/reports/inventory-consumption');
      setConsumption(res.data || { ingredients: [], packaging: [] });
    } catch (err) {
      setConsumption({ ingredients: [], packaging: [] });
    }
  };

  const fetchDailyStockData = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const [historyRes, summaryRes] = await Promise.all([
        api.get(`/daily-stock/history?${params}`),
        api.get(`/daily-stock/summary?${params}`)
      ]);
      setDailyStockHistory(historyRes.data || []);
      setDailyStockSummary(summaryRes.data || []);
    } catch (err) {
      setDailyStockHistory([]);
      setDailyStockSummary([]);
    }
  };

  // Generic export — builds the query string from whichever filters are
  // relevant to the currently active tab, so every report type can export.
  const buildExportParams = () => {
    const params = new URLSearchParams();
    params.append('type', tab === 'history' ? 'production-history' : tab === 'summary' ? 'summary' : tab === 'ingredients' ? 'ingredient-usage' : tab === 'consumption' ? 'inventory-consumption' : 'daily-stock');
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (tab === 'summary') params.append('period', period);
    return params;
  };

  const handleExportPDF = async () => {
    try {
      const params = buildExportParams();
      const res = await api.get(`/reports/export/pdf?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${params.get('type')}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error exporting PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      const params = buildExportParams();
      const res = await api.get(`/reports/export/excel?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${params.get('type')}_report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error exporting Excel');
    }
  };

  const ExportButtons = () => (
    <div className="flex space-x-2">
      <button onClick={handleExportPDF} className="bg-red-600 text-white px-4 py-2 rounded">Export PDF</button>
      <button onClick={handleExportExcel} className="bg-green-600 text-white px-4 py-2 rounded">Export Excel</button>
    </div>
  );

  const tabs = [
    { id: 'history', label: 'Production History' },
    { id: 'summary', label: 'Daily/Weekly/Monthly' },
    { id: 'ingredients', label: 'Ingredient Usage' },
    { id: 'consumption', label: 'Inventory Consumption' },
    { id: 'daily-stock', label: 'Daily Stock & Sales' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Reports</h1>

      <div className="flex space-x-2 mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1 rounded text-sm ${tab === t.id ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'history' && (
        <>
          <div className="bg-white p-4 rounded shadow mb-4 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-2 rounded" />
            </div>
            <button onClick={fetchHistory} className="bg-blue-600 text-white px-4 py-2 rounded">Filter</button>
            <ExportButtons />
          </div>

          <table className="min-w-full bg-white shadow rounded">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Date</th>
                <th>Product</th>
                <th>Flavours</th>
                <th>Colours</th>
                <th>Milk (L)</th>
                <th>Output</th>
                <th>Cost</th>
                <th>Revenue</th>
                <th>Profit</th>
                <th>Status</th>
                <th>User</th>
                {user?.role === 'Administrator' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {(history || []).map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{new Date(item.date).toLocaleDateString()}</td>
                  <td>{item.recipeName}</td>
                  <td>{(item.flavours || []).join(', ') || '-'}</td>
                  <td>{(item.colours || []).join(', ') || '-'}</td>
                  <td>{item.milkUsed}</td>
                  <td>{item.output}</td>
                  <td>{item.totalCost != null ? `KSh ${item.totalCost.toFixed(2)}` : '-'}</td>
                  <td>{item.revenue != null ? `KSh ${item.revenue.toFixed(2)}` : '-'}</td>
                  <td>{item.profit != null ? `KSh ${item.profit.toFixed(2)}` : '-'}</td>
                  <td>{item.status}</td>
                  <td>{item.user}</td>
                  {user?.role === 'Administrator' && (
                    <td>
                      <button onClick={() => handleDeleteBatch(item)} className="text-red-600 text-sm hover:underline">
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === 'summary' && (
        <>
          <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex space-x-2">
              {['daily', 'weekly', 'monthly'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded text-sm capitalize ${period === p ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <ExportButtons />
          </div>
          <table className="min-w-full bg-white shadow rounded">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Period</th>
                <th>Product</th>
                <th>Batches</th>
                <th>Milk (L)</th>
                <th>Cost</th>
                <th>Revenue</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {(summary || []).map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{row._id?.period}</td>
                  <td>{row._id?.productType}</td>
                  <td>{row.batches}</td>
                  <td>{row.milkLitres?.toFixed(2)}</td>
                  <td>KSh {(row.totalCost || 0).toFixed(2)}</td>
                  <td>KSh {(row.totalRevenue || 0).toFixed(2)}</td>
                  <td>KSh {(row.totalProfit || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === 'ingredients' && (
        <>
          <div className="mb-4 flex justify-end">
            <ExportButtons />
          </div>
          <table className="min-w-full bg-white shadow rounded">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Ingredient</th>
                <th>Total Used</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              {(ingredientUsage || []).map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{row._id}</td>
                  <td>{row.totalQuantity?.toFixed(2)}</td>
                  <td>{row.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === 'consumption' && (
        <>
          <div className="mb-4 flex justify-end">
            <ExportButtons />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">Ingredients Consumed</h3>
              <ul className="text-sm space-y-1">
                {(consumption.ingredients || []).map((i, idx) => (
                  <li key={idx}>{i.name}: {i.totalUsed.toFixed(2)} {i.unit}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">Bottles Consumed</h3>
              <ul className="text-sm space-y-1">
                {(consumption.packaging || []).map((p, idx) => (
                  <li key={idx}>{p.size}: {p.totalUsed} bottles</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {tab === 'daily-stock' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded shadow flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-2 rounded" />
            </div>
            <button onClick={fetchDailyStockData} className="bg-blue-600 text-white px-4 py-2 rounded">Filter</button>
            <ExportButtons />
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Daily Totals</h3>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th>Bottles Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(dailyStockSummary || []).map((row, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-1">{row._id}</td>
                    <td className="text-center">{row.totalSold}</td>
                    <td className="text-center">KSh {(row.totalRevenue || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Detail by Product & Size</h3>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Opening</th>
                  <th>Added</th>
                  <th>Closing</th>
                  <th>Sold</th>
                  <th>Revenue</th>
                  {user?.role === 'Administrator' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {(dailyStockHistory || []).map((row) => (
                  <tr key={row._id} className="border-b">
                    <td className="py-1">{new Date(row.date).toLocaleDateString()}</td>
                    <td>{row.productType}</td>
                    <td>{row.size}</td>
                    <td className="text-center">{row.openingStock}</td>
                    <td className="text-center">{row.addedStock}</td>
                    <td className="text-center">{row.closingStock}</td>
                    <td className="text-center">{row.soldQuantity}</td>
                    <td className="text-center">KSh {(row.revenue || 0).toFixed(2)}</td>
                    {user?.role === 'Administrator' && (
                      <td className="text-center">
                        <button onClick={() => handleDeleteDailyStock(row)} className="text-red-600 text-sm hover:underline">Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;