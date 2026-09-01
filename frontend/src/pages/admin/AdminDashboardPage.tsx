import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { formatPrice, formatDate } from '../../utils/formatters';
import {
  Package,
  ExternalLink,
  
  Eye,
  Activity,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalyticsSummary()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { metrics, topProducts, sevenDaysTimeline, recentActivity } = data;

  const statCards = [
    { label: 'Active Products', value: metrics.activeProducts, sub: `${metrics.totalProducts} Total in Catalog`, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Gumroad Checkout Clicks', value: metrics.gumroadClicks, sub: 'Total External Intent', icon: ExternalLink, color: 'text-red-400', bg: 'bg-red-500/10' },
    
    { label: 'Product Views', value: metrics.productViews, sub: 'Catalog Page Views', icon: Eye, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-[#14171F] border border-white/10 rounded-2xl p-6 shadow-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">{card.label}</p>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">{card.value}</h3>
                <p className="text-[11px] text-gray-500 mt-1">{card.sub}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: 7-Day Trend Chart & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Chart */}
        <div className="lg:col-span-2 bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading">
                External Checkout Activity (Past 7 Days)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Daily Gumroad  intent clicks</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Gumroad Clicks
              </span>
              
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-8 pb-2 border-b border-white/10">
            {sevenDaysTimeline.map((day: any, i: number) => {
              const maxVal = Math.max(1, ...sevenDaysTimeline.map((d: any) => d.gumroadClicks + d.views));
              const gumroadHeight = Math.max(8, (day.gumroadClicks / maxVal) * 100);
              
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full max-w-[28px] flex flex-col gap-1 items-center justify-end h-36">
                    <div
                      className="w-full bg-red-600 rounded-t-md group-hover:bg-red-500 transition-all"
                      style={{ height: `${gumroadHeight}%` }}
                      title={`${day.date}: ${day.gumroadClicks} Gumroad Clicks`}
                    />
                    
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">
                    {day.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Clicked Products */}
        <div className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading">
            Top Performing Products
          </h3>
          <p className="text-xs text-gray-400">Highest intent checkout conversions</p>

          <div className="space-y-3 pt-2">
            {topProducts.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">No click data logged yet.</p>
            ) : (
              topProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-xs font-bold text-white truncate">{p.title}</p>
                    <p className="text-[10px] text-gray-400">{p.views} views</p>
                  </div>
                  <span className="text-xs font-extrabold text-red-400 bg-red-600/20 px-2 py-0.5 rounded">
                    {p.clicks} clicks
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Admin Activity Log */}
      <div className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-500" />
          <span>Recent Activity & Audit Log</span>
        </h3>

        <div className="divide-y divide-white/5">
          {recentActivity.map((act: any) => (
            <div key={act.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white mr-2">[{act.action}]</span>
                <span className="text-gray-300">{act.details}</span>
                <span className="text-gray-500 ml-2 font-mono text-[10px]">by {act.userName}</span>
              </div>
              <span className="text-gray-500 font-mono text-[10px] shrink-0 ml-4">
                {formatDate(act.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
