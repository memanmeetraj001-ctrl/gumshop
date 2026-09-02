import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import {
  LayoutDashboard, Package, FolderTree, Boxes, Gift, Layers,
  Footprints, Palette, Tag, MessageSquare, Settings, PackageCheck,
  Zap, Download, HelpCircle, LogOut, ExternalLink, Crown, Menu, X, ChevronRight,
  Eye, Smartphone, Monitor, RefreshCw, Radio,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productCount, setProductCount] = useState(5);
  const [productLimit, setProductLimit] = useState(10);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    api.getProducts().then((p) => setProductCount(p.length)).catch(() => {});
  }, [location]);

  const liveStoreUrl = '/store/demo';

  const navSections = [
    {
      title: 'Overview',
      items: [
        { label: 'Store Dashboard', path: '/admin/dashboard', emoji: '📊' },
      ],
    },
    {
      title: 'Catalog & Inventory',
      items: [
        { label: 'Products', path: '/admin/products', emoji: '📦' },
        { label: 'Categories', path: '/admin/categories', emoji: '📂' },
        { label: 'Collections', path: '/admin/collections', emoji: '🗃️' },
        { label: 'Bundles & Kits', path: '/admin/bundles', emoji: '🎁' },
      ],
    },
    {
      title: 'Growth & Automation',
      items: [
        { label: '1-Click Product Importer', path: '/admin/import', emoji: '📥' },
        { label: 'Gumroad Catalog Sync', path: '/admin/gumroad', emoji: '⚡' },
        { label: 'Discounts & Promo Codes', path: '/admin/promotions', emoji: '🏷️' },
      ],
    },
    {
      title: 'Orders & Fulfillment',
      items: [
        { label: 'Orders & Shipping Leads', path: '/admin/orders', emoji: '📬' },
        { label: 'Customer Reviews', path: '/admin/testimonials', emoji: '⭐' },
      ],
    },
    {
      title: 'Store Customization',
      items: [
        { label: 'Homepage Builder', path: '/admin/homepage', emoji: '🎨' },
        { label: 'Navigation & Menus', path: '/admin/navigation', emoji: '🗺️' },
        { label: 'Footer Builder', path: '/admin/footer', emoji: '📋' },
        { label: 'Theme & Appearance', path: '/admin/appearance', emoji: '🎨' },
      ],
    },
    {
      title: 'Settings & Upgrades',
      items: [
        { label: 'Upgrade Plan', path: '/admin/upgrade', emoji: '⚡' },
        { label: 'Store Settings', path: '/admin/settings', emoji: '⚙️' },
        { label: 'Store Guide & FAQ', path: '/admin/guide', emoji: '📖' },
      ],
    },
  ];

  const handleLogout = () => { logout(); navigate('/admin/login'); };
  const isSuperAdmin = user?.role === 'superadmin';
  const usagePercent = Math.min(100, (productCount / productLimit) * 100);
  const usageColor = usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-indigo-500';

  return (
    <div className="min-h-screen bg-[#090B0E] flex text-gray-200">
      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#14171F] border-r border-white/10 flex flex-col justify-between transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="h-20 flex items-center px-6 border-b border-white/10 gap-3 shrink-0">
            {/* GumShop Logo Mark */}
            <div className="w-9 h-9 shrink-0">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
                <defs>
                  <linearGradient id="gsAdminBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#9333ea"/>
                  </linearGradient>
                </defs>
                <rect width="48" height="48" rx="12" fill="url(#gsAdminBg)"/>
                <path d="M15 20h18l-2 14H17L15 20z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
                <path d="M19 20c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <path d="M25.5 24l-3.5 4.5h3l-1 5 4-5.5h-3l0.5-4z" fill="white"/>
              </svg>
            </div>
            <div>
              <span className="text-base font-black text-white tracking-wider uppercase font-heading">GumShop CMS</span>
              <span className="block text-[10px] text-indigo-400 font-bold uppercase tracking-widest -mt-0.5">Merchant Store Admin</span>
            </div>
          </div>

          {/* Quick Live Preview Action Button */}
          <div className="px-4 pt-3 shrink-0">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500/50 text-xs font-bold flex items-center justify-between transition-all group shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>Live Store Preview</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Store is Live" />
            </button>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-4 overflow-y-auto flex-1 pr-1">
            {navSections.map((sec) => (
              <div key={sec.title} className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 px-3 py-0.5 block">{sec.title}</span>
                {sec.items.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                      <span className="text-sm shrink-0">{item.emoji}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 space-y-3 bg-black/30 shrink-0">
          {/* Inventory Slot Meter */}
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-2">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-gray-400">Inventory Slot Limit</span>
              <span className={`font-mono ${usagePercent >= 90 ? 'text-red-400' : 'text-indigo-400'}`}>{productCount} / {productLimit}</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full ${usageColor} rounded-full transition-all`} style={{ width: `${usagePercent}%` }} />
            </div>
            <Link to="/admin/upgrade" className="block text-center py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors">
              ⚡ Upgrade (50 Slots)
            </Link>
          </div>

          {isSuperAdmin && (
            <Link to="/super-admin" className="flex items-center justify-between px-3 py-2 text-xs font-bold text-purple-300 hover:text-white bg-purple-950/30 hover:bg-purple-900/40 rounded-xl border border-purple-500/30 transition-all">
              <span className="flex items-center gap-2"><Crown className="w-3.5 h-3.5 text-purple-400" /><span>👑 Master Platform Admin</span></span>
              <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
            </Link>
          )}

          <a href={liveStoreUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl border border-white/10 transition-all">
            <span className="flex items-center gap-2"><ExternalLink className="w-3.5 h-3.5 text-indigo-400" /><span>Open in New Tab</span></span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          </a>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">{user?.name?.[0] || 'A'}</div>
              <div className="overflow-hidden text-xs">
                <p className="font-bold text-white truncate">{user?.name || 'Store Admin'}</p>
                <p className="text-[10px] text-gray-400 capitalize truncate">{user?.role || 'Merchant'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-indigo-400 p-1.5" title="Logout"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar (Desktop & Mobile) */}
        <header className="h-16 border-b border-white/10 bg-[#14171F] flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40">
          {/* Mobile Brand */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 shrink-0">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow">
                <defs>
                  <linearGradient id="gsMobileBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#9333ea"/>
                  </linearGradient>
                </defs>
                <rect width="48" height="48" rx="12" fill="url(#gsMobileBg)"/>
                <path d="M15 20h18l-2 14H17L15 20z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
                <path d="M19 20c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <path d="M25.5 24l-3.5 4.5h3l-1 5 4-5.5h-3l0.5-4z" fill="white"/>
              </svg>
            </div>
            <span className="font-bold text-white uppercase text-sm font-heading">GumShop Admin</span>
          </div>

          {/* Desktop Store Status Indicator */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Store is Live Online</span>
            </div>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-xs text-gray-400 font-mono">app.gumshop.online</span>
          </div>

          {/* Action Buttons: Live Preview & Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Preview Modal Button */}
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-900/40 transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>

            {/* Direct Open in New Tab Button */}
            <a
              href={liveStoreUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold transition-all"
              title="Open storefront in new tab"
            >
              <span>Storefront</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-gray-400 hover:text-white rounded-lg bg-white/5 lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="p-4 sm:p-8 flex-1 max-w-7xl w-full mx-auto"><Outlet /></main>
      </div>

      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" />}

      {/* ── Interactive Live Store Preview Modal (Desktop & Mobile Simulation) ── */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-between animate-in fade-in duration-200">
          {/* Top Preview Control Bar */}
          <div className="w-full h-16 bg-[#14171F] border-b border-white/10 px-4 sm:px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider hidden sm:inline">
                  Live Storefront Preview
                </span>
              </div>
              <span className="text-xs text-gray-500 hidden sm:inline">|</span>
              <span className="text-xs font-mono text-gray-400 bg-black/40 px-2 py-0.5 rounded-lg border border-white/5">
                {previewDevice === 'desktop' ? 'Desktop View (100% Full)' : 'Mobile View (390px iPhone)'}
              </span>
            </div>

            {/* Device Switcher & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewDevice === 'desktop'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewDevice === 'mobile'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIframeKey((k) => k + 1)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all"
                title="Refresh preview"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <a
                href={liveStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold transition-all"
              >
                <span>New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="p-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 transition-all"
                title="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Iframe Viewport Area */}
          <div className="flex-1 w-full p-3 sm:p-6 flex items-center justify-center overflow-hidden">
            <div
              className={`h-full bg-[#0A0C0F] rounded-2xl border border-white/20 shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${
                previewDevice === 'desktop'
                  ? 'w-full max-w-6xl'
                  : 'w-[390px] max-h-[844px] rounded-[36px] border-[6px] border-[#222634] shadow-indigo-950/50'
              }`}
            >
              {previewDevice === 'mobile' && (
                <div className="h-5 bg-[#222634] flex items-center justify-center shrink-0">
                  <div className="w-20 h-3 bg-black/60 rounded-full" />
                </div>
              )}
              <iframe
                key={iframeKey}
                src={liveStoreUrl}
                title="Live Storefront Preview"
                className="w-full flex-1 border-0 bg-[#0A0C0F]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
