import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Users,
  Shield,
  Server,
  Code,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { systemApi, authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/common/Badge';

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const [health, setHealth] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const healthRes = await systemApi.getHealth();
        setHealth(healthRes);

        if (isAdmin) {
          const uRes = await authApi.getUsers();
          if (uRes.success) setUsersList(uRes.data);
        }
      } catch (err) {
        console.error('Settings load error:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isAdmin]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            System Settings & Architecture
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Database connection status, user role permissions, analytical views & mathematical models.
          </p>
        </div>
      </div>

      {/* Database Connection Status Card */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-gold-400" />
            <h3 className="text-base font-bold text-white tracking-tight">MySQL 8.0 Live Connection</h3>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {health?.database === 'connected' ? 'Connected & Healthy' : 'Online'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="text-slate-400">Database Engine</span>
            <p className="font-semibold text-white">MySQL 8.0 Community</p>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="text-slate-400">Host & Port</span>
            <p className="font-semibold text-white font-mono">127.0.0.1:3307</p>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="text-slate-400">Database Schema</span>
            <p className="font-semibold text-white font-mono">jewellery_procurement_db</p>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="text-slate-400">Backend API</span>
            <p className="font-semibold text-emerald-400 font-mono">Express.js (Port 5000)</p>
          </div>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2">
          <span className="font-bold text-white block">Active Relational Tables & Views:</span>
          <div className="flex flex-wrap gap-2">
            {[
              'Suppliers (25 rows)',
              'Products (125 rows)',
              'Purchase_Orders (1,250 rows)',
              'Procurement_Details (3,101 rows)',
              'Supplier_Payments (1,179 rows)',
              'Users (2 rows)',
              'vw_supplier_performance',
              'vw_monthly_procurement',
              'vw_supplier_quality',
              'vw_delivery_performance',
              'vw_procurement_cost_analysis'
            ].map((tbl) => (
              <span key={tbl} className="px-2.5 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-300 font-mono text-[11px]">
                {tbl}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* User Management & Role Control */}
      {isAdmin && usersList.length > 0 && (
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <Users className="w-5 h-5 text-gold-400" />
            <h3 className="text-base font-bold text-white tracking-tight">Active User Accounts</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-center">Role</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {usersList.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-white">{u.full_name}</td>
                    <td className="py-2.5 px-3 font-mono text-gold-400">{u.username}</td>
                    <td className="py-2.5 px-3 text-slate-300">{u.email}</td>
                    <td className="py-2.5 px-3">{u.department}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant={u.is_active ? 'Active' : 'Inactive'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Model Definition & Scoring Rules */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight">Business Logic & Weighting Standards</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
            <span className="font-bold text-emerald-400 block">On-Time Delivery (40%)</span>
            <p className="text-slate-300">
              Evaluates punctuality based on whether the actual delivery date occurred on or before the contractual expected delivery date.
            </p>
            <p className="text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
              Score = (On-Time POs / Completed POs) × 100
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
            <span className="font-bold text-cyan-400 block">Quality Compliance (35%)</span>
            <p className="text-slate-300">
              Quantifies physical receiving QA acceptance percentage. Deducts rejected defect units against total units inspected.
            </p>
            <p className="text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
              Score = 100 - ((Defective / Received) × 100)
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
            <span className="font-bold text-purple-400 block">Order Fulfilment (25%)</span>
            <p className="text-slate-300">
              Measures quantity fulfillment accuracy, rewarding suppliers that dispatch 100% of the purchase order quantity.
            </p>
            <p className="text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
              Score = (Received Units / Ordered Units) × 100
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
