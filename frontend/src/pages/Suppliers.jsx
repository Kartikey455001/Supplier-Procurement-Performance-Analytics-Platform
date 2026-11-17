import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Search, Filter, Edit, ExternalLink, ShieldAlert, Star } from 'lucide-react';
import DataTable from '../components/common/DataTable';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { supplierApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

function formatINR(val) {
  if (!val) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function Suppliers() {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    supplier_name: '',
    category: 'Gold Bullion & Fine Casting',
    contact_person: '',
    email: '',
    phone: '',
    city: 'Mumbai',
    country: 'India',
    tax_id: '',
    payment_terms: 'Net 30',
    lead_time_days: 14,
    status: 'Active',
    rating: 4.5
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await supplierApi.getAll({
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
      });
      if (res.success) {
        setSuppliers(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch suppliers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [categoryFilter, statusFilter]);

  const handleOpenAddModal = () => {
    setFormData({
      supplier_name: '',
      category: 'Gold Bullion & Fine Casting',
      contact_person: '',
      email: '',
      phone: '',
      city: 'Mumbai',
      country: 'India',
      tax_id: `27AAAC${Math.floor(Math.random() * 9000 + 1000)}A1Z5`,
      payment_terms: 'Net 30',
      lead_time_days: 14,
      status: 'Active',
      rating: 4.5
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      supplier_name: supplier.supplier_name,
      category: supplier.category,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      city: supplier.city,
      country: supplier.country,
      tax_id: supplier.tax_id,
      payment_terms: supplier.payment_terms,
      lead_time_days: supplier.lead_time_days,
      status: supplier.status,
      rating: supplier.rating
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');
    try {
      if (isEditModalOpen && editingSupplier) {
        await supplierApi.update(editingSupplier.supplier_id, formData);
        setIsEditModalOpen(false);
      } else {
        await supplierApi.create(formData);
        setIsAddModalOpen(false);
      }
      await fetchSuppliers();
    } catch (err) {
      setFormError(err.message || 'Error saving supplier.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Supplier Code',
      field: 'supplier_code',
      className: 'font-mono text-gold-400 font-bold',
      render: (row) => (
        <Link to={`/suppliers/${row.supplier_id}`} className="hover:underline flex items-center gap-1">
          <span>{row.supplier_code}</span>
        </Link>
      )
    },
    {
      header: 'Supplier Name',
      field: 'supplier_name',
      className: 'font-semibold text-white',
      render: (row) => (
        <div>
          <Link to={`/suppliers/${row.supplier_id}`} className="text-white hover:text-gold-400 font-bold transition-colors">
            {row.supplier_name}
          </Link>
          <div className="text-[11px] text-slate-400">{row.contact_person} • {row.city}</div>
        </div>
      )
    },
    {
      header: 'Category',
      field: 'category',
      className: 'text-slate-300 text-xs font-medium'
    },
    {
      header: 'Orders',
      field: 'total_orders',
      className: 'text-right font-semibold',
      render: (row) => row.total_orders || 0
    },
    {
      header: 'Total Spend',
      field: 'total_spend',
      className: 'text-right font-bold text-slate-200',
      render: (row) => formatINR(row.total_spend)
    },
    {
      header: 'OTD Rate',
      field: 'on_time_delivery_rate',
      className: 'text-right',
      render: (row) => (
        <span className={`font-bold ${
          row.on_time_delivery_rate >= 90 ? 'text-emerald-400' : row.on_time_delivery_rate >= 80 ? 'text-blue-400' : 'text-rose-400'
        }`}>
          {row.on_time_delivery_rate ? `${parseFloat(row.on_time_delivery_rate).toFixed(1)}%` : '—'}
        </span>
      )
    },
    {
      header: 'Defect Rate',
      field: 'defect_rate',
      className: 'text-right',
      render: (row) => (
        <span className={`font-medium ${
          row.defect_rate <= 2 ? 'text-emerald-400' : row.defect_rate <= 4 ? 'text-amber-400' : 'text-rose-400'
        }`}>
          {row.defect_rate ? `${parseFloat(row.defect_rate).toFixed(2)}%` : '0.00%'}
        </span>
      )
    },
    {
      header: 'Reliability Score',
      field: 'reliability_score',
      className: 'text-center',
      render: (row) => (
        <div className="flex flex-col items-center">
          <span className="font-extrabold text-white text-sm">
            {row.reliability_score ? parseFloat(row.reliability_score).toFixed(1) : '—'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">/100</span>
        </div>
      )
    },
    {
      header: 'Tier',
      field: 'performance_tier',
      className: 'text-center',
      render: (row) => (
        <Badge variant={row.performance_tier || 'Watchlist'}>
          {row.performance_tier || 'Watchlist'}
        </Badge>
      )
    },
    {
      header: 'Status',
      field: 'status',
      className: 'text-center',
      render: (row) => <Badge variant={row.status}>{row.status}</Badge>
    },
    {
      header: 'Actions',
      sortable: false,
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={`/suppliers/${row.supplier_id}`}
            className="p-1.5 text-slate-400 hover:text-gold-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="View Supplier Profile"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          {isAdmin && (
            <button
              onClick={() => handleOpenEditModal(row)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Edit Supplier"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Supplier Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor vendor relationships, performance scores, contracts, lead times & quality tiers.
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.2)] flex items-center gap-2 text-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Supplier</span>
          </button>
        ) : (
          <span className="text-xs px-3 py-1.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl font-medium">
            Analyst Role (Read-Only)
          </span>
        )}
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Filter by Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
          >
            <option value="">All Supplier Categories (7)</option>
            <option value="Cut & Polished Diamonds">Cut & Polished Diamonds</option>
            <option value="Gold Bullion & Fine Casting">Gold Bullion & Fine Casting</option>
            <option value="Natural Gemstones & Pearls">Natural Gemstones & Pearls</option>
            <option value="Platinum 950 Findings & Mounts">Platinum 950 Findings & Mounts</option>
            <option value="Sterling Silver Ornaments">Sterling Silver Ornaments</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Filter by Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
          >
            <option value="">All Vendor Statuses</option>
            <option value="Active">Active</option>
            <option value="Under Review">Under Review</option>
            <option value="Suspended">Suspended</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => { setCategoryFilter(''); setStatusFilter(''); }}
            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Main Suppliers Table */}
      {loading ? (
        <LoadingSpinner text="Loading supplier performance records..." />
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300">
          <p className="font-bold">Error loading suppliers:</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={suppliers}
          searchPlaceholder="Search suppliers by name, code, contact or city..."
          defaultRowsPerPage={10}
        />
      )}

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
        title={isEditModalOpen ? `Edit Supplier: ${editingSupplier?.supplier_name}` : 'Add New Jewellery Supplier'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Supplier Name *</label>
              <input
                type="text"
                required
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                placeholder="e.g. Surat Polished Diamonds Pvt Ltd"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              >
                <option value="Cut & Polished Diamonds">Cut & Polished Diamonds</option>
                <option value="Gold Bullion & Fine Casting">Gold Bullion & Fine Casting</option>
                <option value="Natural Gemstones & Pearls">Natural Gemstones & Pearls</option>
                <option value="Platinum 950 Findings & Mounts">Platinum 950 Findings & Mounts</option>
                <option value="Sterling Silver Ornaments">Sterling Silver Ornaments</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Person *</label>
              <input
                type="text"
                required
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="e.g. Ramesh Shah"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="procurement@supplier.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98200 12345"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">City *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Surat, Mumbai, Jaipur"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">GST / Tax Identification Number *</label>
              <input
                type="text"
                required
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                placeholder="27AAAC1234A1Z5"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Terms</label>
              <select
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              >
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="Immediate">Immediate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contracted Lead Time (Days)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.lead_time_days}
                onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Supplier Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              >
                <option value="Active">Active</option>
                <option value="Under Review">Under Review</option>
                <option value="Suspended">Suspended</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Rating (1.0 - 5.0)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : isEditModalOpen ? 'Update Supplier' : 'Create Supplier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
