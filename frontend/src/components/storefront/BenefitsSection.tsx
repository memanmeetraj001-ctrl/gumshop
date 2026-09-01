import React from 'react';
import { HomepageSection } from '../../types';
import { CheckCircle2, ShieldCheck, Sparkles, Zap, Cpu, BatteryCharging } from 'lucide-react';

interface BenefitsSectionProps {
  section: HomepageSection;
}

export const BenefitsSection: React.FC<BenefitsSectionProps> = ({ section }) => {
  const points = section.settingsJson?.points || [
    { title: 'Precision CNC Machining & Aerospace Materials', desc: 'Crafted from solid 6061-T6 aluminum and 304 stainless steel for lifelong resilience.' },
    { title: 'Lossless High-Fidelity Acoustic Drivers', desc: 'Custom 40mm neodymium transducers delivering punchy sub-bass, vivid mids, and pristine highs.' },
    { title: 'Ultra-Compact Front-Pocket Ergonomics', desc: 'Engineered to declutter your everyday carry and streamline your workspace aesthetic.' },
    { title: '40+ Hour Battery & Fast USB-C Quick Charge', desc: 'Get 5 hours of playback from just 10 minutes of charging with modern universal USB-C.' },
  ];

  const image = section.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80';

  return (
    <section className="py-16 sm:py-24 bg-[#0F1115] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            {section.subtitle && (
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                {section.subtitle}
              </p>
            )}
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase font-heading leading-tight">
              {section.title || 'Engineered For Everyday Excellence'}
            </h2>
            {section.content && (
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                {section.content}
              </p>
            )}

            <div className="space-y-4 pt-2">
              {points.map((pt: any, i: number) => (
                <div key={i} className="flex items-start gap-3.5 p-3.5 bg-white/5 rounded-2xl border border-white/5">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">{pt.title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{pt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl aspect-square sm:aspect-[4/3]">
            <img
              src={image}
              alt="GumShop Engineering"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 p-4 bg-[#14171F]/90 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">2-Year Comprehensive Guarantee</h4>
                <p className="text-[11px] text-gray-400">All GumShop essentials include 100% replacement warranty protection.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
