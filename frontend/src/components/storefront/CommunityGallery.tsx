import React from 'react';
import { HomepageSection } from '../../types';
import { Camera } from 'lucide-react';

interface CommunityGalleryProps {
  section: HomepageSection;
}

export const CommunityGallery: React.FC<CommunityGalleryProps> = ({ section }) => {
  const images = section.settingsJson?.images || [
    { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', tag: '@audiophile_workspace' },
    { url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80', tag: '@mechanical_desk' },
    { url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80', tag: '@edc_minimalist' },
    { url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80', tag: '@daily_hydration' },
  ];

  return (
    <section className="py-16 sm:py-24 bg-[#0F1115] border-t border-white/10" id="community">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          {section.subtitle && (
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1.5">
              {section.subtitle}
            </p>
          )}
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase font-heading">
            {section.title || 'Join The #GumShop Community'}
          </h2>
          {section.content && (
            <p className="text-sm text-gray-400 mt-2">
              {section.content}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {images.map((img: any, i: number) => (
            <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden bg-black border border-white/10 shadow-xl">
              <img
                src={img.url}
                alt={`Community gear setup ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4">
                <Camera className="w-8 h-8 text-indigo-400 mb-2" />
                <span className="text-xs font-bold font-mono">{img.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
