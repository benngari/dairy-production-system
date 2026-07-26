import React, { useState, useEffect } from 'react';
import api from '../api/client';
import ProductionChart from '../components/charts/ProductionChart';

const Dashboard = () => {
  const [data, setData] = useState({
    today: {}, lowStock: [], lowStockPackaging: [], recentBatches: [], weeklyData: [],
    overallTotals: {}, bottleInventory: [], totalBottlesProduced: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/dashboard');
        setData({
          today: res.data.today || {},
          lowStock: res.data.lowStock || [],
          lowStockPackaging: res.data.lowStockPackaging || [],
          recentBatches: res.data.recentBatches || [],
          weeklyData: res.data.weeklyData || [],
          overallTotals: res.data.overallTotals || {},
          bottleInventory: res.data.bottleInventory || [],
          totalBottlesProduced: res.data.totalBottlesProduced || 0
        });
      } catch (err) {
        console.error('Dashboard fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  const totals = data.overallTotals || {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-gray-500 text-sm">Today's Productions</h3>
          <p className="text-2xl font-bold">{data.today.productions || 0}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-gray-500 text-sm">Milk Used Today (L)</h3>
          <p className="text-2xl font-bold">{data.today.milkUsed?.toFixed(2) || 0}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-gray-500 text-sm">Output Today</h3>
          <p className="text-2xl font-bold">{data.today.output?.toFixed(2) || 0}</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Yoghurt & Mala Totals (All Time)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-gray-500 text-sm">Total Milk Processed</h3>
            <p className="text-xl font-bold">{(totals.totalMilkProcessed || 0).toFixed(2)} L</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-gray-500 text-sm">Production Cost</h3>
            <p className="text-xl font-bold">KSh {(totals.totalProductionCost || 0).toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-gray-500 text-sm">Revenue</h3>
            <p className="text-xl font-bold">KSh {(totals.totalRevenue || 0).toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-gray-500 text-sm">Expected Profit</h3>
            <p className={`text-xl font-bold ${(totals.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              KSh {(totals.totalProfit || 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-gray-500 text-sm">Bottles Produced</h3>
            <p className="text-xl font-bold">{data.totalBottlesProduced || 0}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-gray-500 text-sm">Remaining Product</h3>
            <p className="text-xl font-bold">{(totals.totalRemainingProduct || 0).toFixed(2)} L</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Weekly Production</h3>
          <ProductionChart data={data.weeklyData} />
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Low Stock Alerts</h3>
          {(data.lowStock || []).length === 0 && (data.lowStockPackaging || []).length === 0 ? (
            <p className="text-green-600">All stock levels are adequate.</p>
          ) : (
            <ul className="space-y-1">
              {(data.lowStock || []).map(item => (
                <li key={item._id} className="text-red-600">
                  {item.name}: {item.stock} {item.unit} (min: {item.minStock})
                </li>
              ))}
              {(data.lowStockPackaging || []).map(item => (
                <li key={item._id} className="text-red-600">
                  {item.size} bottles: {item.stock} (min: {item.minStock})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Bottle Inventory</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Size</th>
              <th className="text-left">Opening Stock</th>
              <th className="text-left">Current Stock</th>
              <th className="text-left">Min Stock</th>
            </tr>
          </thead>
          <tbody>
            {(data.bottleInventory || []).map(item => (
              <tr key={item._id} className="border-b">
                <td className="py-1">{item.size}</td>
                <td>{item.openingStock ?? '-'}</td>
                <td className={item.stock < item.minStock ? 'text-red-600' : ''}>{item.stock}</td>
                <td>{item.minStock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Recent Batches</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Date</th>
              <th className="text-left">Product</th>
              <th className="text-left">Milk (L)</th>
              <th className="text-left">Output</th>
              <th className="text-left">Profit</th>
            </tr>
          </thead>
          <tbody>
            {(data.recentBatches || []).map((batch, idx) => (
              <tr key={idx} className="border-b">
                <td className="py-1">{new Date(batch.date).toLocaleDateString()}</td>
                <td>{batch.recipeName}</td>
                <td>{batch.milkUsed}</td>
                <td>{batch.output}</td>
                <td>{batch.profit != null ? `KSh ${batch.profit.toFixed(2)}` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;