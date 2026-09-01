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
} from 'lucide-react';

export const MasterStoresPage: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchStores = () => {
    setLoading(true);
    api.getSuperAdminStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handlePlanChange = async (storeId: string, newPlan: string) => {
    setUpdatingId(storeId);
    try {
      const limit = newPlan === 'scale' ? 9999 : newPlan === 'pro' ? 50 : 10;
      await fetch(`/api/stores/super/${storeId}/plan`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('gumshop_admin_token')}`,
        },
        body: JSON.stringify({ plan: newPlan, productLimit: limit }),
      });
      fetchStores();
    } catch (err: any) {
      alert('Plan update failed: ' + err.message);
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
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
            <Store className="w-6 h-6 text-indigo-400" />
            <span>Tenant Store Directory</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Manage all active e-commerce tenant storefronts on GumShop SaaS
          </p>
        </div>

        <button
          onClick={fetchStores}
          className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-bold transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-indigo-400" />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Directory Table */}
      <div className="bg-[#10121A] border border-indigo-500/20 rounded-3xl p-6 shadow-2xl space-y-6">
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
              className="w-full bg-[#07080B] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#07080B] border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <tr>
                <th className="py-3.5 px-4">Store Name &amp; URL</th>
                <th className="py-3.5 px-4">Merchant Owner</th>
                <th className="py-3.5 px-4">Active Plan Tier</th>
                <th className="py-3.5 px-4">Catalog Volume</th>
                <th className="py-3.5 px-4">Order GMV</th>
                <th className="py-3.5 px-4 text-right">Storefront</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((s: any) => (
                <tr key={s.id || s.slug} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-md shadow-indigo-950/40">
                        {s.storeName?.[0] || 'S'}
                      </div>
                      <div>
                        <span className="font-bold text-white block">{s.storeName}</span>
                        <span className="font-mono text-[11px] text-indigo-400">/store/{s.slug}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4 font-mono text-[11px] text-gray-400">{s.ownerEmail}</td>

                  <td className="py-4 px-4">
                    <select
                      disabled={updatingId === (s.id || s.slug)}
                      value={s.plan || 'free'}
                      onChange={(e) => handlePlanChange(s.id || s.slug, e.target.value)}
                      className="bg-[#07080B] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="free">Free (10 Slots)</option>
                      <option value="pro">Pro ($12/mo - 50 Slots)</option>
                      <option value="scale">Scale ($29/mo - Unlimited)</option>
                    </select>
                  </td>

                  <td className="py-4 px-4 font-bold text-white">{s.productCount || 0} Products</td>
                  <td className="py-4 px-4 font-bold text-emerald-400">{formatPrice(s.totalRevenue || 0)}</td>

                  <td className="py-4 px-4 text-right">
                    <Link
                      to={`/store/${s.slug}`}
                      target="_blank"
                      className="inline-flex items-center justify-center w-8 h-8 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg transition-colors border border-indigo-500/30"
                      title="Live Store"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
