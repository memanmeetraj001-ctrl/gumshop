import React, { useState, useEffect } from 'react';
import { HomepageSection, Testimonial } from '../../types';
import { api } from '../../api/client';
import { Star, ShieldCheck, Quote } from 'lucide-react';

interface TestimonialsSectionProps {
  section: HomepageSection;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ section }) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    api.getTestimonials().then(setTestimonials).catch(() => {});
  }, []);

  return (
    <section className="py-16 sm:py-24 bg-[#0A0C0F] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          {section.subtitle && (
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1.5">
              {section.subtitle}
            </p>
          )}
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase font-heading">
            {section.title || 'What Real Detailers Are Saying'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((test) => (
            <div
              key={test.id}
              className="bg-[#14171F] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex text-amber-400">
                    {[...Array(test.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  {test.verified && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified Buyer</span>
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-200 leading-relaxed italic mb-6">
                  "{test.review}"
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                {test.avatar ? (
                  <img
                    src={test.avatar}
                    alt={test.name}
                    className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {test.name[0]}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-white">{test.name}</h4>
                  {test.title && (
                    <p className="text-xs text-gray-400">{test.title}</p>
                  )}
                  {test.productName && (
                    <p className="text-[10px] text-red-400 font-semibold mt-0.5">Purchased: {test.productName}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
