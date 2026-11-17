import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  TrendingUp,
  Award,
  ShieldCheck,
  FileSpreadsheet,
  UploadCloud,
  Settings,
  Gem,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth();

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Suppliers', path: '/suppliers', icon: Users },
    { name: 'Purchase Orders', path: '/orders', icon: ShoppingCart },
    { name: 'Cost Analytics', path: '/procurement-analytics', icon: TrendingUp },
    { name: 'Supplier Performance', path: '/supplier-performance', icon: Award },
    { name: 'Quality & Delivery', path: '/quality-analysis', icon: ShieldCheck },
    { name: 'Reports & Export', path: '/reports', icon: FileSpreadsheet },
    { name: 'CSV Data Center', path: '/csv-center', icon: UploadCloud },
    { name: 'Settings & DB Info', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950/95 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand Logo & Name */}
        <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-200 p-0.5 shadow-[0_0_15px_rgba(234,179,8,0.25)] flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Gem className="w-5 h-5 text-gold-400" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5 font-sans">
                AURUM <span className="text-gold-400 font-extrabold">PROCURE</span>
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Jewellery Analytics</p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Analytics & Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-gold-500/20 to-amber-500/10 text-gold-400 border border-gold-500/30 shadow-[0_0_12px_rgba(234,179,8,0.1)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Live System Status Pill */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Database:</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                MySQL 8.0 Live
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Access Level:</span>
              <span className="font-semibold text-gold-400 capitalize">Enterprise Admin</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
