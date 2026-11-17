import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Info
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
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

const TIER_COLORS = {
  'Elite': '#10b981',
  'Reliable': '#3b82f6',
  'Watchlist': '#f59e0b',
  'High Risk': '#f43f5e'
};

export default function SupplierPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'top10', 'bottom10'

  useEffect(() => {
    async function fetchPerformance() {
      setLoading(true);
      setError(null);
      try {
        const res = await analyticsApi.getSuppliers();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch supplier performance data.');
      } finally {
        setLoading(false);
      }
    }
    fetchPerformance();
  }, []);

  if (loading) return <LoadingSpinner text="Computing supplier reliability score matrix from MySQL..." />;
  if (error || !data) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300">
        <p className="font-bold">Error loading performance analytics:</p>
        <p className="text-sm">{error || 'Data unavailable.'}</p>
      </div>
    );
  }

  const { rankings, top10, bottom10, scatterData, tierCounts } = data;

  const displayedList = activeTab === 'top10' ? top10 : activeTab === 'bottom10' ? bottom10 : rankings;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Supplier Performance & Reliability Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Objective evaluation based on On-Time Delivery (40%), Quality Compliance (35%), and Order Fulfilment (25%).
          </p>
        </div>
      </div>

      {/* Formula Explanation Banner */}
      <div className="p-4 bg-slate-900/90 border border-gold-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 gold-border-glow">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gold-500/10 rounded-xl text-gold-400 border border-gold-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Official Reliability Scoring Formula
            </h4>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              Score = (<span className="text-emerald-400 font-bold">On-Time %</span> × 40%) + (<span className="text-cyan-400 font-bold">Quality %</span> × 35%) + (<span className="text-purple-400 font-bold">Fulfilment %</span> × 25%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Elite (≥90)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            Reliable (80–89)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Watchlist (70–79)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            High Risk (&lt;70)
          </span>
        </div>
      </div>

      {/* 4 Performance Tier Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Elite Suppliers"
          value={tierCounts.Elite || 0}
          subtitle="Score ≥ 90.0"
          badgeText="Tier 1"
          variant="emerald"
        />
        <StatCard
          title="Reliable Suppliers"
          value={tierCounts.Reliable || 0}
          subtitle="Score 80.0 - 89.9"
          badgeText="Tier 2"
          variant="blue"
        />
        <StatCard
          title="Watchlist Suppliers"
          value={tierCounts.Watchlist || 0}
          subtitle="Score 70.0 - 79.9"
          badgeText="Tier 3"
          variant="gold"
        />
        <StatCard
          title="High Risk Suppliers"
          value={tierCounts['High Risk'] || 0}
          subtitle="Score < 70.0"
          badgeText="Tier 4"
          variant="rose"
        />
      </div>

      {/* Scatter Chart: On-Time Delivery Rate vs Quality Score */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Supplier Matrix: Delivery Compliance vs Quality Compliance
            </h3>
            <p className="text-xs text-slate-400">
              Quadrant analysis showing On-Time Delivery Rate (%) on X-axis vs Quality Inspection Score (%) on Y-axis
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-gold-500/10 text-gold-400 border border-gold-500/30 rounded-lg">
            25 Suppliers Mapped
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                type="number"
                dataKey="otd"
                name="On-Time Delivery Rate"
                unit="%"
                domain={[65, 100]}
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                label={{ value: 'On-Time Delivery Rate (%)', position: 'bottom', fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="quality"
                name="Quality Score"
                unit="%"
                domain={[90, 100]}
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                label={{ value: 'Quality Score (%)', angle: -90, position: 'left', fill: '#94a3b8', fontSize: 12 }}
              />
              <ZAxis type="number" dataKey="spend" range={[60, 400]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="p-3 bg-slate-950 border border-slate-700 rounded-xl shadow-xl text-xs space-y-1">
                        <p className="font-bold text-white">{d.name}</p>
                        <p className="text-gold-400 font-mono text-[11px]">{d.code} • {d.tier}</p>
                        <div className="pt-1 border-t border-slate-800 space-y-0.5">
                          <p className="text-slate-300">Reliability Score: <strong className="text-white">{d.reliability.toFixed(1)}</strong></p>
                          <p className="text-slate-300">On-Time Rate: <strong className="text-emerald-400">{d.otd.toFixed(1)}%</strong></p>
                          <p className="text-slate-300">Quality Score: <strong className="text-cyan-400">{d.quality.toFixed(1)}%</strong></p>
                          <p className="text-slate-300">Fulfilment: <strong className="text-purple-400">{d.fulfilment.toFixed(1)}%</strong></p>
                          <p className="text-slate-300">Total Spend: <strong className="text-white">{formatINR(d.spend)}</strong></p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter data={scatterData}>
                {scatterData.map((entry, index) => (
                  <Cell
                    key={`scatter-${index}`}
                    fill={TIER_COLORS[entry.tier] || '#3b82f6'}
                    stroke="#ffffff"
                    strokeWidth={1}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rankings Table with Tab Toggle */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Supplier Reliability League Table</h3>
            <p className="text-xs text-slate-400">Live rankings calculated by SQL weighted score</p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'all' ? 'bg-gold-500/20 text-gold-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Suppliers ({rankings.length})
            </button>
            <button
              onClick={() => setActiveTab('top10')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'top10' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Top 10 Performers
            </button>
            <button
              onClick={() => setActiveTab('bottom10')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'bottom10' ? 'bg-rose-500/20 text-rose-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bottom 10 Performers
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 text-center">Rank</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Orders</th>
                <th className="py-3 px-4 text-right">Total Spend</th>
                <th className="py-3 px-4 text-right">OTD Rate (40%)</th>
                <th className="py-3 px-4 text-right">Quality (35%)</th>
                <th className="py-3 px-4 text-right">Fulfilment (25%)</th>
                <th className="py-3 px-4 text-center">Reliability Score</th>
                <th className="py-3 px-4 text-center">Tier</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {displayedList.map((sup, idx) => {
                const rank = activeTab === 'bottom10' ? rankings.length - 10 + idx + 1 : idx + 1;
                return (
                  <tr key={sup.supplier_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                        rank <= 3 ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40' : 'text-slate-400'
                      }`}>
                        #{rank}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      <Link to={`/suppliers/${sup.supplier_id}`} className="hover:text-gold-400 transition-colors">
                        {sup.supplier_name}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-mono block">{sup.supplier_code} • {sup.city}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-xs">{sup.supplier_category}</td>
                    <td className="py-3 px-4 text-right font-medium">{sup.total_orders}</td>
                    <td className="py-3 px-4 text-right font-bold">{formatINR(sup.total_spend)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">
                      {parseFloat(sup.on_time_delivery_rate).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-cyan-400">
                      {parseFloat(sup.quality_score).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-purple-400">
                      {parseFloat(sup.fulfilment_rate).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-extrabold text-white text-base">
                        {parseFloat(sup.reliability_score).toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={sup.performance_tier}>{sup.performance_tier}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/suppliers/${sup.supplier_id}`}
                        className="p-1.5 text-slate-400 hover:text-gold-400 hover:bg-slate-800 rounded-lg inline-block transition-colors"
                        title="View Profile"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
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
