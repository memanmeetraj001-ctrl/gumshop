import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { formatPrice, formatDate } from '../../utils/formatters';
import {
  Store,
  Search,
  ExternalLink,
  Shield,
  Zap,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Sparkles,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react';

export const MasterStoresPage: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // New Store Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreEmail, setNewStoreEmail] = useState('');
  const [newStorePassword, setNewStorePassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchStores = () => {
    setLoading(true);
    api.getSuperAdminStats()
      .then((res) => {
        setStats(res);
      })
      .catch((err) => {
        console.error('Failed to load stores:', err);
        setStats(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handlePlanChange = async (storeId: string, newPlan: string) => {
    setUpdatingId(storeId);
    setActionMessage(null);
    try {
      const limit = newPlan === 'scale' ? 9999 : newPlan === 'pro' ? 50 : 10;
      await api.updateStorePlan(storeId, newPlan, limit);
      setActionMessage(`Updated ${storeId} plan to ${newPlan.toUpperCase()} (${limit} products cap)`);
      fetchStores();
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
      fetchStores();
    } catch (err: any) {
      alert('Status update failed: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newStoreEmail || !newStorePassword) {
      setCreateError('Please fill in all fields.');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      await api.register({
        storeName: newStoreName.trim(),
        email: newStoreEmail.trim(),
        password: newStorePassword,
      });

      setShowCreateModal(false);
      setNewStoreName('');
      setNewStoreEmail('');
      setNewStorePassword('');
      setActionMessage(`New merchant storefront created successfully!`);
      fetchStores();
    } catch (err: any) {
      setCreateError(err.message || 'Store creation failed');
    } finally {
      setCreating(false);
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
              <Store className="w-6 h-6 text-indigo-400" />
              <span>Tenant Store Directory</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
              Multi-Tenant CMS
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Manage all active e-commerce tenant storefronts on GumShop SaaS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Provision Store</span>
          </button>

          <button
            onClick={fetchStores}
            disabled={loading}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-bold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing…' : 'Refresh Directory'}</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-400 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Directory Table */}
      <div className="bg-[#12141C] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {filtered.length} Registered Merchant Storefronts
          </span>

          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search stores, emails, or slugs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#0A0A0F] border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <tr>
                <th className="py-3.5 px-4">Store Name &amp; URL</th>
                <th className="py-3.5 px-4">Merchant Owner</th>
                <th className="py-3.5 px-4">Active Plan Tier</th>
                <th className="py-3.5 px-4">Catalog Volume</th>
                <th className="py-3.5 px-4">Order GMV</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Storefront</th>
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
                  <td className="py-4 px-4 font-mono text-[11px] text-gray-400">
                    {s.ownerEmail || 'admin@gumshop.online'}
                  </td>
                  <td className="py-4 px-4">
                    <select
                      value={s.plan || 'free'}
                      onChange={(e) => handlePlanChange(s.id || s.slug, e.target.value)}
                      disabled={updatingId === (s.id || s.slug)}
                      className="bg-[#0A0A0F] border border-white/10 text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="free">Free (10 Cap)</option>
                      <option value="pro">Pro (50 Cap)</option>
                      <option value="scale">Scale (Unlimited)</option>
                    </select>
                  </td>
                  <td className="py-4 px-4 font-bold text-white">
                    {s.productCount || 0} Products
                  </td>
                  <td className="py-4 px-4 font-bold text-emerald-400">
                    {formatPrice(s.totalRevenue || 0)} ({s.orderCount || 0} leads)
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
                    <Link
                      to={`/store/${s.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 font-bold rounded-lg text-xs transition-colors border border-indigo-500/30"
                    >
                      <span>Storefront</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No store accounts found matching &quot;{search}&quot;.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                    <span>Loading store directory…</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Store Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#141722] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Provision New Storefront</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStore} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Store Name</label>
                <input
                  type="text"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="e.g. Apex Apparel Co."
                  className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Merchant Owner Email</label>
                <input
                  type="email"
                  value={newStoreEmail}
                  onChange={(e) => setNewStoreEmail(e.target.value)}
                  placeholder="merchant@example.com"
                  className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Account Password</label>
                <input
                  type="password"
                  value={newStorePassword}
                  onChange={(e) => setNewStorePassword(e.target.value)}
                  placeholder="Set initial password"
                  className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {creating ? 'Provisioning…' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
