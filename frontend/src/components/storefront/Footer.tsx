import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/client';
import { FooterColumn } from '../../types';
import { ShieldCheck, Truck, Lock, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  const { theme } = useTheme();
  const [columns, setColumns] = useState<FooterColumn[]>([]);

  useEffect(() => {
    api.getFooter().then(setColumns).catch(() => {});
  }, []);

  return (
    <footer className="bg-[#090B0E] border-t border-white/10 text-gray-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
                  <defs>
                    <linearGradient id="gsStoreFootBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#6366f1"/>
                      <stop offset="100%" stopColor="#9333ea"/>
                    </linearGradient>
                  </defs>
                  <rect width="48" height="48" rx="12" fill="url(#gsStoreFootBg)"/>
                  <path d="M15 20h18l-2 14H17L15 20z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
                  <path d="M19 20c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                  <path d="M25.5 24l-3.5 4.5h3l-1 5 4-5.5h-3l0.5-4z" fill="white"/>
                </svg>
              </div>
              <span className="text-2xl font-black text-white uppercase font-heading tracking-wider">
                {theme?.brandName || 'GumShop'}
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-gray-400 max-w-sm leading-relaxed">
              Curated everyday carry essentials, high-fidelity wireless audio, and minimalist desk gear engineered with obsession for craftsmanship.
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-indigo-400" /> Free Global Express</span>
              <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-emerald-400" /> 256-Bit SSL Encrypted</span>
            </div>
          </div>

          {/* Dynamic Columns */}
          {columns.map((col) => (
            <div key={col.id} className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.filter((link) => !link.url.includes("/support")).map((link) => (
                  <li key={link.id}>
                    <Link
                      to={link.url}
                      className="text-xs hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 {theme?.brandName || 'GumShop'}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Support &amp; FAQ</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link>
            <Link to="/track" className="hover:text-white transition-colors">Track Order</Link>
            <Link to="/admin/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">Admin Login ↗</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
