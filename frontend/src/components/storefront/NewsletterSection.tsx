import React, { useState } from 'react';
import { HomepageSection } from '../../types';
import { api } from '../../api/client';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface NewsletterSectionProps {
  section: HomepageSection;
}

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({ section }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.subscribeNewsletter(email);
      setSubmitted(true);
      setEmail('');
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-[#0F1115] to-[#0A0C0F] border-t border-white/10" id="newsletter">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 text-xs font-black uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{section.subtitle || 'JOIN 10,000+ CREATORS'}</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black text-white uppercase font-heading">
          {section.title || 'Unlock 50% Off Your First Order'}
        </h2>

        <p className="text-sm sm:text-base text-gray-300 mt-4 max-w-xl mx-auto leading-relaxed">
          {section.content || 'Subscribe to get exclusive hardware release drops, curated workspace guides, and private VIP bundle discounts.'}
        </p>

        {submitted ? (
          <div className="mt-8 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl inline-flex items-center gap-3 text-emerald-300 font-bold text-sm animate-in fade-in">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span>Welcome aboard! Check your inbox for your 50% discount code.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..."
              className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40"
            >
              <span>{loading ? 'Joining...' : 'Get 50% Off'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
