import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ExternalLink, MousePointerClick } from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.getAnalyticsSummary().then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading">Clicks & Analytics Tracker</h2>
        <p className="text-xs text-gray-400">Real-time checkout click tracking for Gumroad orders</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-[#14171F] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-400">Total Checkout Intent</span>
            <MousePointerClick className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-3xl font-black text-white mt-2">{data.metrics.totalCheckoutClicks}</h3>
        </div>

        <div className="bg-[#14171F] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-400">Gumroad Clicks</span>
            <ExternalLink className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-3xl font-black text-white mt-2">{data.metrics.gumroadClicks}</h3>
        </div>
      </div>
    </div>
  );
};
