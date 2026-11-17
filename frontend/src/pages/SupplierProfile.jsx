import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  DollarSign,
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertTriangle,
  Award,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import ScoreGauge from '../components/common/ScoreGauge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { supplierApi } from '../services/api';

function formatINR(val) {
  if (!val) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function SupplierProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        const res = await supplierApi.getById(id);
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load supplier profile.');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [id]);

  if (loading) return <LoadingSpinner text="Fetching supplier deep-dive scorecard..." />;
  if (error || !data) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300">
        <p className="font-bold">Error loading profile:</p>
        <p className="text-sm">{error || 'Supplier not found.'}</p>
        <Link to="/suppliers" className="text-xs text-gold-400 hover:underline mt-2 inline-block">
          ← Back to Suppliers
        </Link>
      </div>
    );
  }

  const { profile, recentOrders, monthlySpend } = data;

  const otdScore = parseFloat(profile.on_time_delivery_rate || 0);
  const qualityScore = parseFloat(profile.quality_score || 0);
  const fulScore = parseFloat(profile.fulfilment_rate || 0);
  const reliabilityScore = parseFloat(profile.reliability_score || 0);

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <Link
          to="/suppliers"
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-gold-400">{profile.supplier_code}</span>
            <Badge variant={profile.performance_tier}>{profile.performance_tier}</Badge>
            <Badge variant={profile.status}>{profile.status}</Badge>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">{profile.supplier_name}</h2>
        </div>
      </div>

      {/* Supplier Profile Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Metadata & Contact Info */}
        <div className="lg:col-span-8 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Vendor Specifications</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
              <span className="text-slate-400">Category</span>
              <p className="font-semibold text-white truncate">{profile.category}</p>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
              <span className="text-slate-400">City / Country</span>
              <p className="font-semibold text-white">{profile.city}, {profile.country}</p>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
              <span className="text-slate-400">Payment Terms</span>
              <p className="font-semibold text-white">{profile.payment_terms}</p>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
              <span className="text-slate-400">Contract Lead Days</span>
              <p className="font-semibold text-white">{profile.lead_time_days} Days</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Building className="w-4 h-4 text-gold-400 shrink-0" />
              <span>Contact: <strong className="text-white">{profile.contact_person}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Mail className="w-4 h-4 text-gold-400 shrink-0" />
              <span className="truncate">{profile.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Phone className="w-4 h-4 text-gold-400 shrink-0" />
              <span>{profile.phone}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 flex items-center justify-between">
            <span>Tax / GST ID: <strong className="text-slate-300 font-mono">{profile.tax_id}</strong></span>
            <span>Registered since: {new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Right: Supplier Reliability Scorecard with Gauge */}
        <div className="lg:col-span-4 p-6 bg-slate-900/90 border border-gold-500/30 rounded-2xl shadow-xl backdrop-blur-md flex flex-col items-center justify-between gold-border-glow">
          <div className="w-full text-center pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400">
              Supplier Reliability Model
            </h3>
            <p className="text-[11px] text-slate-400">Weighted Performance Score</p>
          </div>

          <div className="py-4">
            <ScoreGauge score={reliabilityScore} size={130} label="Reliability" />
          </div>

          {/* Formula breakdown */}
          <div className="w-full space-y-1.5 text-[11px] bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">OTD Score (40%):</span>
              <span className="font-bold text-white">{otdScore.toFixed(1)}% ({((otdScore * 0.40)).toFixed(1)} pts)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Quality Score (35%):</span>
              <span className="font-bold text-white">{qualityScore.toFixed(1)}% ({((qualityScore * 0.35)).toFixed(1)} pts)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Fulfilment Score (25%):</span>
              <span className="font-bold text-white">{fulScore.toFixed(1)}% ({((fulScore * 0.25)).toFixed(1)} pts)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Procurement Spend"
          value={formatINR(profile.total_spend)}
          subtitle="Cumulative PO value"
          icon={DollarSign}
          variant="gold"
        />
        <StatCard
          title="Total Orders"
          value={profile.total_orders || 0}
          subtitle={`${profile.completed_orders || 0} Delivered`}
          icon={ShoppingCart}
          variant="blue"
        />
        <StatCard
          title="Avg Turnaround"
          value={`${profile.avg_delivery_days || 0} d`}
          subtitle={`Contract: ${profile.lead_time_days}d`}
          icon={Clock}
          variant="purple"
        />
        <StatCard
          title="On-Time Delivery"
          value={`${otdScore.toFixed(1)}%`}
          subtitle={`${profile.on_time_orders || 0} on-time POs`}
          icon={CheckCircle}
          variant="emerald"
        />
        <StatCard
          title="Defect Rate"
          value={`${profile.defect_rate ? parseFloat(profile.defect_rate).toFixed(2) : 0}%`}
          subtitle={`${formatINR(profile.total_defect_cost)} scrap`}
          icon={AlertTriangle}
          variant="rose"
        />
      </div>

      {/* Monthly Spend Chart */}
      {monthlySpend.length > 0 && (
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Monthly Procurement Spend with Vendor</h3>
              <p className="text-xs text-slate-400">Historical purchase volume trends</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-gold-500/10 text-gold-400 border border-gold-500/30 rounded-lg">
              Spend History
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySpend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="supSpendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
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
                  formatter={(val) => [formatINR(val), 'Spend']}
                />
                <Area
                  type="monotone"
                  dataKey="monthly_spend"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#supSpendGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Purchase Orders Table */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Purchase Orders History</h3>
            <p className="text-xs text-slate-400">Recent purchase orders fulfilled or placed with this supplier</p>
          </div>
          <Link to={`/orders?supplier_id=${id}`} className="text-xs font-semibold text-gold-400 hover:underline">
            View All in PO Manager →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Expected Date</th>
                <th className="py-3 px-4">Actual Delivery</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Delivery Status</th>
                <th className="py-3 px-4 text-right">Defects</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {recentOrders.map((po) => {
                const isLate = po.delay_days > 0;
                return (
                  <tr key={po.po_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gold-400">{po.po_number}</td>
                    <td className="py-3 px-4 text-slate-300">{new Date(po.order_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-slate-300">{new Date(po.expected_delivery_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {po.actual_delivery_date ? new Date(po.actual_delivery_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={po.status}>{po.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-bold">{formatINR(po.total_amount)}</td>
                    <td className="py-3 px-4 text-center">
                      {po.actual_delivery_date ? (
                        isLate ? (
                          <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                            +{po.delay_days}d Late
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            On-Time
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-400">In Schedule</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {po.total_defective_items > 0 ? (
                        <span className="text-rose-400 font-bold">{po.total_defective_items} defective</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">0</span>
                      )}
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
