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
  CreditCard,
  Settings,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';

export const SuperAdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchStats = () => {
    setLoading(true);
    api.getSuperAdminStats()
      .then((res) => {
        setStats(res);
      })
      .catch((err) => {
        console.error('Failed to load super admin stats:', err);
        setStats(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handlePlanChange = async (storeId: string, newPlan: string) => {
    setUpdatingId(storeId);
    setActionMessage(null);
    try {
      const limit = newPlan === 'scale' ? 9999 : newPlan === 'pro' ? 50 : 10;
      await api.updateStorePlan(storeId, newPlan, limit);
      setActionMessage(`Updated plan for store to ${newPlan.toUpperCase()} (${limit} products cap)`);
      fetchStats();
    } catch (err: any) {
      alert('Plan update failed: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleStatus = async (storeId: string) => {
    setUpdatingId(storeId);
    setActionMessage(null);
    try {
      const res = await api.toggleStoreStatus(storeId);
      setActionMessage(`Store status is now ${res.isActive ? 'ACTIVE' : 'SUSPENDED'}`);
      fetchStats();
    } catch (err: any) {
      alert('Status update failed: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

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
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              <span>Master Admin Platform Overview</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
              Super Admin Control
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Global metrics, tenant stores directory, recurring billing, and platform controls
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/super-admin/billing"
            className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>SaaS Billing Hub</span>
          </Link>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-bold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing…' : 'Refresh Stats'}</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-400 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#12141C] border border-white/10 rounded-3xl p-5 shadow-xl">
          <span className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
            <Store className="w-4 h-4 text-indigo-400" />
            <span>Total Tenant Stores</span>
          </span>
          <h3 className="text-3xl font-black text-white mt-2">{stats?.totalStores ?? (loading ? '—' : 1)}</h3>
          <p className="text-[11px] text-gray-500 mt-1">Active e-commerce merchants</p>
        </div>

        <div className="bg-[#12141C] border border-white/10 rounded-3xl p-5 shadow-xl">
          <span className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-400" />
            <span>Platform Products</span>
          </span>
          <h3 className="text-3xl font-black text-white mt-2">{stats?.totalProducts ?? (loading ? '—' : 5)}</h3>
          <p className="text-[11px] text-gray-500 mt-1">Across all merchant catalogs</p>
        </div>

        <div className="bg-[#12141C] border border-white/10 rounded-3xl p-5 shadow-xl">
          <span className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Customer Leads Captured</span>
          </span>
          <h3 className="text-3xl font-black text-emerald-400 mt-2">{stats?.totalOrders ?? (loading ? '—' : 0)} Orders</h3>
          <p className="text-[11px] text-gray-500 mt-1">Pre-checkout shipping addresses</p>
        </div>

        <div className="bg-[#12141C] border border-white/10 rounded-3xl p-5 shadow-xl">
          <span className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>Gross Platform Volume</span>
          </span>
          <h3 className="text-3xl font-black text-amber-400 mt-2">
            {formatPrice(stats?.totalRevenue || 0)}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">Total customer checkout value</p>
        </div>
      </div>

      {/* Stores Table */}
      <div className="bg-[#12141C] border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading">
              Registered Merchant Storefronts
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage plans, live store domains, and permissions for each tenant
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
                <th className="py-3.5 px-4">Current Plan</th>
                <th className="py-3.5 px-4">Catalog / Leads</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((s: any) => (
                <tr key={s.id || s.slug} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase border border-indigo-500/20 shrink-0">
                        {s.storeName?.[0] || 'S'}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-white block truncate">{s.storeName || 'GumShop Store'}</span>
                        <a
                          href={`/store/${s.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[11px] text-indigo-400 hover:underline inline-flex items-center gap-1"
                        >
                          <span>/store/{s.slug}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-400 font-mono text-[11px]">
                    {s.ownerEmail || 'admin@gumshop.online'}
                  </td>
                  <td className="py-4 px-4">
                    <select
                      value={s.plan || 'free'}
                      onChange={(e) => handlePlanChange(s.id || s.slug, e.target.value)}
                      disabled={updatingId === (s.id || s.slug)}
                      className="bg-[#0A0A0F] border border-white/10 text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="free">Free Tier (10 Limit)</option>
                      <option value="pro">Pro Creator (50 Limit)</option>
                      <option value="scale">Unlimited Scale</option>
                    </select>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-0.5">
                      <span className="font-bold text-white block">{s.productCount || 0} Products</span>
                      <span className="text-[11px] text-emerald-400 font-semibold">{s.orderCount || 0} Customer Orders</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(s.id || s.slug)}
                      disabled={updatingId === (s.id || s.slug)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                        s.isActive !== false
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${s.isActive !== false ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                      <span>{s.isActive !== false ? 'Active' : 'Suspended'}</span>
                    </button>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        to={`/store/${s.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 font-bold rounded-lg text-xs transition-colors border border-indigo-500/30"
                      >
                        <span>Storefront</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No store accounts found matching &quot;{search}&quot;.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                    <span>Loading platform metrics…</span>
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
