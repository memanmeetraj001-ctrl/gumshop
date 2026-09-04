import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { formatPrice, formatDate } from '../../utils/formatters';
import {
  Package,
  ExternalLink,
  Eye,
  Activity,
  ShoppingBag,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Plus,
  Palette,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = () => {
    setLoading(true);
    api.getAnalyticsSummary()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading || !data) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-gray-400">Loading merchant analytics…</p>
      </div>
    );
  }

  const { metrics, topProducts, sevenDaysTimeline, recentActivity } = data;

  const statCards = [
    {
      label: 'Active Inventory',
      value: metrics.activeProducts,
      sub: `${metrics.totalProducts} items total`,
      icon: Package,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      badge: 'Catalog Ready',
    },
    {
      label: 'Gumroad Checkout Clicks',
      value: metrics.gumroadClicks,
      sub: 'External purchase intent',
      icon: ExternalLink,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/20',
      badge: 'High Intent',
    },
    {
      label: 'Storefront Pageviews',
      value: metrics.productViews,
      sub: 'Catalog impressions',
      icon: Eye,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      badge: 'Live Visitors',
    },
    {
      label: 'Captured Customer Leads',
      value: metrics.ordersCount || 0,
      sub: 'Delivery addresses saved',
      icon: Truck,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      badge: '100% Retained',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── Top Header & Quick Actions Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
            Merchant Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-heading tracking-tight mt-0.5">
            Store Overview &amp; Analytics
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/products/new"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-lg shadow-indigo-900/40 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Link>

          <Link
            to="/admin/gumroad"
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white font-bold text-xs uppercase rounded-xl border border-white/10 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-pink-400" />
            <span>Gumroad Sync</span>
          </Link>

          <Link
            to="/store/demo"
            target="_blank"
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white font-bold text-xs uppercase rounded-xl border border-white/10 transition-colors flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Storefront ↗</span>
          </Link>
        </div>
      </div>

      {/* ── 1. Bento KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`bg-[#11131C]/90 backdrop-blur-md border ${card.border} hover:border-white/20 rounded-2xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between group`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                  {card.label}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${card.bg} ${card.color} border border-white/5`}>
                  {card.badge}
                </span>
              </div>

              <div className="my-3">
                <h3 className="text-3xl font-black text-white font-heading tracking-tight">
                  {card.value}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5 font-mono">{card.sub}</p>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                <span className="group-hover:text-white transition-colors">Real-time sync</span>
                <div className={`w-6 h-6 rounded-lg ${card.bg} ${card.color} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 2. 7-Day Activity Trend Chart & Top Products ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Chart */}
        <div className="lg:col-span-2 bg-[#11131C]/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
                Storefront Traffic
              </span>
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading mt-0.5">
                Gumroad Purchase Intent (Past 7 Days)
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-pink-400">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" /> Gumroad Clicks
              </span>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-8 pb-2 border-b border-white/10">
            {sevenDaysTimeline.map((day: any, i: number) => {
              const maxVal = Math.max(1, ...sevenDaysTimeline.map((d: any) => d.gumroadClicks + d.views));
              const gumroadHeight = Math.max(8, (day.gumroadClicks / maxVal) * 100);

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="w-full max-w-[32px] flex flex-col gap-1 items-center justify-end h-36">
                    <div
                      className="w-full bg-gradient-to-t from-pink-600 to-purple-600 rounded-t-md group-hover:brightness-125 transition-all shadow-md"
                      style={{ height: `${gumroadHeight}%` }}
                      title={`${day.date}: ${day.gumroadClicks} Gumroad Clicks`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 group-hover:text-white">
                    {day.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Direct Checkout Tracking Active
            </span>
            <Link to="/admin/analytics" className="text-indigo-400 hover:underline font-bold">
              Full Analytics Report →
            </Link>
          </div>
        </div>

        {/* Top Products Card */}
        <div className="bg-[#11131C]/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
              High Conversion
            </span>
            <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading mt-0.5">
              Top Catalog Performers
            </h3>
          </div>

          <div className="space-y-2.5 my-auto">
            {topProducts && topProducts.length > 0 ? (
              topProducts.slice(0, 4).map((p: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2.5 bg-[#07080C] border border-white/5 hover:border-white/15 rounded-xl flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-8 h-8 rounded-lg bg-black/50 overflow-hidden shrink-0">
                      <img
                        src={p.thumbnail || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                      <span className="text-[10px] font-mono text-gray-400">{formatPrice(p.price)}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-pink-400 block">{p.gumroadClicks || 0}</span>
                    <span className="text-[9px] text-gray-500 uppercase block">Clicks</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-gray-500">
                No catalog activity recorded yet.
              </div>
            )}
          </div>

          <Link
            to="/admin/products"
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl text-center border border-white/10 transition-colors block"
          >
            Manage Catalog →
          </Link>
        </div>
      </div>
    </div>
  );
};
