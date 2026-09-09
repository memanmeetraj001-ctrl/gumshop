import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Affiliate } from '../../types';
import {
  Users,
  DollarSign,
  TrendingUp,
  MousePointerClick,
  Plus,
  Search,
  Check,
  Copy,
  ExternalLink,
  Edit2,
  Trash2,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Gift,
  ShieldAlert,
} from 'lucide-react';

export const MasterAffiliatesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Aggregate stats
  const [stats, setStats] = useState({
    totalPartners: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalUnpaidCommissions: 0,
    totalPaidCommissions: 0,
  });

  const [affiliates, setAffiliates] = useState<(Affiliate & { activeReferredStoresCount?: number })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: '',
    email: '',
    customCode: '',
    commissionRate: 20, // 20% default
    payoutAddress: '',
    payoutMethod: 'paypal' as 'paypal' | 'gumroad' | 'stripe' | 'wire',
    notes: '',
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);

  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutTarget, setPayoutTarget] = useState<Affiliate | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutNote, setPayoutNote] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMasterAffiliates();
      setStats({
        totalPartners: res.totalPartners || 0,
        totalClicks: res.totalClicks || 0,
        totalConversions: res.totalConversions || 0,
        totalUnpaidCommissions: res.totalUnpaidCommissions || 0,
        totalPaidCommissions: res.totalPaidCommissions || 0,
      });
      setAffiliates(res.affiliates || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load affiliates data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const handleCopyLink = (code: string) => {
    const link = `https://gumshop.online/?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartner.email) return;

    try {
      setActionLoading(true);
      setError(null);
      await api.createMasterAffiliate({
        ...newPartner,
        commissionRate: newPartner.commissionRate / 100, // convert 20 -> 0.20
      });
      setSuccessMsg('VIP Creator Partner successfully onboarded!');
      setCreateModalOpen(false);
      setNewPartner({
        name: '',
        email: '',
        customCode: '',
        commissionRate: 20,
        payoutAddress: '',
        payoutMethod: 'paypal',
        notes: '',
      });
      await fetchAffiliates();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create partner.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAffiliate) return;

    try {
      setActionLoading(true);
      setError(null);
      await api.updateMasterAffiliate(editingAffiliate.id, {
        name: editingAffiliate.name,
        commissionRate: editingAffiliate.commissionRate,
        status: editingAffiliate.status,
        payoutAddress: editingAffiliate.payoutAddress,
        payoutMethod: editingAffiliate.payoutMethod,
        notes: editingAffiliate.notes,
      });
      setSuccessMsg('Partner details updated successfully.');
      setEditModalOpen(false);
      setEditingAffiliate(null);
      await fetchAffiliates();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update partner.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutTarget || !payoutAmount) return;

    try {
      setActionLoading(true);
      setError(null);
      await api.payoutMasterAffiliate(payoutTarget.id, parseFloat(payoutAmount), payoutNote);
      setSuccessMsg(`Payout of $${payoutAmount} recorded for ${payoutTarget.name || payoutTarget.email}.`);
      setPayoutModalOpen(false);
      setPayoutTarget(null);
      setPayoutAmount('');
      setPayoutNote('');
      await fetchAffiliates();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to record payout.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePartner = async (aff: Affiliate) => {
    if (!window.confirm(`Are you sure you want to delete partner "${aff.name || aff.email}" (${aff.code})?`)) return;

    try {
      setActionLoading(true);
      await api.deleteMasterAffiliate(aff.id);
      setSuccessMsg('Partner removed successfully.');
      await fetchAffiliates();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete partner.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAffiliates = affiliates.filter((aff) => {
    const matchesQuery =
      aff.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      aff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (aff.name && aff.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || aff.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤝</span>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight font-heading">
              Affiliates & Creator Partners
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Manage creator educators, 20% recurring rev-share payouts, and referral attribution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAffiliates}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-950/50 hover:scale-[1.02] transition-transform"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard VIP Partner</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Platform Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-[#0F1118] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
            <span>Total Partners</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{stats.totalPartners}</p>
          <p className="text-[10px] text-gray-500">Active creators & influencers</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F1118] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
            <span>Referral Clicks</span>
            <MousePointerClick className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{stats.totalClicks.toLocaleString()}</p>
          <p className="text-[10px] text-purple-400">Total traffic generated</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F1118] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
            <span>Stores Converted</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{stats.totalConversions}</p>
          <p className="text-[10px] text-blue-400">
            {stats.totalClicks > 0 ? `${((stats.totalConversions / stats.totalClicks) * 100).toFixed(1)}% Conversion Rate` : '0% Conversion Rate'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
            <span>Unpaid Commissions</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            ${stats.totalUnpaidCommissions.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-300/80">Pending partner payouts</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F1118] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs font-bold">
            <span>Total Paid Out</span>
            <CreditCard className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-black text-gray-300 font-mono">
            ${stats.totalPaidCommissions.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-500">Historical settled rewards</p>
        </div>
      </div>

      {/* Directory Filter & Search */}
      <div className="p-6 rounded-3xl bg-[#0F1118] border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by creator name, email, or referral code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {(['all', 'active', 'paused'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Affiliates Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3 px-4">Partner & Email</th>
                <th className="py-3 px-4">Referral Code & Link</th>
                <th className="py-3 px-4">Performance</th>
                <th className="py-3 px-4">Commission %</th>
                <th className="py-3 px-4">Unpaid Due</th>
                <th className="py-3 px-4">Payout Address</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAffiliates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    {loading ? 'Loading partners...' : 'No affiliate partners found matching your search.'}
                  </td>
                </tr>
              ) : (
                filteredAffiliates.map((aff) => {
                  const isCopied = copiedCode === aff.code;
                  return (
                    <tr key={aff.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4 font-medium">
                        <div className="space-y-0.5">
                          <p className="text-white font-bold">{aff.name || 'Anonymous Creator'}</p>
                          <p className="text-gray-400 font-mono text-[11px]">{aff.email}</p>
                          {aff.notes && <p className="text-[10px] text-indigo-400 truncate max-w-xs">{aff.notes}</p>}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                            {aff.code}
                          </span>
                          <button
                            onClick={() => handleCopyLink(aff.code)}
                            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Copy link"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-500 block truncate max-w-[160px]">
                          ?ref={aff.code}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-0.5 font-mono">
                          <p className="text-white">
                            <span className="font-bold">{aff.totalClicks || 0}</span> <span className="text-gray-500 text-[10px]">clicks</span>
                          </p>
                          <p className="text-emerald-400 font-bold">
                            {aff.totalConversions || 0} <span className="text-emerald-400/70 text-[10px]">stores</span>
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-indigo-300">
                        {Math.round((aff.commissionRate || 0.20) * 100)}%
                      </td>

                      <td className="py-4 px-4 font-mono">
                        <span className={`font-black ${aff.unpaidEarnings > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                          ${(aff.unpaidEarnings || 0).toFixed(2)}
                        </span>
                        {aff.paidEarnings > 0 && (
                          <span className="text-[10px] text-gray-500 block">
                            Paid: ${aff.paidEarnings.toFixed(2)}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="text-[11px] font-mono">
                          <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 mr-1">
                            {aff.payoutMethod || 'paypal'}
                          </span>
                          <span className="text-gray-300">{aff.payoutAddress || aff.email}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            aff.status === 'active'
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                              : aff.status === 'paused'
                              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                              : 'bg-red-500/10 border border-red-500/30 text-red-400'
                          }`}
                        >
                          {aff.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {aff.unpaidEarnings > 0 && (
                            <button
                              onClick={() => {
                                setPayoutTarget(aff);
                                setPayoutAmount(aff.unpaidEarnings.toString());
                                setPayoutModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[11px] font-bold transition-colors"
                              title="Record Payout"
                            >
                              💰 Pay
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingAffiliate(aff);
                              setEditModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Edit Partner"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePartner(aff)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Delete Partner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Onboard VIP Partner */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0F1118] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white uppercase font-heading">
                Onboard VIP Creator Partner
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-gray-500 hover:text-white font-bold text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-300">Creator / Channel Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ali Ecom Academy"
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="creator@youtube.com"
                  value={newPartner.email}
                  onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-300">Custom Code (Handle)</label>
                  <input
                    type="text"
                    placeholder="e.g. aliecom"
                    value={newPartner.customCode}
                    onChange={(e) => setNewPartner({ ...newPartner, customCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-300">Commission Rate (%)</label>
                  <input
                    type="number"
                    min={5}
                    max={80}
                    value={newPartner.commissionRate}
                    onChange={(e) => setNewPartner({ ...newPartner, commissionRate: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Payout Address (PayPal / Gumroad)</label>
                <input
                  type="text"
                  placeholder="payout@paypal.com"
                  value={newPartner.payoutAddress}
                  onChange={(e) => setNewPartner({ ...newPartner, payoutAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Internal Notes</label>
                <input
                  type="text"
                  placeholder="VIP YouTuber 100k subscribers"
                  value={newPartner.notes}
                  onChange={(e) => setNewPartner({ ...newPartner, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Partner */}
      {editModalOpen && editingAffiliate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0F1118] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white uppercase font-heading">
                Edit Partner ({editingAffiliate.code})
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-500 hover:text-white font-bold text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdatePartner} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-300">Partner Name</label>
                <input
                  type="text"
                  value={editingAffiliate.name || ''}
                  onChange={(e) => setEditingAffiliate({ ...editingAffiliate, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-300">Commission Rate</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="0.80"
                    value={editingAffiliate.commissionRate}
                    onChange={(e) => setEditingAffiliate({ ...editingAffiliate, commissionRate: parseFloat(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white font-mono font-bold text-emerald-400"
                  />
                  <span className="text-[10px] text-gray-500 block">0.20 = 20% rev-share</span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-300">Partner Status</label>
                  <select
                    value={editingAffiliate.status}
                    onChange={(e) => setEditingAffiliate({ ...editingAffiliate, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white font-bold"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Payout Address</label>
                <input
                  type="text"
                  value={editingAffiliate.payoutAddress || ''}
                  onChange={(e) => setEditingAffiliate({ ...editingAffiliate, payoutAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Internal Notes & History</label>
                <textarea
                  rows={3}
                  value={editingAffiliate.notes || ''}
                  onChange={(e) => setEditingAffiliate({ ...editingAffiliate, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Payout */}
      {payoutModalOpen && payoutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0F1118] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white uppercase font-heading flex items-center gap-2">
                <span>💰 Record Commission Payout</span>
              </h3>
              <button onClick={() => setPayoutModalOpen(false)} className="text-gray-500 hover:text-white font-bold text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayout} className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 space-y-1">
                <p className="font-bold">Partner: {payoutTarget.name || payoutTarget.email}</p>
                <p className="text-[11px] font-mono text-emerald-200">
                  Send payout to: <strong>{payoutTarget.payoutAddress || payoutTarget.email}</strong> ({payoutTarget.payoutMethod || 'PayPal'})
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Payout Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-emerald-500/40 rounded-xl text-white font-mono text-lg font-black text-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Transaction ID / Reference Note</label>
                <input
                  type="text"
                  placeholder="e.g. PayPal TXN#987123445"
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white font-mono"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider disabled:opacity-50"
                >
                  {actionLoading ? 'Recording...' : 'Confirm & Settle Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
