import { useEffect, useState } from 'react';
import { FiDownload, FiFileText } from 'react-icons/fi';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import api from '../services/api';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';
import { useToast } from '../context/ToastContext';

const TABS = [
  { key: 'production', label: 'Production' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'consumption', label: 'Ingredient Consumption' },
  { key: 'low-stock', label: 'Low Stock' },
];

const Reports = () => {
  const [tab, setTab] = useState('production');
  const [period, setPeriod] = useState('daily');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = tab === 'production' || tab === 'consumption' ? { period } : {};
        const { data } = await api.get(`/reports/${tab}`, { params });
        setData(data);
      } catch (err) {
        toast.error('Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, period]);

  const downloadFile = async (format) => {
    try {
      const response = await api.get(`/reports/export/${format}`, {
        params: { period },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `production-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
        <p className="text-sm text-slate-500">Daily, weekly, monthly, inventory and consumption reporting.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`rounded-lg px-4 py-2 text-sm font-medium border ${
              tab === t.key ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-500 bg-white'
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'production' || tab === 'consumption') && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {['daily', 'weekly', 'monthly'].map((p) => (
              <button
                key={p}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border capitalize ${
                  period === p ? 'border-secondary-400 bg-secondary-50 text-secondary-700' : 'border-slate-200 text-slate-500 bg-white'
                }`}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
          {tab === 'production' && (
            <div className="ml-auto flex gap-2">
              <button className="btn-outline !py-1.5 !px-3 text-xs" onClick={() => downloadFile('pdf')}>
                <FiFileText size={14} /> Export PDF
              </button>
              <button className="btn-outline !py-1.5 !px-3 text-xs" onClick={() => downloadFile('excel')}>
                <FiDownload size={14} /> Export Excel
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <Spinner full />
      ) : (
        <>
          {tab === 'production' && data && <ProductionReportView data={data} />}
          {tab === 'inventory' && data && <InventoryReportView data={data} />}
          {tab === 'consumption' && data && <ConsumptionReportView data={data} />}
          {tab === 'low-stock' && data && <LowStockReportView data={data} />}
        </>
      )}
    </div>
  );
};

const ProductionReportView = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="card p-5">
        <p className="text-sm text-slate-500">Total Batches</p>
        <p className="text-2xl font-bold text-slate-800">{data.summary.totalBatches}</p>
      </div>
      <div className="card p-5">
        <p className="text-sm text-slate-500">Total Milk Used</p>
        <p className="text-2xl font-bold text-slate-800">{data.summary.totalMilkUsed} L</p>
      </div>
      <div className="card p-5">
        <p className="text-sm text-slate-500">Total Expected Yield</p>
        <p className="text-2xl font-bold text-slate-800">{data.summary.totalYield}</p>
      </div>
    </div>

    <div className="card p-5">
      <h3 className="font-semibold text-slate-700 mb-4">Milk Used by Recipe</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data.byRecipe}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="recipeName" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="milkUsed" fill="#0EA5E9" radius={[6, 6, 0, 0]} name="Milk Used (L)" />
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-base w-full">
          <thead>
            <tr>
              <th>Batch #</th>
              <th>Recipe</th>
              <th>Milk</th>
              <th>Yield</th>
              <th>Operator</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {data.productions.map((p) => (
              <tr key={p._id}>
                <td className="font-medium">{p.batchNumber}</td>
                <td>{p.recipeName}</td>
                <td>{p.milkQuantity} L</td>
                <td>{p.expectedYield}</td>
                <td>{p.operator?.name || p.operatorName}</td>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const InventoryReportView = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="card p-5">
        <p className="text-sm text-slate-500">Total Inventory Items</p>
        <p className="text-2xl font-bold text-slate-800">{data.summary.totalItems}</p>
      </div>
      <div className="card p-5">
        <p className="text-sm text-slate-500">Low Stock Items</p>
        <p className="text-2xl font-bold text-red-600">{data.summary.lowStockCount}</p>
      </div>
    </div>
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-base w-full">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Minimum</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((i) => (
              <tr key={i._id}>
                <td className="font-medium">{i.ingredient?.name}</td>
                <td>{i.ingredient?.category}</td>
                <td>
                  {i.stock} {i.unit}
                </td>
                <td>
                  {i.minimumStock} {i.unit}
                </td>
                <td>
                  <Badge>{i.stock <= i.minimumStock ? 'Insufficient' : 'Sufficient'}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const ConsumptionReportView = ({ data }) => (
  <div className="card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="table-base w-full">
        <thead>
          <tr>
            <th>Ingredient</th>
            <th>Total Used</th>
            <th>Times Used</th>
          </tr>
        </thead>
        <tbody>
          {data.consumption.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center text-slate-400 py-8">
                No consumption data for this period.
              </td>
            </tr>
          )}
          {data.consumption.map((c, i) => (
            <tr key={i}>
              <td className="font-medium">{c.name}</td>
              <td>
                {c.totalUsed} {c.unit}
              </td>
              <td>{c.timesUsed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const LowStockReportView = ({ data }) => (
  <div className="card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="table-base w-full">
        <thead>
          <tr>
            <th>Ingredient</th>
            <th>Category</th>
            <th>Current Stock</th>
            <th>Minimum Stock</th>
            <th>Shortage</th>
          </tr>
        </thead>
        <tbody>
          {data.items.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center text-slate-400 py-8">
                No low stock items. Everything looks good!
              </td>
            </tr>
          )}
          {data.items.map((i) => (
            <tr key={i._id} className="bg-red-50/50">
              <td className="font-medium">{i.ingredient?.name}</td>
              <td>{i.ingredient?.category}</td>
              <td>
                {i.stock} {i.unit}
              </td>
              <td>
                {i.minimumStock} {i.unit}
              </td>
              <td className="text-red-600 font-semibold">
                {Math.max(0, i.minimumStock - i.stock)} {i.unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default Reports;
