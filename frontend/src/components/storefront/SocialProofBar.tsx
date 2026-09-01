import React from 'react';
import { HomepageSection } from '../../types';
import { ShieldCheck, Award, Truck, Star } from 'lucide-react';

interface SocialProofBarProps {
  section: HomepageSection;
}

export const SocialProofBar: React.FC<SocialProofBarProps> = ({ section }) => {
  const badges = section.settingsJson?.badges || [
    { icon: 'Award', title: '5,000 PSI Tested', desc: 'Commercial Grade 304 Stainless' },
    { icon: 'ShieldCheck', title: 'Lifetime Craftsmanship', desc: 'Built To Last A Lifetime' },
    { icon: 'Truck', title: 'Fast Global Shipping', desc: 'Dispatched in 24 Hours' },
    { icon: 'Star', title: '4.9/5 Star Rating', desc: 'Over 2,400+ Verified Reviews' },
  ];

  const getIcon = (name: string) => {
    switch (name) {
      case 'Award': return <Award className="w-6 h-6 text-red-400" />;
      case 'ShieldCheck': return <ShieldCheck className="w-6 h-6 text-red-400" />;
      case 'Truck': return <Truck className="w-6 h-6 text-red-400" />;
      case 'Star': return <Star className="w-6 h-6 text-amber-400 fill-amber-400" />;
      default: return <Award className="w-6 h-6 text-red-400" />;
    }
  };

  return (
    <div className="bg-[#14171F] border-b border-white/10 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {badges.map((badge: any, i: number) => (
            <div key={i} className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {getIcon(badge.icon)}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">{badge.title}</h4>
                <p className="text-[11px] text-gray-400 leading-tight">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
