import React from 'react';
import { Shield, Award, Sparkles, CheckCircle2 } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#07080B] text-gray-200 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-1.5 rounded-full inline-block">
            OUR PHILOSOPHY
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase font-heading">
            Crafted for Minimalist Living &amp; Work
          </h1>
          <p className="text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
            GumShop was created with a single mission: to build everyday gear and workspace essentials with exceptional materials, aesthetic restraint, and lifelong durability.
          </p>
        </div>

        <div className="bg-[#0F1118] border border-white/10 rounded-3xl p-8 sm:p-12 space-y-6 shadow-2xl">
          <h2 className="text-2xl font-black text-white uppercase font-heading">
            Obsessive Engineering &amp; Modern Aesthetics
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            We source aircraft-grade 6061 aluminum, vegetable-tanned full-grain leather, custom acoustic transducers, and food-grade stainless steel to create everyday gear that gets better with time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10">
            <div className="p-4 bg-[#14171F] border border-white/5 rounded-2xl text-center">
              <Shield className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">Aerospace Alloys</h3>
              <p className="text-xs text-gray-400 mt-1">Lightweight &amp; ultra durable</p>
            </div>
            <div className="p-4 bg-[#14171F] border border-white/5 rounded-2xl text-center">
              <Award className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">Studio Acoustics</h3>
              <p className="text-xs text-gray-400 mt-1">Calibrated lossless sound</p>
            </div>
            <div className="p-4 bg-[#14171F] border border-white/5 rounded-2xl text-center">
              <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">Minimalist Design</h3>
              <p className="text-xs text-gray-400 mt-1">Zero clutter, pure form</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
