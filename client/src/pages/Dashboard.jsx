import { useEffect, useState } from 'react';
import {
  FiDroplet,
  FiPackage,
  FiAlertTriangle,
  FiClipboard,
  FiBookOpen,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  Cell,
} from 'recharts';
import api from '../services/api';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';

const COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/dashboard');
        setData(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner full size="lg" />;
  if (!data) return null;

  const { stats, lowStockItems, recentBatches, weeklyChart, inventoryByCategory } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of today's production and inventory status</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={FiClipboard} label="Today's Production" value={stats.todayProductionCount} sub="batches produced" color="primary" />
        <StatCard icon={FiDroplet} label="Milk Used Today" value={`${stats.todayMilkUsed} L`} color="secondary" />
        <StatCard icon={FiPackage} label="Expected Yield Today" value={`${stats.todayYield}`} sub="finished units" color="slate" />
        <StatCard icon={FiPackage} label="Inventory Items" value={stats.currentInventoryItemCount} color="primary" />
        <StatCard icon={FiAlertTriangle} label="Low Stock Alerts" value={stats.lowStockCount} color="red" />
        <StatCard icon={FiBookOpen} label="Active Recipes" value={stats.activeRecipeCount} color="secondary" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card p-5 xl:col-span-2">
          <h3 className="font-semibold text-slate-700 mb-4">Milk Usage &amp; Batches (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={weeklyChart}>
              <defs>
                <linearGradient id="milkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="milkUsed" name="Milk Used (L)" stroke="#0EA5E9" fill="url(#milkGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="batches" name="Batches" stroke="#10B981" fillOpacity={0} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Inventory by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={inventoryByCategory} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="category" type="category" width={90} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="quantity" radius={[0, 6, 6, 0]}>
                {inventoryByCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Low Stock Alerts</h3>
          {lowStockItems.length === 0 ? (
            <p className="text-sm text-slate-400">All ingredients are sufficiently stocked.</p>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div key={item._id} className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.ingredient?.name}</p>
                    <p className="text-xs text-slate-500">
                      Stock: {item.stock} {item.unit} &middot; Minimum: {item.minimumStock} {item.unit}
                    </p>
                  </div>
                  <Badge>Insufficient</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Recent Batches</h3>
          {recentBatches.length === 0 ? (
            <p className="text-sm text-slate-400">No production batches recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentBatches.map((b) => (
                <div key={b._id} className="flex items-center justify-between border-b border-slate-100 pb-2.5 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{b.batchNumber}</p>
                    <p className="text-xs text-slate-500">
                      {b.recipeName} &middot; {b.milkQuantity}L milk &middot; {b.operator?.name || b.operatorName}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
