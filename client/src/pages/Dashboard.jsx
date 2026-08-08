import React, { useState, useEffect } from 'react';
import api from '../api/client';
import ProductionChart from '../components/charts/ProductionChart';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

const Dashboard = () => {
  const [data, setData] = useState({
    today: {}, lowStock: [], lowStockPackaging: [], recentBatches: [], weeklyData: [], twoWeekData: [], last30Data: [],
    overallTotals: {}, bottleInventory: [], totalBottlesProduced: 0
  });
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('weekly');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Spinner label="Loading dashboard..." />;

  const totals = data.overallTotals || {};

  const StatCard = ({ label, value }) => (
    <div className="app-card">
      <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-stone-900 mt-1">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="page-title">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Today's Productions" value={data.today.productions || 0} />
        <StatCard label="Milk Used Today" value={`${(data.today.milkUsed || 0).toFixed(2)} L`} />
        <StatCard label="Output Today" value={`${(data.today.output || 0).toFixed(2)}`} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Yoghurt & Mala Totals (All Time)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Milk Processed" value={`${(totals.totalMilkProcessed || 0).toFixed(0)} L`} />
          <StatCard label="Production Cost" value={`KSh ${(totals.totalProductionCost || 0).toFixed(0)}`} />
          <StatCard label="Revenue" value={`KSh ${(totals.totalRevenue || 0).toFixed(0)}`} />
          <StatCard
            label="Expected Profit"
            value={
              <span className={totals.totalProfit >= 0 ? 'text-green-700' : 'text-red-600'}>
                KSh {(totals.totalProfit || 0).toFixed(0)}
              </span>
            }
          />
          <StatCard label="Bottles Produced" value={data.totalBottlesProduced || 0} />
          <StatCard label="Remaining Product" value={`${(totals.totalRemainingProduct || 0).toFixed(2)} L`} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="app-card">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="font-semibold text-stone-800">
              {chartView === 'weekly' ? 'Weekly Production' : chartView === 'twoWeeks' ? '2 Week Production' : 'Last 30 Days Production'}
            </h3>
            <div className="flex text-xs border border-stone-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setChartView('weekly')}
                className={`px-3 py-1 ${chartView === 'weekly' ? 'bg-green-700 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setChartView('twoWeeks')}
                className={`px-3 py-1 ${chartView === 'twoWeeks' ? 'bg-green-700 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
              >
                2 Weeks
              </button>
              <button
                onClick={() => setChartView('last30')}
                className={`px-3 py-1 ${chartView === 'last30' ? 'bg-green-700 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
              >
                Last 30 Days
              </button>
            </div>
          </div>
          <ProductionChart
            data={
              chartView === 'weekly' ? data.weeklyData
              : chartView === 'twoWeeks' ? data.twoWeekData
              : data.last30Data
            }
          />
        </div>
        <div className="app-card">
          <h3 className="font-semibold text-stone-800 mb-3">Low Stock Alerts</h3>
          {data.lowStock.length === 0 && data.lowStockPackaging.length === 0 ? (
            <div className="flex items-center gap-2 text-green-700 text-sm py-4">
              <span className="text-lg">✅</span> All stock levels are adequate.
            </div>
          ) : (
            <ul className="space-y-2">
              {data.lowStock.map(item => (
                <li key={item._id} className="flex justify-between text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg">
                  <span>{item.name}</span>
                  <span className="font-medium">{item.stock} {item.unit} (min: {item.minStock})</span>
                </li>
              ))}
              {data.lowStockPackaging.map(item => (
                <li key={item._id} className="flex justify-between text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg">
                  <span>{item.size} bottles</span>
                  <span className="font-medium">{item.stock} (min: {item.minStock})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="app-card">
        <h3 className="font-semibold text-stone-800 mb-3">Bottle Inventory</h3>
        {(data.bottleInventory || []).length === 0 ? (
          <EmptyState icon="🍾" title="No bottle stock recorded" subtitle="Add packaging sizes in the Packaging page to see them here." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Opening Stock</th>
                  <th>Current Stock</th>
                  <th>Min Stock</th>
                </tr>
              </thead>
              <tbody>
                {(data.bottleInventory || []).map(item => (
                  <tr key={item._id}>
                    <td className="font-medium">{item.size}</td>
                    <td>{item.openingStock ?? '-'}</td>
                    <td className={item.stock < item.minStock ? 'text-red-600 font-medium' : ''}>{item.stock}</td>
                    <td>{item.minStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="app-card">
        <h3 className="font-semibold text-stone-800 mb-3">Recent Batches</h3>
        {data.recentBatches.length === 0 ? (
          <EmptyState icon="🧮" title="No batches recorded yet" subtitle="Record your first batch in Production Calculator to see it here." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Milk (L)</th>
                  <th>Output</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {data.recentBatches.map((batch, idx) => (
                  <tr key={idx}>
                    <td>{new Date(batch.date).toLocaleDateString()}</td>
                    <td className="font-medium">{batch.recipeName}</td>
                    <td>{batch.milkUsed}</td>
                    <td>{batch.output}</td>
                    <td className={batch.profit >= 0 ? 'text-green-700' : 'text-red-600'}>
                      {batch.profit != null ? `KSh ${batch.profit.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;