import React from 'react';

export default function LoadingSpinner({ text = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 rounded-full border-2 border-slate-800 border-t-gold-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-gold-500/20 rounded-full animate-ping" />
        </div>
      </div>
      <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">{text}</p>
    </div>
  );
}
