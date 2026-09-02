import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Sparkles, LayoutDashboard, Store } from 'lucide-react';
import { api } from '../../api/client';

export const BillingSuccessPage: React.FC = () => {
  const [plan, setPlan] = useState<string>('pro');

  useEffect(() => {
    // Poll plan after redirect to reflect upgraded status
    api
      .getBillingPlan()
      .then((data) => {
        if (data?.plan) setPlan(data.plan);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#07080B] flex items-center justify-center p-6 text-gray-200">
      <div className="max-w-md w-full bg-[#14171F] border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-indigo-950/50">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            <span>Payment Successful</span>
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight font-heading">
            Welcome to {plan.toUpperCase()}!
          </h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            Your subscription has been activated via Lemon Squeezy. Your new product limits and features are available immediately.
          </p>
        </div>

        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-left space-y-2 text-xs">
          <div className="flex justify-between items-center text-gray-300">
            <span>Active Tier</span>
            <span className="font-bold text-emerald-400 uppercase">{plan} Plan</span>
          </div>
          <div className="flex justify-between items-center text-gray-300">
            <span>Payment Status</span>
            <span className="font-semibold text-white">Paid &amp; Active</span>
          </div>
          <div className="flex justify-between items-center text-gray-300">
            <span>Provider</span>
            <span className="font-semibold text-white">Lemon Squeezy</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            to="/admin/dashboard"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Go to Store Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/admin/products"
            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 transition-all"
          >
            <Store className="w-4 h-4" />
            <span>Manage Products</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
