import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { formatPrice, formatDate } from '../../utils/formatters';
import {
  ShieldCheck,
  Store,
  Package,
  DollarSign,
  ExternalLink,
  Users,
  Search,
  CheckCircle2,
  RefreshCw,
  Zap,
  Globe,
  Sliders,
} from 'lucide-react';

export const SuperAdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStats = () => {
    setLoading(true);
    api.getSuperAdminStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const stores = stats?.stores || [];
  const filtered = stores.filter((s: any) =>
    s.storeName?.toLowerCase().includes(search.toLowerCase()) ||
    s.ownerEmail?.toLowerCase().includes(search.toLowerCase()) ||
    s.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span>GumShop SaaS Platform Overview</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Super-admin metrics and active tenant storefront management
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-bold transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Platform Stats</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
            <Store className="w-4 h-4 text-indigo-400" />
            <span>Total Active Stores</span>
          </span>
          <h3 className="text-3xl font-black text-white mt-2">{stats?.totalStores || 1}</h3>
          <p className="text-[11px] text-gray-500 mt-1">Registered tenant accounts</p>
        </div>

        <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-400" />
            <span>Total Catalog Products</span>
          </span>
          <h3 className="text-3xl font-black text-white mt-2">{stats?.totalProducts || 5}</h3>
          <p className="text-[11px] text-gray-500 mt-1">Across all tenant storefronts</p>
        </div>

        <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Customer Leads Captured</span>
          </span>
          <h3 className="text-3xl font-black text-emerald-400 mt-2">{stats?.totalOrders || 0} Leads</h3>
          <p className="text-[11px] text-gray-500 mt-1">Pre-checkout customer shipping orders</p>
        </div>
      </div>

      {/* Stores Table */}
      <div className="bg-[#14141E] border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading">
              Registered Store Tenants
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Live storefronts created by store owners on GumShop
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search stores, emails, or slugs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#0A0A0F] border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <tr>
                <th className="py-3.5 px-4">Store Name &amp; Slug</th>
                <th className="py-3.5 px-4">Owner Email</th>
                <th className="py-3.5 px-4">Plan</th>
                <th className="py-3.5 px-4">Active Items</th>
                <th className="py-3.5 px-4">Customer Leads</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((s: any) => (
                <tr key={s.id || s.slug} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
                        {s.storeName?.[0] || 'S'}
                      </div>
                      <div>
                        <span className="font-bold text-white block">{s.storeName || 'GumShop Store'}</span>
                        <span className="font-mono text-[11px] text-gray-500">/store/{s.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-400 font-mono text-[11px]">{s.ownerEmail || 'admin@gumshop.online'}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      s.plan === 'scale'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : s.plan === 'pro'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'bg-white/5 text-gray-400 border border-white/10'
                    }`}>
                      {s.plan || 'Free'} ({s.productLimit || 10} Cap)
                    </span>
                  </td>
                  <td className="py-4 px-4 font-bold text-white">{s.productCount || 0} Products</td>
                  <td className="py-4 px-4 font-bold text-emerald-400">{s.orderCount || 0} Orders</td>
                  <td className="py-4 px-4 text-right">
                    <Link
                      to={`/store/${s.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 font-bold rounded-lg text-xs transition-colors border border-indigo-500/30"
                    >
                      <span>Visit Store</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No store accounts found matching &quot;{search}&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
