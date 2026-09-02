import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../api/client';
import { Category, NavigationItem } from '../../types';
import { CURRENCIES } from '../../utils/formatters';
import {
  User as UserIcon,
  ShoppingBag,
  Search,
  Menu,
  X,
  ChevronDown,
  Shield,
  Truck,
  Globe,
} from 'lucide-react';

interface HeaderProps {
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const { theme, currency, setCurrency } = useTheme();
  const { itemCount, openDrawer } = useCart();
  const location = useLocation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [navItems, setNavItems] = useState<NavigationItem[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    Promise.all([api.getCategories(), api.getNavigation()])
      .then(([cats, navs]) => {
        setCategories(cats.filter((c) => c.status === 'active'));
        setNavItems(navs.filter((n) => n.visible).sort((a, b) => a.sortOrder - b.sortOrder));
      })
      .catch(() => {});

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMegaMenuOpen(false);
    setCurrencyOpen(false);
  }, [location]);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#090B0E]/95 backdrop-blur-md shadow-2xl border-b border-white/10'
          : 'bg-[#090B0E] border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 shrink-0 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
                  <defs>
                    <linearGradient id="gsStoreHeadBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#6366f1"/>
                      <stop offset="100%" stopColor="#9333ea"/>
                    </linearGradient>
                  </defs>
                  <rect width="48" height="48" rx="12" fill="url(#gsStoreHeadBg)"/>
                  <path d="M15 20h18l-2 14H17L15 20z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
                  <path d="M19 20c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                  <path d="M25.5 24l-3.5 4.5h3l-1 5 4-5.5h-3l0.5-4z" fill="white"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black text-white tracking-wider font-heading uppercase group-hover:text-indigo-400 transition-colors">
                  {theme?.brandName || 'GumShop'}
                </span>
                <span className="text-[10px] tracking-widest text-indigo-400 uppercase font-semibold -mt-1">
                  Premium Gear & Living
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              <div
                className="relative"
                onMouseEnter={() => setMegaMenuOpen(true)}
                onMouseLeave={() => setMegaMenuOpen(false)}
              >
                <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-extrabold uppercase tracking-wider text-gray-200 hover:text-white transition-colors">
                  <span>Categories</span>
                  <ChevronDown className="w-4 h-4 text-indigo-400" />
                </button>

                {megaMenuOpen && (
                  <div className="absolute top-full left-0 w-80 bg-[#14171F] border border-white/10 rounded-2xl shadow-2xl p-4 grid gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link
                      to="/collections/all"
                      className="p-3 rounded-xl hover:bg-white/5 transition-colors block"
                    >
                      <p className="text-sm font-bold text-white">All Products</p>
                      <p className="text-xs text-gray-400 mt-0.5">Explore the complete catalog</p>
                    </Link>
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/collections/${cat.slug}`}
                        className="p-3 rounded-xl hover:bg-white/5 transition-colors block"
                      >
                        <p className="text-sm font-bold text-white">{cat.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{cat.description}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {navItems
                .filter((item) => !item.parentId)
                .map((item) => (
                  <Link
                    key={item.id}
                    to={item.url}
                    className="px-4 py-2 text-sm font-extrabold uppercase tracking-wider text-gray-300 hover:text-white transition-colors relative"
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-indigo-600 text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}

              <Link
                to="/track"
                className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Track Order</span>
              </Link>
            </nav>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Multi-Currency Switcher */}
            <div className="relative">
              <button
                onClick={() => setCurrencyOpen(!currencyOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Change Currency"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>{currency}</span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>

              {currencyOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-[#14171F] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="text-[10px] font-black uppercase tracking-wider text-gray-500 px-2 py-1">
                    Select Currency
                  </div>
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCurrency(c.code);
                        setCurrencyOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold text-left transition-colors ${
                        currency === c.code
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className="font-mono text-[11px] opacity-75">{c.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onOpenSearch}
              className="p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              to="/account"
              className="p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors hidden sm:flex items-center"
              title="My Account"
            >
              <UserIcon className="w-5 h-5" />
            </Link>

            <button
              onClick={openDrawer}
              className="relative p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center shadow-lg shadow-indigo-900/50 animate-in zoom-in">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 text-gray-300 hover:text-white"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#090B0E] px-4 pt-4 pb-8 space-y-4 animate-in slide-in-from-top duration-300">
          <div className="space-y-1">
            <Link
              to="/collections/all"
              className="block px-4 py-3 rounded-xl font-bold uppercase text-sm text-white hover:bg-white/5"
            >
              All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/collections/${cat.slug}`}
                className="block px-4 py-2.5 rounded-xl font-bold text-sm text-gray-300 hover:text-white hover:bg-white/5"
              >
                {cat.name}
              </Link>
            ))}
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.url}
                className="block px-4 py-3 rounded-xl font-bold uppercase text-sm text-white hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/account"
              className="block px-4 py-3 rounded-xl font-bold uppercase text-sm text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4 text-indigo-400" />
              <span>My Customer Account</span>
            </Link>
            <Link
              to="/track"
              className="block px-4 py-3 rounded-xl font-bold uppercase text-sm text-indigo-400 hover:bg-white/5 flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>Track My Order</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
