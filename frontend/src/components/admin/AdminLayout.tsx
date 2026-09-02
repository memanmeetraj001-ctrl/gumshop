import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import {
  LayoutDashboard, Package, FolderTree, Boxes, Gift, Layers,
  Footprints, Palette, Tag, MessageSquare, Settings, PackageCheck,
  Zap, Download, HelpCircle, LogOut, ExternalLink, Crown, Menu, X, ChevronRight,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productCount, setProductCount] = useState(5);
  const [productLimit, setProductLimit] = useState(10);

  useEffect(() => {
    api.getProducts().then((p) => setProductCount(p.length)).catch(() => {});
  }, [location]);

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
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#14171F] border-r border-white/10 flex flex-col justify-between transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
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
              <span className="text-base font-black text-white tracking-wider uppercase">GumShop CMS</span>
              <span className="block text-[10px] text-indigo-400 font-bold uppercase tracking-widest -mt-0.5">Merchant Store Admin</span>
            </div>
          </div>

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
            <Link to="/admin/settings" className="block text-center py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors">
              ⚡ Upgrade (50 Slots)
            </Link>
          </div>

          {isSuperAdmin && (
            <Link to="/super-admin" className="flex items-center justify-between px-3 py-2 text-xs font-bold text-purple-300 hover:text-white bg-purple-950/30 hover:bg-purple-900/40 rounded-xl border border-purple-500/30 transition-all">
              <span className="flex items-center gap-2"><Crown className="w-3.5 h-3.5 text-purple-400" /><span>👑 Master Platform Admin</span></span>
              <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
            </Link>
          )}

          <a href="/store/demo" target="_blank" rel="noreferrer" className="flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl border border-white/10 transition-all">
            <span className="flex items-center gap-2"><ExternalLink className="w-3.5 h-3.5 text-indigo-400" /><span>View Storefront</span></span>
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

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <header className="h-16 border-b border-white/10 bg-[#14171F] flex items-center justify-between px-4 lg:hidden sticky top-0 z-40">
          <div className="flex items-center gap-2">
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
            <span className="font-bold text-white uppercase text-sm">GumShop Store CMS</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-gray-400 hover:text-white rounded-lg bg-white/5">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>
        <main className="p-4 sm:p-8 flex-1 max-w-7xl w-full mx-auto"><Outlet /></main>
      </div>

      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" />}
    </div>
  );
};
