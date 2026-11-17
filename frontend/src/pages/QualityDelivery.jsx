import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  AlertTriangle,
  CheckCircle,
  PackageX,
  TrendingDown,
  Layers
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { analyticsApi } from '../services/api';

function formatINR(val) {
  if (!val) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function QualityDelivery() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchQuality() {
      setLoading(true);
      setError(null);
      try {
        const res = await analyticsApi.getQualityDelivery();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch quality and delivery analytics.');
      } finally {
        setLoading(false);
      }
    }
    fetchQuality();
  }, []);

  if (loading) return <LoadingSpinner text="Computing QA inspection logs and delivery variance from MySQL..." />;
  if (error || !data) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300">
        <p className="font-bold">Error loading analytics:</p>
        <p className="text-sm">{error || 'Data unavailable.'}</p>
      </div>
    );
  }

  const { summary = {}, supplierQuality = [], deliveryPerformance = [], categoryDefects = [] } = data;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Quality Inspection & Delivery Reliability Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor incoming defect rates, scrap financial loss, delivery delays, and lead time SLA compliance.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Overall Defect Rate"
          value={`${summary.defect_rate_pct || 0}%`}
          subtitle={`${Number(summary.total_defective_qty || 0).toLocaleString()} defective units`}
          icon={AlertTriangle}
          variant="rose"
        />
        <StatCard
          title="Defect Financial Scrap"
          value={formatINR(summary.total_defect_financial_loss)}
          subtitle="Direct scrap write-off"
          icon={TrendingDown}
          variant="gold"
        />
        <StatCard
          title="Delayed Deliveries"
          value={summary.delayed_orders_count || 0}
          subtitle="Orders delivered late"
          icon={Clock}
          variant="purple"
        />
        <StatCard
          title="Avg Late Delay"
          value={`${summary.avg_delay_days || 0} days`}
          subtitle="When delivery is late"
          icon={Clock}
          variant="blue"
        />
        <StatCard
          title="Incomplete Orders"
          value={summary.incomplete_orders_count || 0}
          subtitle="Partially received POs"
          icon={PackageX}
          variant="rose"
        />
      </div>

      {/* Charts Row: Defect Rate by Vendor & Category Scrap Loss */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Defect Rate by Vendor (Bar Chart) */}
        <div className="lg:col-span-7 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Vendor Defect Rates (%)</h3>
              <p className="text-xs text-slate-400">Comparing percentage of defective units rejected during receiving inspection</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg">
              QA Threshold: 2.5%
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={supplierQuality.slice(0, 12)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} unit="%" domain={[0, 8]} />
                <YAxis
                  type="category"
                  dataKey="supplier_name"
                  stroke="#64748b"
                  tick={{ fontSize: 9 }}
                  width={130}
                  tickFormatter={(val) => val.length > 16 ? val.substring(0, 14) + '...' : val}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val) => [`${val}%`, 'Defect Rate']}
                />
                <Bar dataKey="defect_rate_pct" radius={[0, 4, 4, 0]}>
                  {supplierQuality.slice(0, 12).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.defect_rate_pct > 4.0 ? '#f43f5e' : entry.defect_rate_pct > 2.0 ? '#f59e0b' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Scrap Loss (Bar Chart) */}
        <div className="lg:col-span-5 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Scrap Financial Impact by Category</h3>
              <p className="text-xs text-slate-400">Financial scrap loss incurred across jewellery types</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg">
              Scrap Value
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDefects} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val) => [formatINR(val), 'Scrap Loss']}
                />
                <Bar dataKey="scrap_loss" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Delivery Performance & Delay Severity Matrix */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Delivery Performance & Lead Time SLA Matrix</h3>
            <p className="text-xs text-slate-400">Comparing contracted lead days vs actual turnaround and delay severity</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Supplier Code</th>
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-4 text-center">Contract SLA</th>
                <th className="py-3 px-4 text-center">Actual Lead Time</th>
                <th className="py-3 px-4 text-center">Delivered Orders</th>
                <th className="py-3 px-4 text-center">On-Time Orders</th>
                <th className="py-3 px-4 text-center">Delayed Orders</th>
                <th className="py-3 px-4 text-right">On-Time %</th>
                <th className="py-3 px-4 text-right">Avg Delay (When Late)</th>
                <th className="py-3 px-4 text-right">Max Delay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {deliveryPerformance.map((dp) => {
                const onTimeRate = parseFloat(dp.on_time_delivery_pct || 0);
                return (
                  <tr key={dp.supplier_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-gold-400 font-bold">{dp.supplier_code}</td>
                    <td className="py-3 px-4 font-semibold text-white">{dp.supplier_name}</td>
                    <td className="py-3 px-4 text-center">{dp.agreed_lead_time_days} days</td>
                    <td className="py-3 px-4 text-center font-bold text-white">{dp.avg_actual_lead_days} days</td>
                    <td className="py-3 px-4 text-center">{dp.total_dispatched_orders}</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-medium">{dp.on_time_orders}</td>
                    <td className="py-3 px-4 text-center text-rose-400 font-medium">{dp.delayed_orders}</td>
                    <td className="py-3 px-4 text-right font-bold">
                      <span className={onTimeRate >= 90 ? 'text-emerald-400' : onTimeRate >= 80 ? 'text-blue-400' : 'text-rose-400'}>
                        {onTimeRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-amber-400 font-medium">
                      {dp.avg_delay_days > 0 ? `+${dp.avg_delay_days}d` : '0d'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400">
                      {dp.max_delay_days > 0 ? `+${dp.max_delay_days}d` : '0d'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
