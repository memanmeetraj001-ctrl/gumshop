import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck, Store, CreditCard, Users, Settings,
  LayoutDashboard, LogOut, Menu, X, ArrowUpRight, Globe,
} from 'lucide-react';

export const MasterAdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const masterNavLinks = [
    { label: 'Platform Overview & MRR', path: '/super-admin', emoji: '📊' },
    { label: 'Store Tenant Directory', path: '/super-admin/stores', emoji: '🏪' },
    { label: 'SaaS Billing & Webhooks', path: '/super-admin/billing', emoji: '💳' },
    { label: 'Admins & Store Owners', path: '/super-admin/users', emoji: '👥' },
    { label: 'Global Platform Settings', path: '/super-admin/settings', emoji: '⚙️' },
  ];

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div className="min-h-screen bg-[#07080B] text-gray-200 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F1118] border-r border-indigo-500/20 flex flex-col justify-between transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="h-20 flex items-center px-6 border-b border-indigo-500/20 gap-3 bg-gradient-to-r from-indigo-950/50 to-transparent">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-xl shadow-indigo-900/50 text-lg">👑</div>
            <div>
              <span className="text-base font-black text-white tracking-wider uppercase flex items-center gap-1.5">
                <span>GumShop</span>
                <span className="px-1.5 py-0.5 text-[9px] bg-indigo-500 text-white rounded font-bold uppercase tracking-widest">Master</span>
              </span>
              <span className="block text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Platform Executive</span>
            </div>
          </div>

          <div className="mx-4 mt-4 px-3 py-2 bg-emerald-950/30 border border-emerald-500/20 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Platform Live \u00B7 gumshop.online</span>
          </div>

          <nav className="p-4 space-y-1 mt-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400/60 px-3 py-1 block">SaaS Administration</span>
            {masterNavLinks.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-950/50' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <span className="text-sm shrink-0">{item.emoji}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-5">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-3 py-1 block">Store Operations</span>
              <Link to="/admin/dashboard" className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 border border-white/5 transition-all mt-1">
                <span className="flex items-center gap-2"><span className="text-sm">🛍️</span><span>Merchant Store CMS</span></span>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-500" />
              </Link>
              <a href="/store/demo" target="_blank" rel="noreferrer" className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 transition-all mt-1">
                <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-400" /><span>View Live Storefront</span></span>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-500" />
              </a>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-indigo-500/20 bg-black/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md shadow-indigo-900/40">
                {user?.name?.[0] || 'M'}
              </div>
              <div className="overflow-hidden text-xs">
                <p className="font-bold text-white truncate">{user?.name || 'Master Admin'}</p>
                <p className="text-[10px] text-indigo-400 font-bold uppercase truncate">Platform Owner</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <header className="h-16 border-b border-indigo-500/20 bg-[#0F1118] flex items-center justify-between px-4 lg:hidden sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="text-lg">👑</span>
            <span className="font-bold text-white uppercase text-sm">Master Platform Admin</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-gray-400 hover:text-white rounded-lg bg-white/5">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>
        <main className="p-4 sm:p-8 flex-1 max-w-7xl w-full mx-auto"><Outlet /></main>
      </div>

      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm" />}
    </div>
  );
};
