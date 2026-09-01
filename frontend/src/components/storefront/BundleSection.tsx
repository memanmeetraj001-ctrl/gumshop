import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HomepageSection, Bundle } from '../../types';
import { api } from '../../api/client';
import { formatPrice } from '../../utils/formatters';
import { trackGumroadClick } from '../../utils/analytics';
import { Check, ArrowRight, ExternalLink, Sparkles } from 'lucide-react';

interface BundleSectionProps {
  section: HomepageSection;
}

export const BundleSection: React.FC<BundleSectionProps> = ({ section }) => {
  const [bundles, setBundles] = useState<Bundle[]>([]);

  useEffect(() => {
    api.getBundles().then(setBundles).catch(() => {});
  }, []);

  const handleGumroadCheckout = (bundle: Bundle) => {
    const targetUrl = bundle.gumroadUrl || `https://gumroad.com/l/${bundle.slug}?wanted=true`;
    trackGumroadClick(bundle.id, bundle.name, targetUrl);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="py-16 sm:py-24 bg-[#0F1115] border-y border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          {section.subtitle && (
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2">
              {section.subtitle}
            </p>
          )}
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase font-heading">
            {section.title || 'Save With Complete Upgrade Kits'}
          </h2>
          {section.content && (
            <p className="text-sm text-gray-400 mt-2">
              {section.content}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {bundles.map((bundle) => {
            const savings = bundle.compareAtPrice > bundle.price  ? bundle.compareAtPrice - bundle.price   : 0;
            return (
              <div
                key={bundle.id}
                className="bg-[#14171F] border border-white/10 rounded-2xl overflow-hidden hover:border-red-500/50 transition-all flex flex-col justify-between shadow-xl"
              >
                <div className="relative aspect-video sm:aspect-[21/9] overflow-hidden bg-black">
                  <img
                    src={bundle.image}
                    alt={bundle.name}
                    className="w-full h-full object-cover object-center"
                  />
                  {bundle.badge && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{bundle.badge}</span>
                    </div>
                  )}
                </div>

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase font-heading">
                      {bundle.name}
                    </h3>
                    <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                      {bundle.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl sm:text-3xl font-black text-white">
                          {formatPrice(bundle.price)}
                        </span>
                        {bundle.compareAtPrice > bundle.price && (
                          <span className="text-sm line-through text-gray-500 font-bold">
                            {formatPrice(bundle.compareAtPrice)}
                          </span>
                        )}
                      </div>
                      {savings > 0 && (
                        <p className="text-xs font-bold text-emerald-400 mt-0.5">
                          You save {formatPrice(savings)} with this bundle
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleGumroadCheckout(bundle)}
                      className="py-3.5 px-6 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-red-900/30 flex items-center justify-center gap-2"
                    >
                      <span>{bundle.ctaText || 'Get Bundle on Gumroad'}</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
