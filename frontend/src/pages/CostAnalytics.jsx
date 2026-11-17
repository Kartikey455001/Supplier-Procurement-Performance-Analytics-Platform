import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  PieChart as PieIcon,
  BarChart3,
  Scale
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Cell
} from 'recharts';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { analyticsApi } from '../services/api';

function formatINR(val) {
  if (!val) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function CostAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCost() {
      setLoading(true);
      setError(null);
      try {
        const res = await analyticsApi.getCost();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch cost analytics.');
      } finally {
        setLoading(false);
      }
    }
    fetchCost();
  }, []);

  if (loading) return <LoadingSpinner text="Crunching financial procurement aggregates from MySQL..." />;
  if (error || !data) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300">
        <p className="font-bold">Error loading cost analytics:</p>
        <p className="text-sm">{error || 'Data unavailable.'}</p>
      </div>
    );
  }

  const { momTrends = [], pareto = [], categoryCost = [], costVariation = [] } = data;

  const totalSpend = pareto.reduce((acc, p) => acc + parseFloat(p.spend || 0), 0);
  const top3Spend = pareto.slice(0, 3).reduce((acc, p) => acc + parseFloat(p.spend || 0), 0);
  const top3Concentration = totalSpend > 0 ? ((top3Spend / totalSpend) * 100).toFixed(1) : 0;

  const latestMonth = momTrends[momTrends.length - 1] || {};

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Cost & Expenditure Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Procurement expenditure trends, Month-over-Month (MoM) expansion, supplier concentration & price variance.
          </p>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Procurement Spend"
          value={formatINR(totalSpend)}
          subtitle="All historical orders"
          icon={DollarSign}
          variant="gold"
        />
        <StatCard
          title="Latest Month Spend"
          value={formatINR(latestMonth.monthly_spend)}
          subtitle={latestMonth.month_label}
          change={parseFloat(latestMonth.mom_growth_pct || 0)}
          isPositiveGood={false}
          icon={TrendingUp}
          variant="blue"
        />
        <StatCard
          title="Top 3 Vendor Share"
          value={`${top3Concentration}%`}
          subtitle="Spend concentration"
          icon={Layers}
          variant="purple"
        />
        <StatCard
          title="Active Metal Categories"
          value={categoryCost.length}
          subtitle="Jewellery & Gemstones"
          icon={Scale}
          variant="emerald"
        />
      </div>

      {/* Row 1: MoM Growth Velocity & Cumulative Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* MoM Growth Chart */}
        <div className="lg:col-span-7 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Month-over-Month (MoM) Spend Velocity</h3>
              <p className="text-xs text-slate-400">Monthly spend volume and percentage growth rate (using SQL LAG)</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-gold-500/10 text-gold-400 border border-gold-500/30 rounded-lg">
              MoM Analysis
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={momTrends} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month_label" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="spend"
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `₹${(val / 10000000).toFixed(1)}Cr`}
                />
                <YAxis
                  yAxisId="growth"
                  orientation="right"
                  stroke="#3b82f6"
                  unit="%"
                  domain={[-30, 40]}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val, name) => [
                    name === 'Monthly Spend' ? formatINR(val) : `${val}%`,
                    name
                  ]}
                />
                <Bar yAxisId="spend" dataKey="monthly_spend" name="Monthly Spend" fill="#eab308" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="growth"
                  type="monotone"
                  dataKey="mom_growth_pct"
                  name="MoM Growth %"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#3b82f6' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cumulative Running Spend */}
        <div className="lg:col-span-5 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Cumulative Running Spend</h3>
              <p className="text-xs text-slate-400">Total running budget consumed over 14 months</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg">
              Running Total
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={momTrends} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                <defs>
                  <linearGradient id="cumSpendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month_label" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `₹${(val / 10000000).toFixed(0)}Cr`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val) => [formatINR(val), 'Cumulative Spend']}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative_spend"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#cumSpendGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Supplier Spend Pareto Analysis */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Supplier Spend Pareto Analysis (80/20 Rule)
            </h3>
            <p className="text-xs text-slate-400">
              Vendor procurement expenditure vs cumulative share (%) to identify vital few suppliers
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg">
            Pareto Principle
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={pareto.slice(0, 15)} margin={{ top: 10, right: 30, bottom: 25, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="supplier_name"
                stroke="#64748b"
                tick={{ fontSize: 9 }}
                angle={-25}
                textAnchor="end"
                interval={0}
                tickFormatter={(val) => val.length > 14 ? val.substring(0, 12) + '...' : val}
              />
              <YAxis
                yAxisId="spend"
                stroke="#64748b"
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => `₹${(val / 10000000).toFixed(1)}Cr`}
              />
              <YAxis
                yAxisId="pct"
                orientation="right"
                stroke="#ec4899"
                domain={[0, 100]}
                unit="%"
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                formatter={(val, name) => [
                  name === 'Spend' ? formatINR(val) : `${val}%`,
                  name
                ]}
              />
              <Bar yAxisId="spend" dataKey="spend" name="Spend" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Line
                yAxisId="pct"
                type="monotone"
                dataKey="cumulative_pct"
                name="Cumulative %"
                stroke="#ec4899"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#ec4899' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Category Cost Breakdown & Cost Variations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category & Metal Breakdown Table */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
          <h3 className="text-base font-bold text-white tracking-tight">Category & Metal Cost Breakdown</h3>
          <p className="text-xs text-slate-400">Total units ordered, average unit price and total spend by metal purity</p>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Metal / Purity</th>
                  <th className="py-2.5 px-3 text-right">Units</th>
                  <th className="py-2.5 px-3 text-right">Avg Unit Cost</th>
                  <th className="py-2.5 px-3 text-right">Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {categoryCost.map((cc, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">{cc.product_category}</td>
                    <td className="py-2.5 px-3 text-gold-400 font-medium">{cc.metal_type} ({cc.purity})</td>
                    <td className="py-2.5 px-3 text-right">{Number(cc.total_units_ordered).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-medium">₹{Number(cc.avg_unit_price).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-white">{formatINR(cc.total_procurement_spend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supplier Cost Variation Matrix */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
          <h3 className="text-base font-bold text-white tracking-tight">Supplier Price Variations</h3>
          <p className="text-xs text-slate-400">Comparing average unit pricing charged across suppliers for identical categories</p>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Supplier Name</th>
                  <th className="py-2.5 px-3 text-right">Avg Price</th>
                  <th className="py-2.5 px-3 text-right">Min Price</th>
                  <th className="py-2.5 px-3 text-right">Max Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {costVariation.slice(0, 15).map((cv, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">{cv.product_category}</td>
                    <td className="py-2.5 px-3 text-slate-300 truncate max-w-[140px]">{cv.supplier_name}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-gold-400">₹{Number(cv.avg_unit_price).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400">₹{Number(cv.min_unit_price).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-rose-400">₹{Number(cv.max_unit_price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
