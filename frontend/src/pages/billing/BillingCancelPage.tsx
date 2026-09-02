import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Zap } from 'lucide-react';

export const BillingCancelPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#07080B] flex items-center justify-center p-6 text-gray-200">
      <div className="max-w-md w-full bg-[#14171F] border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
          <HelpCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight font-heading">
            Checkout Not Completed
          </h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            No worries! You were not charged, and your current store plan has not been changed. You can upgrade anytime.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            to="/admin/upgrade"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40 transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>Try Upgrading Again</span>
          </Link>

          <Link
            to="/admin/dashboard"
            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
