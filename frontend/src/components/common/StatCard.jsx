import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({
  title,
  value,
  subtitle,
  change,
  isPositiveGood = true,
  icon: Icon,
  badgeText,
  variant = 'gold'
}) {
  const isPositive = typeof change === 'number' && change > 0;
  const isNegative = typeof change === 'number' && change < 0;
  const isNeutral = typeof change === 'number' && change === 0;

  const isGood = isPositiveGood ? isPositive : isNegative;

  const glowStyles = {
    gold: 'border-gold-500/20 hover:border-gold-500/40 hover:shadow-[0_0_20px_rgba(234,179,8,0.12)]',
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]',
    blue: 'border-blue-500/20 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.12)]',
    purple: 'border-purple-500/20 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.12)]',
    rose: 'border-rose-500/20 hover:border-rose-500/40 hover:shadow-[0_0_20px_rgba(244,63,94,0.12)]',
  };

  const iconBgStyles = {
    gold: 'bg-gold-500/10 text-gold-400 border border-gold-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
  };

  return (
    <div className={`relative p-5 rounded-2xl bg-slate-900/80 backdrop-blur-md border transition-all duration-300 ${glowStyles[variant] || glowStyles.gold}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${iconBgStyles[variant] || iconBgStyles.gold}`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5">
          {change !== undefined && (
            <span className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded ${
              isGood 
                ? 'text-emerald-400 bg-emerald-500/10' 
                : 'text-rose-400 bg-rose-500/10'
            }`}>
              {isPositive && <TrendingUp className="w-3 h-3 mr-0.5" />}
              {isNegative && <TrendingDown className="w-3 h-3 mr-0.5" />}
              {isNeutral && <Minus className="w-3 h-3 mr-0.5" />}
              {Math.abs(change)}%
            </span>
          )}
          <span className="text-slate-400 line-clamp-1">{subtitle}</span>
        </div>
        {badgeText && (
          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}
