import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0C0F] text-gray-200 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase font-heading">
            Customer Care &amp; Support
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto">
            Have a question about an order, shipment, or hardware compatibility? Our team is here to assist you 7 days a week.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#14171F] border border-white/10 rounded-3xl p-8 space-y-6">
            <h2 className="text-xl font-bold text-white">Get in Touch</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>support@gumshop.online</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Phone className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>+1 (800) 555-GUMSHOP</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <MapPin className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>GumShop Global Logistics, San Francisco, CA</span>
              </div>
            </div>
          </div>

          <div className="bg-[#14171F] border border-white/10 rounded-3xl p-8">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Message Dispatched</h3>
                <p className="text-xs text-gray-400">Our gear specialist will reply in under 2 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Your Name</label>
                  <input required className="w-full px-4 py-3 rounded-xl bg-[#07080B] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Email Address</label>
                  <input type="email" required className="w-full px-4 py-3 rounded-xl bg-[#07080B] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Message</label>
                  <textarea rows={4} required className="w-full px-4 py-3 rounded-xl bg-[#07080B] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
