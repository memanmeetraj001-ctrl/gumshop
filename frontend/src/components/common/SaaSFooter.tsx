import React, { type SVGProps } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Rocket } from 'lucide-react';

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GithubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

const saasColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Platform Features', href: '/#features', internal: false },
      { label: 'SaaS Pricing', href: '/#pricing', internal: false },
      { label: 'How It Works', href: '/#how-it-works', internal: false },
      { label: 'Live Demo Store', href: '/store/demo', internal: true },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Merchant Admin Login', href: '/admin/login', internal: true },
      { label: 'Create Free Store (60s)', href: '/signup', internal: true },
      { label: 'Plan Upgrades', href: '/admin/upgrade', internal: true },
      { label: 'Merchant Guide & FAQ', href: '/admin/guide', internal: true },
      { label: 'Master Super-Admin', href: '/super-admin/billing', internal: true },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About GumShop', href: '/about', internal: true },
      { label: 'Contact Support', href: '/contact', internal: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy', internal: true },
      { label: 'Terms of Service', href: '/terms', internal: true },
      { label: 'Cookie Policy', href: '/cookies', internal: true },
    ],
  },
];

const socials = [
  { icon: XIcon, label: 'Twitter / X', href: 'https://twitter.com' },
  { icon: LinkedinIcon, label: 'LinkedIn', href: 'https://linkedin.com' },
  { icon: GithubIcon, label: 'GitHub', href: 'https://github.com' },
];

export const SaaSFooter: React.FC = () => {
  return (
    <footer className="border-t border-white/5 bg-[#07080B] text-gray-300">
      {/* Top Banner CTA */}
      <div className="border-b border-white/5 bg-gradient-to-r from-indigo-950/40 via-[#0F1118] to-purple-950/40 py-8 px-5 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                Start Selling Online in 60 Seconds
              </h4>
              <p className="text-xs text-gray-400">
                Connect Gumroad, import products, and launch your branded store with zero code.
              </p>
            </div>
          </div>
          <Link
            to="/signup"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-900/40 transition-all shrink-0"
          >
            <Rocket className="w-4 h-4" />
            <span>Launch Free Store</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main SaaS Navigation Columns */}
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Info */}
          <div className="lg:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center shrink-0">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
                  <defs>
                    <linearGradient id="gsSaaSFootBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#6366f1"/>
                      <stop offset="100%" stopColor="#9333ea"/>
                    </linearGradient>
                  </defs>
                  <rect width="48" height="48" rx="12" fill="url(#gsSaaSFootBg)"/>
                  <path d="M15 20h18l-2 14H17L15 20z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
                  <path d="M19 20c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                  <path d="M25.5 24l-3.5 4.5h3l-1 5 4-5.5h-3l0.5-4z" fill="white"/>
                </svg>
              </span>
              <span className="text-xl font-black tracking-tight text-white">GumShop</span>
            </Link>
            <p className="text-xs leading-relaxed text-gray-400">
              The 60-Second Headless E-Commerce &amp; Storefront Builder for Gumroad creators.
            </p>
            <p className="text-[11px] text-gray-600">
              © 2026 GumShop. All rights reserved.
            </p>
          </div>

          {/* Links */}
          {saasColumns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-black uppercase tracking-widest text-white">
                {col.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.internal ? (
                      <Link
                        to={link.href}
                        className="text-xs text-gray-400 transition-colors hover:text-indigo-400"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-xs text-gray-400 transition-colors hover:text-white"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row text-xs text-gray-500">
          <p>
            Built for creators &amp; indie founders worldwide · Zero transaction fees on sales
          </p>
          <div className="flex items-center gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition-colors hover:border-white/20 hover:text-white"
              >
                <s.icon className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
