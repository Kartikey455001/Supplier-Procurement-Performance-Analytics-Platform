import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { reportApi, supplierApi, productApi } from '../services/api';

function formatINR(val) {
  if (!val) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function Reports() {
  const [reportsData, setReportsData] = useState([]);
  const [summary, setSummary] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter criteria
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  // Dropdown options
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const res = await supplierApi.getAll();
        if (res.success) setSuppliers(res.data);
      } catch (err) {
        console.error('Failed to load suppliers for report filter:', err);
      }
    }
    loadSuppliers();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportApi.generate({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        supplier_id: supplierId || undefined,
        category: category || undefined,
        status: status || undefined,
        limit: 100
      });
      if (res.success) {
        setReportsData(res.data);
        setSummary(res.summary || {});
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, supplierId, category, status]);

  const handleExportCsv = () => {
    const params = {
      startDate: startDate || '',
      endDate: endDate || '',
      supplier_id: supplierId || '',
      category: category || '',
      status: status || ''
    };
    const url = reportApi.exportCsvUrl(params);
    window.open(url, '_blank');
  };

  const handleApplyPreset = (presetName) => {
    if (presetName === 'delayed') {
      setStatus('Delivered');
      setCategory('');
      setSupplierId('');
    } else if (presetName === 'diamonds') {
      setCategory('Rings');
      setStatus('');
    } else if (presetName === 'clear') {
      setStartDate('');
      setEndDate('');
      setSupplierId('');
      setCategory('');
      setStatus('');
    }
  };

  const columns = [
    {
      header: 'PO Number',
      field: 'po_number',
      className: 'font-mono text-gold-400 font-bold'
    },
    {
      header: 'Order Date',
      field: 'order_date',
      render: (row) => new Date(row.order_date).toLocaleDateString()
    },
    {
      header: 'Supplier',
      field: 'supplier_name',
      className: 'font-semibold text-white'
    },
    {
      header: 'Product Category',
      field: 'product_category',
      className: 'text-slate-300'
    },
    {
      header: 'SKU / Product',
      field: 'product_name',
      render: (row) => (
        <div>
          <span className="text-white font-medium">{row.product_name}</span>
          <span className="text-[10px] text-slate-400 font-mono block">{row.sku} • {row.metal_type}</span>
        </div>
      )
    },
    {
      header: 'Ordered',
      field: 'ordered_qty',
      className: 'text-right'
    },
    {
      header: 'Received',
      field: 'received_qty',
      className: 'text-right'
    },
    {
      header: 'Defective',
      field: 'defective_qty',
      className: 'text-right',
      render: (row) => (
        row.defective_qty > 0 ? (
          <span className="text-rose-400 font-bold">{row.defective_qty}</span>
        ) : '0'
      )
    },
    {
      header: 'Line Total',
      field: 'line_total',
      className: 'text-right font-bold text-white',
      render: (row) => formatINR(row.line_total)
    },
    {
      header: 'Delivery SLA',
      field: 'delivery_status',
      className: 'text-center',
      render: (row) => <Badge variant={row.delivery_status}>{row.delivery_status}</Badge>
    },
    {
      header: 'Status',
      field: 'order_status',
      className: 'text-center',
      render: (row) => <Badge variant={row.order_status}>{row.order_status}</Badge>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Dynamic Procurement Reports & CSV Export
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Filter procurement history, inspect line item details, and download Excel-compatible CSV spreadsheets.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center gap-2 text-xs transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Filtered to CSV</span>
        </button>
      </div>

      {/* Filter Builder Panel */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Filter className="w-4 h-4 text-gold-400" />
            <span>Report Parameters & Slicers</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => handleApplyPreset('clear')}
              className="text-slate-400 hover:text-white underline text-[11px]"
            >
              Reset All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Supplier</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.supplier_id} value={s.supplier_id}>
                  {s.supplier_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Product Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
            >
              <option value="">All Categories</option>
              <option value="Rings">Rings</option>
              <option value="Necklaces">Necklaces</option>
              <option value="Bracelets">Bracelets</option>
              <option value="Earrings">Earrings</option>
              <option value="Bangles">Bangles</option>
              <option value="Pendants">Pendants</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Order Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
            >
              <option value="">All Statuses</option>
              <option value="Delivered">Delivered</option>
              <option value="In Transit">In Transit</option>
              <option value="Pending">Pending</option>
              <option value="Partially Received">Partially Received</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filtered Summary Aggregate Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Filtered Orders</span>
          <span className="text-xl font-black text-white">{Number(summary.total_orders || 0).toLocaleString()}</span>
        </div>
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Filtered Spend</span>
          <span className="text-xl font-black text-gold-400">{formatINR(summary.total_report_spend)}</span>
        </div>
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Units Procured</span>
          <span className="text-xl font-black text-white">{Number(summary.total_received_qty || 0).toLocaleString()}</span>
        </div>
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Filtered Defect Rate</span>
          <span className="text-xl font-black text-rose-400">{summary.defect_rate_pct || 0}%</span>
        </div>
      </div>

      {/* Reports Data Table */}
      {loading ? (
        <LoadingSpinner text="Generating filtered report records..." />
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300">
          <p className="font-bold">Error loading report:</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={reportsData}
          searchPlaceholder="Search within filtered results..."
          defaultRowsPerPage={20}
          onExportCsv={handleExportCsv}
        />
      )}
    </div>
  );
}
