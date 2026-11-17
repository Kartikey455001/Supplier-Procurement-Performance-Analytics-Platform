import React from 'react';

export default function Badge({ children, variant = 'default', size = 'md' }) {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-bold',
  };

  const variantMap = {
    // Tiers
    'Elite': 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    'Reliable': 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    'Watchlist': 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    'High Risk': 'bg-rose-500/15 text-rose-400 border border-rose-500/30',

    // Order Statuses
    'Delivered': 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    'In Transit': 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
    'Pending': 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    'Partially Received': 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    'Cancelled': 'bg-rose-500/15 text-rose-400 border border-rose-500/30',

    // Payment Statuses
    'Paid': 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    'Partially Paid': 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    'Unpaid': 'bg-slate-700/50 text-slate-300 border border-slate-600',

    // General
    'Active': 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    'Inactive': 'bg-slate-700/50 text-slate-400 border border-slate-600',
    'Under Review': 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    'Suspended': 'bg-rose-500/15 text-rose-400 border border-rose-500/30',

    // Delivery Flags
    'On-Time': 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    'Delayed': 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    'Overdue': 'bg-rose-600/20 text-rose-300 border border-rose-500/50 animate-pulse',

    'default': 'bg-slate-800 text-slate-300 border border-slate-700'
  };

  const chosenStyle = variantMap[variant] || variantMap[children] || variantMap['default'];

  return (
    <span className={`inline-flex items-center rounded-full uppercase tracking-wider ${sizeClasses[size] || sizeClasses.md} ${chosenStyle}`}>
      {children}
    </span>
  );
}
