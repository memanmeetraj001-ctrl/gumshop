import React, { useState, type SVGProps } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Send,
  CheckCircle2,
  Headphones,
  Clock,
  Sparkles,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';

function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export const ContactPage: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    topic: 'General Question',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  const faqs = [
    {
      q: 'How fast can I launch my store?',
      a: 'In under 60 seconds! Simply sign up with your email, select an industry theme preset, and paste your Gumroad store link or import products via our 1-click scraper.',
    },
    {
      q: 'How do international payments work?',
      a: 'Your customers checkout directly via Gumroad with Visa, MasterCard, PayPal, Apple Pay, and Google Pay in 180+ countries with zero complex gateway paperwork.',
    },
    {
      q: 'Can I connect a custom apex domain (e.g. yourbrand.com)?',
      a: 'Yes! Pro and Scale merchants can link custom domains with automatic SSL certificate provisioning right from Store Settings.',
    },
    {
      q: 'How do I upgrade or cancel my SaaS plan?',
      a: 'You can upgrade anytime to Pro ($12/mo or $9/yr) or Scale ($29/mo or $24/yr) in your Store Settings under Plan Upgrades. Subscriptions can be managed or cancelled in 1 click.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07080B] text-gray-200 py-16 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* ── Page Header ── */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-black uppercase tracking-widest">
            <Headphones className="w-3.5 h-3.5" />
            <span>24/7 MERCHANT &amp; CUSTOMER SUPPORT</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight font-heading">
            How Can We Help You?
          </h1>
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Have a question regarding your store setup, billing, domain routing, or orders? Our support team is ready to assist.
          </p>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column: Direct Channels & Founder Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0E1017] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <h2 className="text-base font-black text-white uppercase tracking-wider font-heading">
                Direct Contact Channels
              </h2>

              <div className="space-y-4 text-xs sm:text-sm">
                <a
                  href="mailto:support@gumshop.online"
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-gray-300 hover:text-white group"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-white">General &amp; Technical Support</span>
                    <span className="text-indigo-400 font-mono text-xs">support@gumshop.online</span>
                  </div>
                </a>

                <a
                  href="mailto:admin@gumshop.online"
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-gray-300 hover:text-white group"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-white">Merchant &amp; Billing Desk</span>
                    <span className="text-purple-400 font-mono text-xs">admin@gumshop.online</span>
                  </div>
                </a>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 text-gray-300">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-white">Average Response Time</span>
                    <span className="text-xs text-gray-400">Under 24 hours · 7 days a week</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Founder Direct Connect Card */}
            <div className="bg-gradient-to-br from-[#121520] to-[#0A0C10] border border-indigo-500/30 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                  MR
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Manmeet Raj</h3>
                  <p className="text-[11px] text-indigo-300">Founder &amp; Lead Builder, GumShop</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                Have a strategic inquiry, partnership proposal, or feedback directly for the founder?
              </p>

              <a
                href="https://www.linkedin.com/in/manmeetraj967"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#0077B5]/20 hover:bg-[#0077B5]/30 text-[#00A0DC] hover:text-white border border-[#0077B5]/40 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <LinkedinIcon className="w-4 h-4" />
                <span>Connect with Founder on LinkedIn</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Support Ticket Form */}
          <div className="lg:col-span-3 bg-[#0E1017] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col justify-between">
            {submitted ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/40">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">Support Ticket Submitted!</h3>
                  <p className="text-xs sm:text-sm text-gray-400 max-w-sm">
                    Thank you, <strong className="text-white">{form.name}</strong>. A specialist will review your request regarding &quot;{form.topic}&quot; and reply to <strong className="text-white">{form.email}</strong> shortly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: '', email: '', topic: 'General Question', message: '' });
                  }}
                  className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider font-heading">
                    Submit a Support Request
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Fill out the form below and we will get back to you promptly.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                      Your Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Alex Morgan"
                      className="w-full px-4 py-3 rounded-xl bg-[#07080B] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="e.g. alex@yourstore.com"
                      className="w-full px-4 py-3 rounded-xl bg-[#07080B] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Subject / Category
                  </label>
                  <select
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#07080B] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="General Question">General Platform Question</option>
                    <option value="Store Setup & Onboarding">Store Setup &amp; Onboarding Help</option>
                    <option value="Gumroad & SaaS Billing">Gumroad Subscriptions &amp; Billing</option>
                    <option value="Gumroad Catalog Sync">Gumroad Catalog Sync</option>
                    <option value="Custom Domain & SSL">Custom Domain &amp; SSL Configuration</option>
                    <option value="Partnership & Inquiries">Partnership &amp; Press Inquiries</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    How Can We Help? <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Describe your issue, store slug, or question in detail..."
                    className="w-full px-4 py-3 rounded-xl bg-[#07080B] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Submitting…' : 'Send Support Ticket'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Frequently Asked Questions ── */}
        <div className="space-y-6 pt-8 border-t border-white/5">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Quick Answers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase font-heading">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#0E1017] border border-white/10 space-y-2"
              >
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-indigo-400">Q.</span> {faq.q}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed pl-5">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
