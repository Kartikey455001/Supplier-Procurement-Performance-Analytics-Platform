import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Award
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { analyticsApi } from '../services/api';
import { useFilter } from '../context/FilterContext';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  'Delivered': '#10b981',
  'In Transit': '#06b6d4',
  'Pending': '#f59e0b',
  'Partially Received': '#a855f7',
  'Cancelled': '#f43f5e'
};

const CATEGORY_COLORS = ['#eab308', '#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#ec4899'];

// Formatter for Indian Rupees Currency
function formatINR(val) {
  if (val === undefined || val === null) return '₹0';
  const num = Number(val);
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function Dashboard() {
  const { getEffectiveDateRange } = useFilter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dateRange = getEffectiveDateRange();

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      setError(null);
      try {
        const res = await analyticsApi.getOverview(dateRange);
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load executive overview data.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [dateRange.startDate, dateRange.endDate]);

  if (loading) return <LoadingSpinner text="Aggregating procurement metrics from MySQL..." />;
  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300">
        <p className="font-bold">Error loading overview:</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const kpi = data?.kpi || {};
  const monthlySpend = data?.monthlySpend || [];
  const supplierSpend = data?.supplierSpend || [];
  const statusDistribution = data?.statusDistribution || [];
  const categorySpend = data?.categorySpend || [];
  const deliveryTrends = data?.deliveryTrends || [];

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Executive Procurement Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time supplier performance, procurement expenditure, quality inspection & fulfillment tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/orders"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>View Orders</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link
            to="/supplier-performance"
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all"
          >
            <Award className="w-4 h-4" />
            <span>Supplier Rankings</span>
          </Link>
        </div>
      </div>

      {/* 6 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Spend"
          value={formatINR(kpi.total_spend)}
          subtitle="Procurement value"
          change={4.8}
          isPositiveGood={true}
          icon={DollarSign}
          variant="gold"
        />

        <StatCard
          title="Purchase Orders"
          value={Number(kpi.total_orders || 0).toLocaleString()}
          subtitle="Issued across 14M"
          change={2.3}
          isPositiveGood={true}
          icon={ShoppingCart}
          variant="blue"
        />

        <StatCard
          title="Active Suppliers"
          value={kpi.active_suppliers || 25}
          subtitle="Contracted vendors"
          icon={Users}
          variant="purple"
        />

        <StatCard
          title="Avg Delivery Lead"
          value={`${kpi.avg_delivery_time_days || 0} d`}
          subtitle="Order to dispatch"
          change={-1.5}
          isPositiveGood={false}
          icon={Clock}
          variant="gold"
        />

        <StatCard
          title="On-Time Delivery"
          value={`${kpi.on_time_delivery_rate || 0}%`}
          subtitle="Delivery compliance"
          change={1.2}
          isPositiveGood={true}
          icon={CheckCircle}
          variant="emerald"
        />

        <StatCard
          title="Defect Rate"
          value={`${kpi.overall_defect_rate || 0}%`}
          subtitle="Scrap / rejected items"
          change={-0.4}
          isPositiveGood={false}
          icon={AlertTriangle}
          variant="rose"
        />
      </div>

      {/* Primary Analytics Charts Row: Monthly Spend & Supplier-wise Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Procurement Expenditure (Area Chart) */}
        <div className="lg:col-span-8 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Monthly Procurement Expenditure</h3>
              <p className="text-xs text-slate-400">Total monthly purchase order values and 14-month procurement trend</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-gold-500/10 text-gold-400 border border-gold-500/30 rounded-lg">
              Area Trend
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySpend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month_label" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `₹${(val / 10000000).toFixed(1)}Cr`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(value) => [formatINR(value), 'Spend']}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="total_spend"
                  stroke="#eab308"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#spendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* POs by Status (Donut Chart) */}
        <div className="lg:col-span-4 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Orders by Status</h3>
            <p className="text-xs text-slate-400">Current lifecycle distribution of purchase orders</p>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val, name, props) => [`${val} orders (${formatINR(props.payload.total_amount)})`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white">{kpi.total_orders}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total Orders</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
            {statusDistribution.map((st) => (
              <div key={st.status} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[st.status] || '#64748b' }} />
                <span className="text-slate-300 font-medium truncate">{st.status}:</span>
                <span className="font-bold text-white ml-auto">{st.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Charts Row: Supplier Spend & Category Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Supplier-wise Purchase Value (Bar Chart) */}
        <div className="lg:col-span-7 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Supplier-wise Purchase Value</h3>
              <p className="text-xs text-slate-400">Top vendors ranked by cumulative procurement expenditure</p>
            </div>
            <Link to="/suppliers" className="text-xs font-semibold text-gold-400 hover:underline">
              View All Suppliers →
            </Link>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={supplierSpend}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `₹${(val / 10000000).toFixed(1)}Cr`}
                />
                <YAxis
                  type="category"
                  dataKey="supplier_name"
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  width={130}
                  tickFormatter={(val) => val.length > 18 ? val.substring(0, 16) + '...' : val}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val) => [formatINR(val), 'Total Value']}
                />
                <Bar dataKey="total_value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category-wise Procurement Spend (Bar Chart) */}
        <div className="lg:col-span-5 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Category-wise Spend</h3>
              <p className="text-xs text-slate-400">Procurement spend by jewellery product classification</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg">
              6 Categories
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySpend} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `₹${(val / 10000000).toFixed(0)}Cr`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val) => [formatINR(val), 'Spend']}
                />
                <Bar dataKey="spend" radius={[6, 6, 0, 0]}>
                  {categorySpend.map((entry, index) => (
                    <Cell key={`cat-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tertiary Row: Delivery Performance Trends */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Delivery Performance Trends</h3>
            <p className="text-xs text-slate-400">Monthly on-time delivery rate compliance (%) vs average turnaround days</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-3 h-0.5 bg-emerald-400" />
              <span>On-Time Rate %</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <span className="w-3 h-0.5 bg-amber-400" />
              <span>Avg Delivery Days</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={deliveryTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month_label" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#10b981" domain={[60, 100]} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" domain={[0, 25]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="on_time_pct"
                name="On-Time Rate %"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981' }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avg_delivery_days"
                name="Avg Delivery Days"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#f59e0b' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
