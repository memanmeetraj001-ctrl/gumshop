import React from 'react';
import { Link } from 'react-router-dom';
import { HomepageSection } from '../../types';
import { ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  section: HomepageSection;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ section }) => {
  const bgImage = section.image || 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9-auto=format&fit=crop&w=1600&q=85';
  const badgeText = section.settingsJson?.badgeText || ' - PRO DETAILER HARDWARE';
  const overlayOpacity = section.settingsJson?.overlayOpacity || 0.65;

  return (
    <div className="relative min-h-[580px] lg:min-h-[680px] flex items-center justify-center overflow-hidden bg-black border-b border-white/10">
      {/* Background Image with Dark Gradient Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/50"
        style={{ opacity: overlayOpacity }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 z-10 w-full">
        <div className="max-w-3xl space-y-6">
          {/* Badge */}
          {badgeText && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-extrabold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>{badgeText}</span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase font-heading leading-tight">
            {section.title || 'ENGINEERED FOR THE PERFECT DETAIL.'}
          </h1>

          {/* Subtitle */}
          {section.subtitle && (
            <p className="text-base sm:text-xl font-bold text-red-400 tracking-wider uppercase">
              {section.subtitle}
            </p>
          )}

          {/* Content */}
          {section.content && (
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
              {section.content}
            </p>
          )}

          {/* Action CTAs */}
          <div className="flex flex-wrap gap-4 pt-4">
            {section.buttonText && (
              <Link
                to={section.buttonUrl || '/collections/best-sellers'}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-red-900/40 flex items-center gap-2.5 transition-all hover:scale-[1.02]"
              >
                <span>{section.buttonText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            {section.secondaryButtonText && (
              <Link
                to={section.secondaryButtonUrl || '/bundles'}
                className="px-8 py-4 bg-white/10 hover:bg-white/15 text-white border border-white/20 font-extrabold text-sm uppercase tracking-wider rounded-xl backdrop-blur-md transition-all hover:scale-[1.02]"
              >
                {section.secondaryButtonText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
