import React, { useState, useEffect } from 'react';
import {
  Plus,
  ShoppingCart,
  Search,
  Filter,
  CheckSquare,
  AlertTriangle,
  Clock,
  Eye,
  Trash2,
  Calendar,
  DollarSign
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { orderApi, supplierApi, productApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

function formatINR(val) {
  if (!val) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function PurchaseOrders() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [delayedOnly, setDelayedOnly] = useState(false);
  const [incompleteOnly, setIncompleteOnly] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Suppliers & Products for Create PO
  const [availableSuppliers, setAvailableSuppliers] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  // Create PO Form state
  const [poFormData, setPoFormData] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    shipping_cost: 0,
    notes: '',
    items: [{ product_id: '', ordered_qty: 10, unit_price: 25000 }]
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Receive Goods Form state
  const [receiveInspectionData, setReceiveInspectionData] = useState({
    actual_delivery_date: new Date().toISOString().split('T')[0],
    status: 'Delivered',
    payment_status: 'Paid',
    items: []
  });
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);
  const [receiveError, setReceiveError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderApi.getAll({
        status: statusFilter || undefined,
        delayed_only: delayedOnly ? 'true' : undefined,
        incomplete_only: incompleteOnly ? 'true' : undefined,
        limit: 150
      });
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch purchase orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, delayedOnly, incompleteOnly]);

  const loadDependenciesForCreate = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        supplierApi.getAll({ status: 'Active' }),
        productApi.getAll({ limit: 125 })
      ]);
      if (supRes.success) setAvailableSuppliers(supRes.data);
      if (prodRes.success) setAvailableProducts(prodRes.data);
    } catch (err) {
      console.error('Failed to load PO dependencies:', err.message);
    }
  };

  const handleOpenCreateModal = () => {
    loadDependenciesForCreate();
    const today = new Date().toISOString().split('T')[0];
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 14);

    setPoFormData({
      supplier_id: '',
      order_date: today,
      expected_delivery_date: expDate.toISOString().split('T')[0],
      shipping_cost: 2500,
      notes: 'Standard procurement order',
      items: [{ product_id: '', ordered_qty: 10, unit_price: 45000 }]
    });
    setCreateError('');
    setIsCreateModalOpen(true);
  };

  const handleAddItemRow = () => {
    setPoFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', ordered_qty: 10, unit_price: 30000 }]
    }));
  };

  const handleRemoveItemRow = (index) => {
    if (poFormData.items.length === 1) return;
    setPoFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...poFormData.items];
    updated[index][field] = value;

    // If product changed, auto-fill unit_price from catalog
    if (field === 'product_id') {
      const prod = availableProducts.find(p => p.product_id === parseInt(value, 10));
      if (prod) {
        updated[index].unit_price = prod.base_unit_cost;
      }
    }

    setPoFormData({ ...poFormData, items: updated });
  };

  const handleCreatePoSubmit = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError('');

    // Validation
    if (!poFormData.supplier_id) {
      setCreateError('Please select a supplier.');
      setCreateSubmitting(false);
      return;
    }
    const hasInvalidItem = poFormData.items.some(i => !i.product_id || i.ordered_qty <= 0 || i.unit_price <= 0);
    if (hasInvalidItem) {
      setCreateError('Please ensure all line items have a product, positive quantity and unit price.');
      setCreateSubmitting(false);
      return;
    }

    try {
      await orderApi.create(poFormData);
      setIsCreateModalOpen(false);
      await fetchOrders();
    } catch (err) {
      setCreateError(err.message || 'Failed to create purchase order.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const res = await orderApi.getById(orderId);
      if (res.success) {
        setSelectedOrderDetails(res.data);
        setIsViewModalOpen(true);
      }
    } catch (err) {
      alert(`Error fetching order details: ${err.message}`);
    }
  };

  const handleOpenReceiveModal = async (orderId) => {
    try {
      const res = await orderApi.getById(orderId);
      if (res.success) {
        setSelectedOrderDetails(res.data);
        setReceiveInspectionData({
          actual_delivery_date: new Date().toISOString().split('T')[0],
          status: 'Delivered',
          payment_status: 'Paid',
          items: res.data.items.map(item => ({
            detail_id: item.detail_id,
            product_name: item.product_name,
            sku: item.sku,
            ordered_qty: item.ordered_qty,
            received_qty: item.received_qty > 0 ? item.received_qty : item.ordered_qty,
            defective_qty: item.defective_qty || 0
          }))
        });
        setReceiveError('');
        setIsReceiveModalOpen(true);
      }
    } catch (err) {
      alert(`Error fetching order details: ${err.message}`);
    }
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    setReceiveSubmitting(true);
    setReceiveError('');

    try {
      await orderApi.receiveGoods(selectedOrderDetails.order.po_id, receiveInspectionData);
      setIsReceiveModalOpen(false);
      await fetchOrders();
    } catch (err) {
      setReceiveError(err.message || 'Failed to submit inspection details.');
    } finally {
      setReceiveSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'PO Number',
      field: 'po_number',
      className: 'font-mono text-gold-400 font-bold',
      render: (row) => (
        <button
          onClick={() => handleViewOrder(row.po_id)}
          className="hover:underline flex items-center gap-1 font-mono text-gold-400 font-bold"
        >
          {row.po_number}
        </button>
      )
    },
    {
      header: 'Supplier',
      field: 'supplier_name',
      className: 'font-semibold text-white',
      render: (row) => (
        <div>
          <span className="text-white font-bold">{row.supplier_name}</span>
          <span className="text-[11px] text-slate-400 block">{row.supplier_category}</span>
        </div>
      )
    },
    {
      header: 'Order Date',
      field: 'order_date',
      render: (row) => new Date(row.order_date).toLocaleDateString()
    },
    {
      header: 'Expected Date',
      field: 'expected_delivery_date',
      render: (row) => (
        <div>
          <span>{new Date(row.expected_delivery_date).toLocaleDateString()}</span>
          {row.is_delayed === 1 && (
            <span className="text-[10px] font-bold text-rose-400 block">
              Delayed ({row.days_variance > 0 ? `+${row.days_variance}d` : 'Overdue'})
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      field: 'status',
      className: 'text-center',
      render: (row) => <Badge variant={row.status}>{row.status}</Badge>
    },
    {
      header: 'Amount',
      field: 'total_amount',
      className: 'text-right font-bold text-slate-200',
      render: (row) => formatINR(row.total_amount)
    },
    {
      header: 'Ordered / Recv',
      sortable: false,
      className: 'text-center',
      render: (row) => (
        <span className="font-mono text-xs">
          {row.total_received_qty} / {row.total_ordered_qty}
        </span>
      )
    },
    {
      header: 'Defects',
      field: 'total_defective_qty',
      className: 'text-center',
      render: (row) => (
        row.total_defective_qty > 0 ? (
          <span className="text-rose-400 font-bold text-xs bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
            {row.total_defective_qty} defective
          </span>
        ) : (
          <span className="text-emerald-400 text-xs">0</span>
        )
      )
    },
    {
      header: 'Payment',
      field: 'payment_status',
      className: 'text-center',
      render: (row) => <Badge variant={row.payment_status}>{row.payment_status}</Badge>
    },
    {
      header: 'Actions',
      sortable: false,
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleViewOrder(row.po_id)}
            className="p-1.5 text-slate-400 hover:text-gold-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {isAdmin && row.status !== 'Delivered' && row.status !== 'Cancelled' && (
            <button
              onClick={() => handleOpenReceiveModal(row.po_id)}
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Receive & Inspect Goods"
            >
              <CheckSquare className="w-4 h-4" />
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
            Procurement & Purchase Orders
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track order lifecycle, delivery variance, ordered vs received units, and quality inspections.
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.2)] flex items-center gap-2 text-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        ) : (
          <span className="text-xs px-3 py-1.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl font-medium">
            Analyst Role (Read-Only)
          </span>
        )}
      </div>

      {/* Filter Tabs & Quick Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1.5">
          {['', 'Pending', 'In Transit', 'Delivered', 'Partially Received', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === '' ? 'All Orders' : st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={delayedOnly}
              onChange={(e) => setDelayedOnly(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-gold-500 focus:ring-gold-500/50"
            />
            <span className={delayedOnly ? 'text-rose-400 font-bold' : ''}>Delayed Only</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={incompleteOnly}
              onChange={(e) => setIncompleteOnly(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-gold-500 focus:ring-gold-500/50"
            />
            <span className={incompleteOnly ? 'text-purple-400 font-bold' : ''}>Incomplete Only</span>
          </label>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner text="Fetching purchase orders dataset from MySQL..." />
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300">
          <p className="font-bold">Error loading orders:</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          searchPlaceholder="Search by PO number or supplier name..."
          defaultRowsPerPage={15}
        />
      )}

      {/* Create Purchase Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Jewellery Purchase Order"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreatePoSubmit} className="space-y-4">
          {createError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Supplier *</label>
              <select
                required
                value={poFormData.supplier_id}
                onChange={(e) => setPoFormData({ ...poFormData, supplier_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              >
                <option value="">-- Choose Vendor --</option>
                {availableSuppliers.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.supplier_name} ({s.supplier_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Order Date *</label>
              <input
                type="date"
                required
                value={poFormData.order_date}
                onChange={(e) => setPoFormData({ ...poFormData, order_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Expected Delivery Date *</label>
              <input
                type="date"
                required
                value={poFormData.expected_delivery_date}
                onChange={(e) => setPoFormData({ ...poFormData, expected_delivery_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400">
                Order Line Items ({poFormData.items.length})
              </h4>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {poFormData.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Product SKU / Name</label>
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="">-- Select Product --</option>
                      {availableProducts.map((p) => (
                        <option key={p.product_id} value={p.product_id}>
                          {p.sku} - {p.product_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.ordered_qty}
                      onChange={(e) => handleItemChange(idx, 'ordered_qty', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Unit Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-1 text-center pt-3">
                    <button
                      type="button"
                      disabled={poFormData.items.length === 1}
                      onClick={() => handleRemoveItemRow(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Shipping & Transit Cost (₹)</label>
              <input
                type="number"
                min="0"
                value={poFormData.shipping_cost}
                onChange={(e) => setPoFormData({ ...poFormData, shipping_cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Instructions</label>
              <input
                type="text"
                value={poFormData.notes}
                onChange={(e) => setPoFormData({ ...poFormData, notes: e.target.value })}
                placeholder="Special hallmark or packaging instructions"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
            >
              {createSubmitting ? 'Creating PO...' : 'Confirm & Place Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Purchase Order Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Purchase Order: ${selectedOrderDetails?.order?.po_number}`}
        maxWidth="max-w-3xl"
      >
        {selectedOrderDetails && (
          <div className="space-y-5">
            {/* Header summary */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Supplier</span>
                <span className="font-bold text-white">{selectedOrderDetails.order.supplier_name}</span>
                <span className="text-[10px] text-gold-400 block">{selectedOrderDetails.order.supplier_code}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Order Date</span>
                <span className="font-semibold text-white">
                  {new Date(selectedOrderDetails.order.order_date).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Expected Delivery</span>
                <span className="font-semibold text-white">
                  {new Date(selectedOrderDetails.order.expected_delivery_date).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Order Status</span>
                <Badge variant={selectedOrderDetails.order.status}>{selectedOrderDetails.order.status}</Badge>
              </div>
            </div>

            {/* Line items table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Procurement Items ({selectedOrderDetails.items.length})
              </h4>
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3 text-right">Ordered</th>
                      <th className="py-2.5 px-3 text-right">Received</th>
                      <th className="py-2.5 px-3 text-right">Defective</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {selectedOrderDetails.items.map((item) => (
                      <tr key={item.detail_id}>
                        <td className="py-2.5 px-3 font-mono text-gold-400 font-bold">{item.sku}</td>
                        <td className="py-2.5 px-3 font-medium">{item.product_name}</td>
                        <td className="py-2.5 px-3 text-right">{item.ordered_qty}</td>
                        <td className="py-2.5 px-3 text-right">{item.received_qty}</td>
                        <td className="py-2.5 px-3 text-right">
                          {item.defective_qty > 0 ? (
                            <span className="text-rose-400 font-bold">{item.defective_qty}</span>
                          ) : '0'}
                        </td>
                        <td className="py-2.5 px-3 text-right">₹{Number(item.unit_price).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-bold">{formatINR(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Totals */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Tax (3% Jewellery GST):</span>
                <span>{formatINR(selectedOrderDetails.order.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping & Insurance:</span>
                <span>{formatINR(selectedOrderDetails.order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                <span>Total PO Amount:</span>
                <span className="text-gold-400">{formatINR(selectedOrderDetails.order.total_amount)}</span>
              </div>
            </div>

            {/* Payments if any */}
            {selectedOrderDetails.payments.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Payment History ({selectedOrderDetails.payments.length})
                </h4>
                <div className="space-y-1.5">
                  {selectedOrderDetails.payments.map((p) => (
                    <div key={p.payment_id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-gold-400 font-bold">{p.payment_number}</span>
                        <span className="text-slate-400 block text-[11px]">{p.payment_method} • Ref: {p.transaction_reference}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white">{formatINR(p.amount_paid)}</span>
                        <Badge variant={p.payment_status} size="sm">{p.payment_status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Receive Goods & Quality Inspection Modal */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title={`Receive Goods & QC Inspection: ${selectedOrderDetails?.order?.po_number}`}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleReceiveSubmit} className="space-y-4">
          {receiveError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {receiveError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Actual Delivery Date</label>
              <input
                type="date"
                required
                value={receiveInspectionData.actual_delivery_date}
                onChange={(e) => setReceiveInspectionData({ ...receiveInspectionData, actual_delivery_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Updated Order Status</label>
              <select
                value={receiveInspectionData.status}
                onChange={(e) => setReceiveInspectionData({ ...receiveInspectionData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              >
                <option value="Delivered">Delivered (Complete)</option>
                <option value="Partially Received">Partially Received</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Status</label>
              <select
                value={receiveInspectionData.payment_status}
                onChange={(e) => setReceiveInspectionData({ ...receiveInspectionData, payment_status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500"
              >
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
          </div>

          {/* Line items inspection form */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400 mb-2">
              Item Inspection Quantities
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {receiveInspectionData.items.map((item, idx) => (
                <div key={item.detail_id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-12 gap-3 items-center text-xs">
                  <div className="col-span-5">
                    <span className="font-mono text-gold-400 font-bold block">{item.sku}</span>
                    <span className="text-slate-300 truncate block">{item.product_name}</span>
                    <span className="text-[10px] text-slate-400">Ordered: {item.ordered_qty} units</span>
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Received Qty</label>
                    <input
                      type="number"
                      min="0"
                      max={item.ordered_qty}
                      value={item.received_qty}
                      onChange={(e) => {
                        const updated = [...receiveInspectionData.items];
                        updated[idx].received_qty = parseInt(e.target.value, 10) || 0;
                        setReceiveInspectionData({ ...receiveInspectionData, items: updated });
                      }}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-4">
                    <label className="block text-[10px] text-rose-400 mb-0.5">Defective Qty</label>
                    <input
                      type="number"
                      min="0"
                      max={item.received_qty}
                      value={item.defective_qty}
                      onChange={(e) => {
                        const updated = [...receiveInspectionData.items];
                        updated[idx].defective_qty = parseInt(e.target.value, 10) || 0;
                        setReceiveInspectionData({ ...receiveInspectionData, items: updated });
                      }}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-rose-300 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsReceiveModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={receiveSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
            >
              {receiveSubmitting ? 'Recording Inspection...' : 'Confirm Receipt & QC'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
