import React from 'react';

export default function ScoreGauge({ score, size = 120, strokeWidth = 10, label = 'Score' }) {
  const normalizedScore = Math.min(100, Math.max(0, parseFloat(score) || 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  let color = '#f43f5e'; // High Risk
  let tier = 'High Risk';
  if (normalizedScore >= 90) {
    color = '#10b981'; // Elite
    tier = 'Elite';
  } else if (normalizedScore >= 80) {
    color = '#3b82f6'; // Reliable
    tier = 'Reliable';
  } else if (normalizedScore >= 70) {
    color = '#f59e0b'; // Watchlist
    tier = 'Watchlist';
  }

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white tracking-tight">
          {normalizedScore.toFixed(1)}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
      <div className="mt-2 text-center">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}20`, color: color }}
        >
          {tier}
        </span>
      </div>
    </div>
  );
}
