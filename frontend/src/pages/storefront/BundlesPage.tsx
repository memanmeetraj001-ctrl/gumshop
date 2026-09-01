import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Bundle } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { ExternalLink, Sparkles, ShieldCheck } from 'lucide-react';

export const BundlesPage: React.FC = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);

  useEffect(() => {
    api.getBundles().then(setBundles).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0C0F] py-12 text-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-1.5 rounded-full inline-block mb-3">
            CURATED PACKS
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase font-heading">
            Exclusive Gear &amp; Workspace Bundles
          </h1>
          <p className="text-sm sm:text-base text-gray-400 mt-3">
            Pair your essential daily gear together and save up to 55% with free worldwide express delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="bg-[#14171F] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
            >
              <div className="relative aspect-video bg-black">
                <img src={bundle.image} alt={bundle.name} className="w-full h-full object-cover" />
                {bundle.badge && (
                  <div className="absolute top-4 left-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-lg">
                    {bundle.badge}
                  </div>
                )}
              </div>

              <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase font-heading">{bundle.name}</h2>
                  <p className="text-sm text-gray-300 mt-2 leading-relaxed">{bundle.description}</p>
                </div>

                <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">{formatPrice(bundle.price)}</span>
                      {bundle.compareAtPrice > bundle.price && (
                        <span className="text-sm line-through text-gray-500 font-bold">{formatPrice(bundle.compareAtPrice)}</span>
                      )}
                    </div>
                  </div>

                  <a
                    href={bundle.gumroadUrl || '/collections/all'}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-900/30 flex items-center gap-2"
                  >
                    <span>{bundle.ctaText || 'Get Bundle'}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
