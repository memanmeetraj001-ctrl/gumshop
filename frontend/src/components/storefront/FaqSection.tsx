import React, { useState } from 'react';
import { HomepageSection } from '../../types';
import { ChevronDown } from 'lucide-react';

interface FaqSectionProps {
  section: HomepageSection;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ section }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const items = section.settingsJson?.items || [
    {
      q: 'How long does worldwide express delivery take?',
      a: 'All orders are dispatched within 24-48 business hours with live courier tracking (USPS, FedEx, DHL). Delivery typically arrives within 3-5 business days across North America and 5-7 business days internationally.',
    },
    {
      q: 'How does secure checkout work?',
      a: 'When you click "Buy Now", your shipping details are recorded and you complete your order seamlessly via 256-bit SSL encrypted checkout with support for Visa, Mastercard, Apple Pay, Google Pay, and PayPal.',
    },
    {
      q: 'What is your return & warranty policy?',
      a: 'We offer a 30-day no-questions-asked money-back guarantee plus a 2-year comprehensive manufacturer warranty covering hardware defects.',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-[#0A0C0F] border-t border-white/10" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          {section.subtitle && (
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1.5">
              {section.subtitle}
            </p>
          )}
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase font-heading">
            {section.title || 'Frequently Asked Questions'}
          </h2>
          {section.content && (
            <p className="text-sm text-gray-400 mt-2">
              {section.content}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {items.map((item: any, i: number) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="bg-[#14171F] border border-white/10 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-white hover:text-indigo-400 transition-colors"
                >
                  <span className="text-sm sm:text-base pr-4">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-indigo-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-white/5 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
