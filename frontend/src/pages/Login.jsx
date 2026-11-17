import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gem, Lock, Mail, ArrowRight, Shield, BarChart3, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial gold glow */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-gold-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-200 p-0.5 shadow-[0_0_25px_rgba(234,179,8,0.35)] flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Gem className="w-7 h-7 text-gold-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white font-sans mt-2">
            AURUM <span className="gold-gradient-text">PROCURE</span>
          </h1>
          <p className="text-xs text-slate-400 tracking-wide uppercase font-semibold">
            Supplier & Procurement Performance Analytics Platform
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@jewelprocure.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500/80 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500/80 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.25)] flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo One-Click Access Badges */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
            Quick-Fill Role Logins
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@jewelprocure.com', 'admin123')}
              className="p-3 bg-slate-950/90 hover:bg-slate-800/80 border border-gold-500/30 rounded-xl text-left transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-1.5 text-gold-400 font-bold text-xs mb-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Admin User</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">admin@jewelprocure.com</p>
              <span className="text-[10px] text-emerald-400 font-medium block mt-1">Full CRUD Access</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('analyst@jewelprocure.com', 'analyst123')}
              className="p-3 bg-slate-950/90 hover:bg-slate-800/80 border border-blue-500/30 rounded-xl text-left transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs mb-1">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Procurement Analyst</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">analyst@jewelprocure.com</p>
              <span className="text-[10px] text-cyan-400 font-medium block mt-1">BI & Analytics Read</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
