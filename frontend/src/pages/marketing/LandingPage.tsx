import React, { useEffect, useRef, useState, type ReactNode, type SVGProps } from 'react';
import { Link } from 'react-router-dom';
import { SaaSFooter } from '../../components/common/SaaSFooter';
import {
  ShieldCheck,
  ArrowRight,
  Menu,
  X,
  Zap,
  Rocket,
  Star,
  LayoutDashboard,
  Package,
  ShoppingCart,
  RefreshCw,
  CheckCircle2,
  Tag,
  DollarSign,
  Truck,
  Headphones,
  ShoppingBag,
  Backpack,
  Briefcase,
  Monitor,
  Keyboard,
  Download,
  PackageCheck,
  Palette,
  Crown,
  Check,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? undefined : 0,
        animation: visible
          ? `fade-up 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms both`
          : undefined,
      }}
    >
      {children}
    </div>
  );
}

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Demo Store', href: '/store/demo' },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors ${
        scrolled
          ? 'border-white/5 bg-[#07080B]/80 backdrop-blur-xl'
          : 'border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center shrink-0">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
              <defs>
                <linearGradient id="gsNavBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#9333ea"/>
                </linearGradient>
              </defs>
              <rect width="48" height="48" rx="12" fill="url(#gsNavBg)"/>
              <path d="M15 20h18l-2 14H17L15 20z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
              <path d="M19 20c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
              <path d="M25.5 24l-3.5 4.5h3l-1 5 4-5.5h-3l0.5-4z" fill="white"/>
            </svg>
          </span>
          <span className="text-lg font-black tracking-tight text-white">GumShop</span>
          <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-300">
            Beta
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-semibold text-gray-400 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/admin/login"
            className="text-sm font-semibold text-gray-300 transition-colors hover:text-white"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-900/40 transition-all hover:shadow-xl hover:shadow-indigo-900/60"
          >
            Start Free <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/5 bg-[#07080B]/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1 px-5 py-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-white/5 pt-3">
              <Link
                to="/admin/login"
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/5 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white"
              >
                Start Free <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function FloatingBadge({
  className,
  delay,
  icon,
  text,
}: {
  className: string;
  delay: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div
      className={`animate-float absolute z-10 hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white shadow-xl backdrop-blur-md sm:flex ${className}`}
      style={{ animationDelay: delay }}
    >
      {icon}
      {text}
    </div>
  );
}

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Store Dashboard', active: true },
  { icon: Package, label: 'Products', active: false },
  { icon: ShoppingCart, label: 'Orders', active: false },
  { icon: RefreshCw, label: 'Gumroad Sync', active: false },
];

export function HeroSection() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden pt-28 pb-20 md:pt-32"
    >
      {/* Ambient Radial Spotlight & Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(56,189,248,0.20),transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/4 h-[550px] w-[800px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-[130px]"
      />

      <div className="relative mx-auto w-full max-w-5xl px-5 text-center lg:px-8">
        {/* Luminous Top Badge */}
        <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-950/50 px-4 py-2 text-xs sm:text-sm font-black uppercase tracking-wider text-sky-300 shadow-xl shadow-sky-950/50 backdrop-blur-md">
          <Zap className="h-4 w-4 text-sky-400 fill-sky-400/30 animate-pulse" aria-hidden="true" />
          <span>The Zero-Friction Gumroad Storefront Builder</span>
        </div>

        {/* Master 3-Line Optimized Headline */}
        <h1 className="mt-8 text-balance text-5xl font-black leading-none tracking-tighter text-white sm:text-6xl md:text-8xl">
          <span className="animate-fade-up inline-block text-gray-200" style={{ animationDelay: '80ms' }}>
            Tired of Shopify Fees?
          </span>
          <br />
          <span className="animate-fade-up inline-block text-white" style={{ animationDelay: '180ms' }}>
            Launch a Gumroad Store
          </span>
          <br />
          <span
            className="animate-fade-up inline-block bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-sm"
            style={{ animationDelay: '280ms' }}
          >
            In 60 Seconds.
          </span>
        </h1>

        {/* High-Impact BAB (Before vs After) Comparison Bento Pill */}
        <div
          className="animate-fade-up mx-auto mt-8 max-w-2xl rounded-2xl border border-white/10 bg-[#0E121B]/80 p-4 shadow-2xl backdrop-blur-xl sm:p-5"
          style={{ animationDelay: '380ms' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 sm:p-3.5 space-y-1">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> BEFORE GUMSHOP
              </span>
              <p className="text-xs text-gray-400 leading-relaxed">
                Weeks configuring themes, paying <strong>$39/mo + 2% cuts</strong>, and losing mobile buyers to slow carts.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 sm:p-3.5 space-y-1">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" /> AFTER GUMSHOP
              </span>
              <p className="text-xs text-emerald-200/90 leading-relaxed font-medium">
                Headless store live in <strong>60 seconds</strong>, <strong>0% extra fees</strong>, and automated delivery lead capture.
              </p>
            </div>
          </div>
        </div>

        {/* Primary CTA Action */}
        <div
          className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: '480ms' }}
        >
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-teal-500 to-indigo-600 px-9 py-4 text-lg font-black uppercase tracking-wider text-white shadow-2xl shadow-sky-950/80 transition-all hover:scale-[1.03] hover:brightness-110 active:scale-95 cursor-pointer"
          >
            <Rocket className="h-5 w-5" aria-hidden="true" />
            <span>Launch My Free Store</span>
          </Link>
          <Link
            to="/store/demo"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-lg font-bold text-gray-200 transition-all hover:bg-white/10 hover:text-white hover:border-sky-500/40 hover:scale-[1.02] shadow-lg shadow-black/40"
          >
            <span>Explore Demo Store ↗</span>
          </Link>
        </div>

        <div
          className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-gray-500"
          style={{ animationDelay: '560ms' }}
        >
          <span className="flex items-center gap-0.5 text-amber-400" aria-label="5 star rating">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-current" aria-hidden="true" />
            ))}
          </span>
          <span>Trusted by 1,200+ merchants</span>
          <span className="text-gray-700" aria-hidden="true">·</span>
          <span>$2.4M+ GMV processed</span>
          <span className="text-gray-700" aria-hidden="true">·</span>
          <span>No credit card required</span>
        </div>

        <div
          className="animate-fade-up relative mx-auto mt-16 max-w-4xl"
          style={{ animationDelay: '660ms' }}
        >
          <FloatingBadge
            className="-left-3 -top-4 md:-left-10"
            delay="0s"
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            text="✓ Store Launched in 60s"
          />
          <FloatingBadge
            className="-right-3 top-8 md:-right-12"
            delay="1s"
            icon={<DollarSign className="h-4 w-4 text-indigo-300" />}
            text="$1,249 Revenue Today"
          />
          <FloatingBadge
            className="-left-2 bottom-16 md:-left-14"
            delay="1.6s"
            icon={<Tag className="h-4 w-4 text-purple-300" />}
            text="Promo: VIP20 Applied"
          />
          <FloatingBadge
            className="-right-2 -bottom-4 md:-right-10"
            delay="0.6s"
            icon={<Truck className="h-4 w-4 text-emerald-400" />}
            text="3 Orders Received"
          />

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0F1118] shadow-2xl shadow-black/60 group relative">
            {/* Real Dashboard Image Showcase */}
            <div className="relative overflow-hidden">
              <img
                src="/images/showcase-dashboard.jpg"
                alt="GumShop CMS Merchant Store Dashboard"
                className="w-full h-auto object-cover rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]"
              />

              {/* Hover Interactive Overlay Bar */}
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 bg-gradient-to-t from-[#090B0E]/95 via-[#090B0E]/70 to-transparent flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold">Live Multi-Store Dashboard &amp; CMS</span>
                  <span className="text-gray-400 hidden md:inline">· Real-time order capture &amp; sync</span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <Link
                    to="/store/demo"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-900/50 flex items-center gap-1.5"
                  >
                    <span>View Demo Store ↗</span>
                  </Link>
                  <Link
                    to="/admin/login"
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all border border-white/10 backdrop-blur-md"
                  >
                    <span>Admin Login</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const brands = [
  { icon: Headphones, name: 'AudioGear Pro' },
  { icon: Package, name: 'DeskMate' },
  { icon: ShoppingBag, name: 'TechCarry' },
  { icon: Backpack, name: 'NomadPacks' },
  { icon: Briefcase, name: 'EDC Essentials' },
  { icon: Monitor, name: 'WorkflowHQ' },
  { icon: Keyboard, name: 'MechKeys Store' },
];

export function LogoStrip() {
  return (
    <section className="border-y border-white/5 bg-[#0F1118] py-14">
      <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-600">
        Powering stores for creators &amp; entrepreneurs
      </p>

      <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee items-center gap-12">
          {[...brands, ...brands].map((brand, i) => (
            <span
              key={i}
              className="flex shrink-0 items-center gap-2 text-sm font-bold text-gray-600"
            >
              <brand.icon className="h-5 w-5" aria-hidden="true" />
              {brand.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Zap,
    title: '60-Second Store Launch',
    description:
      'Sign up, connect Gumroad, publish. Your store is live before you finish your coffee.',
  },
  {
    icon: Download,
    title: '1-Click Product Importer',
    description:
      'Paste any Shopify, WooCommerce, or product URL and we\'ll auto-fill your catalog instantly.',
  },
  {
    icon: Tag,
    title: 'Promo Code Engine',
    description:
      'Create VIP20, SAVE10, GUM50 discount codes with real-time in-cart validation.',
  },
  {
    icon: PackageCheck,
    title: 'Live Order Tracking',
    description:
      '4-stage visual timeline — Placed → Processing → Shipped (FedEx/USPS) → Delivered.',
  },
  {
    icon: Palette,
    title: 'Visual Theme Builder',
    description:
      'Drag-and-drop homepage sections, custom palettes, typography, and announcement bars.',
  },
  {
    icon: Crown,
    title: 'Multi-Store SaaS Platform',
    description:
      'One master account to manage unlimited stores with role-based access and plan controls.',
  },
];

const paymentPerks = [
  'Instant Gumroad Payouts',
  'Recurring SaaS Billing',
  'Webhook Auto-Plan Upgrades',
];

const showcaseSlides = [
  {
    id: 'dashboard',
    badge: 'Real-Time Analytics',
    title: 'Store CMS Dashboard & Revenue Metrics',
    tagline: 'Monitor your sales, active inventory, and live order stream from a single control center.',
    image: '/images/showcase-dashboard.jpg',
    browserUrl: 'app.gumshop.online/admin/dashboard',
    icon: LayoutDashboard,
    highlights: [
      'Live Revenue Tracking ($1,249 today) with real-time growth curves',
      'Active product slot meter (10 Free / 50 Pro / Unlimited Scale)',
      'Direct 1-click Gumroad product & inventory synchronization',
    ],
    ctaText: 'Launch Free Store',
    ctaLink: '/signup',
  },
  {
    id: 'importer',
    badge: 'Universal Scraper',
    title: '1-Click Multi-Platform Product Importer',
    tagline: 'Migrate your entire catalog from Shopify, WooCommerce, or any HTML store in seconds.',
    image: '/images/showcase-importer.jpg',
    browserUrl: 'app.gumshop.online/admin/import',
    icon: Download,
    highlights: [
      'Instant platform auto-detection (Shopify REST / WooCommerce / HTML)',
      'Batch item selection with automatic 50% discount price modifiers',
      'Automatic image downloading and category assignment',
    ],
    ctaText: 'Try Importer in Admin',
    ctaLink: '/admin/login',
  },
  {
    id: 'themes',
    badge: 'Theme Studio',
    title: '8 Prebuilt Category-Specific Themes',
    tagline: 'Transform your storefront look with 1-click presets for Tech, Fashion, Wellness, Coffee & more.',
    image: '/images/showcase-themes.jpg',
    browserUrl: 'app.gumshop.online/admin/appearance',
    icon: Palette,
    highlights: [
      '8 Niche Presets: Cyber Tech, Luxury Fashion, Organic Wellness, Gourmet Coffee, Streetwear',
      'Live mini-mockup preview with dynamic corner radius sliders (2px to 24px)',
      'Custom color pickers for primary accents, surfaces, and announcement bars',
    ],
    ctaText: 'Explore Theme Studio',
    ctaLink: '/admin/appearance',
  },
  {
    id: 'orders',
    badge: 'Lead Capture',
    title: 'Physical Shipping Address & Order Leads',
    tagline: 'Capture customer delivery addresses on-site before checkout and manage fulfillment with ease.',
    image: '/images/showcase-orders.jpg',
    browserUrl: 'app.gumshop.online/admin/orders',
    icon: PackageCheck,
    highlights: [
      'Pre-checkout shipping modal captures customer name, address, and email',
      'Real-time status tags: Fulfilled, In Transit, Processing, and Pending',
      '1-Click batch CSV export and printable shipping labels',
    ],
    ctaText: 'View Orders Demo',
    ctaLink: '/admin/login',
  },
  {
    id: 'storefront',
    badge: 'Sub-Second Speed',
    title: 'Customer-Facing Headless Storefront',
    tagline: 'A high-converting, blazing-fast storefront designed for minimal friction and maximum sales.',
    image: '/images/showcase-storefront.jpg',
    browserUrl: 'gumshop.online/store/demo',
    icon: ShoppingBag,
    highlights: [
      'Sub-second page loads powered by React 19 and modern CSS variables',
      'Multi-currency switcher (USD, EUR, GBP, CAD, AUD, INR, JPY)',
      'Direct 1-click encrypted international checkout via Gumroad with zero transaction cuts',
    ],
    ctaText: 'Open Live Demo Store ↗',
    ctaLink: '/store/demo',
  },
];

export function ShowcaseCarouselSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % showcaseSlides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const current = showcaseSlides[activeIdx];

  const handlePrev = () => {
    setActiveIdx((prev) => (prev === 0 ? showcaseSlides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % showcaseSlides.length);
  };

  return (
    <section
      id="showcase"
      className="scroll-mt-20 py-24 md:py-32 bg-[#090B0E] border-y border-white/5 relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8 space-y-12">
        {/* Section Header */}
        <Reveal className="mx-auto max-w-3xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>INTERACTIVE PLATFORM TOUR</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight font-heading">
            Inside the GumShop Architecture
          </h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Explore the real, high-performance interfaces built for modern creator commerce.
          </p>
        </Reveal>

        {/* Interactive Tab Navigation Strip */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none">
          {showcaseSlides.map((slide, idx) => {
            const Icon = slide.icon;
            const isActive = activeIdx === idx;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/50 scale-[1.02]'
                    : 'bg-[#14171F] hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                <span>{slide.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Main Showcase Slide Frame */}
        <div className="bg-[#12141C] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 grid grid-cols-1 lg:grid-cols-12 gap-0 relative">
          {/* Left: Image Showcase Viewport */}
          <div className="lg:col-span-8 bg-[#090B0E] p-4 sm:p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 relative group">
            {/* Mockup Browser Topbar */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-amber-500/70" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
                <span className="ml-2 font-mono text-gray-400 bg-black/40 px-2.5 py-0.5 rounded-md text-[11px] border border-white/5">
                  {current.browserUrl}
                </span>
              </div>

              {/* Prev / Next Arrows */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono text-gray-500 px-1">
                  {activeIdx + 1} / {showcaseSlides.length}
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Screenshot Asset */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video bg-[#07080B] flex items-center justify-center">
              <img
                key={current.id}
                src={current.image}
                alt={current.title}
                className="w-full h-full object-cover rounded-xl transition-all duration-500 animate-in fade-in duration-300"
              />
            </div>

            {/* Auto-Slide Progress Bar */}
            <div className="w-full h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
              <div
                key={activeIdx}
                className={`h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full ${
                  isPaused ? 'w-full' : 'animate-[progress_5.5s_linear]'
                }`}
                style={{
                  animationDuration: '5.5s',
                  animationFillMode: 'forwards',
                }}
              />
            </div>
          </div>

          {/* Right: Feature Highlights & CTA */}
          <div className="lg:col-span-4 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-[#12141C]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-bold uppercase tracking-wider">
                <current.icon className="w-3.5 h-3.5 text-indigo-400" />
                <span>{current.badge}</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white uppercase font-heading leading-tight">
                {current.title}
              </h3>

              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                {current.tagline}
              </p>

              <div className="space-y-2.5 pt-2 border-t border-white/5">
                {current.highlights.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-3">
              <Link
                to={current.ctaLink}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40 transition-all"
              >
                <span>{current.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[11px] text-center text-gray-500">
                Included in all plans · No setup fees
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Platform Features
          </p>
          <h2 className="mt-4 text-balance text-4xl font-black tracking-tight text-white md:text-5xl">
            Everything you need to sell online.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-gray-400">
            From product catalog to promo codes to live order tracking — GumShop handles the
            entire commerce stack.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 60}>
              <div className="group h-full rounded-2xl border border-white/8 bg-[#14171F] p-6 transition-all hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-950/40">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 transition-colors group-hover:bg-indigo-500/20">
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-xl font-bold text-white">{feature.title}</h3>
                <p className="mt-2 leading-relaxed text-gray-400 text-sm">{feature.description}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-10 grid items-center gap-8 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-[#14171F] to-purple-950/30 p-8 md:grid-cols-2 md:p-12">
            <div>
              <h3 className="text-balance text-3xl font-black tracking-tight text-white md:text-4xl">
                Gumroad-Powered Payments.
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  {' '}Zero Transaction Fees.
                </span>
              </h3>
              <p className="mt-4 text-base leading-relaxed text-gray-400">
                Connect your own Gumroad seller account and keep 100% of your revenue. We never
                touch your money.
              </p>
            </div>
            <ul className="flex flex-col gap-3">
              {paymentPerks.map((perk) => (
                <li
                  key={perk}
                  className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-4 py-3.5"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="font-semibold text-white text-sm">{perk}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const steps = [
  {
    icon: FileText,
    title: 'Sign Up Free',
    description: 'Create your GumShop account in 30 seconds. No credit card needed to start.',
  },
  {
    icon: Zap,
    title: 'Connect Gumroad',
    description:
      'Paste your Gumroad API token. Your catalog syncs automatically and payments route directly to you.',
  },
  {
    icon: Rocket,
    title: 'Launch & Sell',
    description:
      'Customize your storefront, add promo codes, and share your store link. Start selling immediately.',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-white/5 bg-[#0F1118] py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            How It Works
          </p>
          <h2 className="mt-4 text-balance text-4xl font-black tracking-tight text-white md:text-5xl">
            Go from zero to store in 3 steps.
          </h2>
        </Reveal>

        <div className="relative mt-16">
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-8 hidden border-t border-dashed border-white/15 md:block"
          />

          <div className="grid gap-10 md:grid-cols-3 md:gap-6">
            {steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 120}>
                <div className="relative flex flex-col items-center text-center">
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-indigo-500/30 bg-[#0F1118] text-indigo-400 shadow-lg shadow-indigo-950/40">
                    <step.icon className="h-7 w-7" aria-hidden="true" />
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-black text-white">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="mt-6 text-xl font-bold text-white">{step.title}</h3>
                  <p className="mt-2 max-w-xs leading-relaxed text-gray-400 text-sm">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={200} className="mt-14 flex justify-center">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-lg font-bold text-white shadow-2xl shadow-indigo-900/40 transition-all hover:shadow-indigo-900/70"
          >
            Start Your Free Store
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
type Plan = {
  name: string;
  monthly: number;
  tagline: string;
  popular?: boolean;
  cta: string;
  href: string;
  features: { label: string; included: boolean }[];
};

const plans: Plan[] = [
  {
    name: 'Free',
    monthly: 0,
    tagline: 'Everything to get your first store online.',
    cta: 'Get Started Free',
    href: '/signup',
    features: [
      { label: '1 Store', included: true },
      { label: 'Up to 10 Products', included: true },
      { label: 'Gumroad Sync', included: true },
      { label: 'Basic Theme Builder', included: true },
      { label: 'Order Lead Capture', included: true },
      { label: 'Custom Domain', included: false },
      { label: 'Promo Codes', included: false },
    ],
  },
  {
    name: 'Pro',
    monthly: 12,
    tagline: 'For serious sellers ready to grow.',
    popular: true,
    cta: 'Start Pro Plan',
    href: '/signup?plan=pro',
    features: [
      { label: '1 Store', included: true },
      { label: 'Up to 50 Products', included: true },
      { label: 'Gumroad Sync + Webhook', included: true },
      { label: 'Full Theme Builder', included: true },
      { label: 'Promo Code Engine', included: true },
      { label: 'Abandoned Lead Recovery', included: true },
      { label: 'Custom Domain', included: true },
      { label: 'Priority Support', included: true },
    ],
  },
  {
    name: 'Scale',
    monthly: 29,
    tagline: 'Run an unlimited multi-store empire.',
    cta: 'Start Scale Plan',
    href: '/signup?plan=scale',
    features: [
      { label: 'Unlimited Stores', included: true },
      { label: 'Unlimited Products', included: true },
      { label: 'Everything in Pro', included: true },
      { label: 'Multi-Currency Support', included: true },
      { label: 'White-Label Branding', included: true },
      { label: 'Master Admin Access', included: true },
      { label: 'Dedicated Onboarding', included: true },
    ],
  },
];

export function CompetitorComparisonSection() {
  const comparisonData = [
    {
      feature: 'Monthly Platform Fee',
      gumshop: '$0/mo (Free Forever)',
      shopify: '$39/mo + app costs',
      stan: '$29/mo',
      woo: 'Hosting + Plugins ($25+/mo)',
    },
    {
      feature: 'Extra Transaction Commission',
      gumshop: '0% (Keep 100%)',
      shopify: '0.5% - 2.0% cut',
      stan: '0%',
      woo: 'Gateway fees',
    },
    {
      feature: 'Time to First Live Sale',
      gumshop: '60 Seconds',
      shopify: '3 to 7 Days',
      stan: '20 Minutes',
      woo: '1 to 2 Weeks',
    },
    {
      feature: '1-Click Universal Importer',
      gumshop: '✅ Built-in (Shopify/Woo/HTML)',
      shopify: '❌ Paid CSV Apps ($10–$50/mo)',
      stan: '❌ Manual entry only',
      woo: '❌ Complex XML/CSV',
    },
    {
      feature: 'Pre-Checkout Delivery Address Capture',
      gumshop: '✅ Built-in (Physical goods ready)',
      shopify: '✅ Native checkout',
      stan: '❌ Digital focus only',
      woo: '✅ Plugin required',
    },
    {
      feature: 'Instant Gumroad Sync & Payouts',
      gumshop: '✅ 1-Click direct API sync',
      shopify: '❌ Not supported',
      stan: '❌ Not supported',
      woo: '❌ Not supported',
    },
    {
      feature: 'Visual Theme Studio & Device Simulator',
      gumshop: '✅ 8 Presets with real-time preview',
      shopify: '⚠️ Liquid code required for custom edits',
      stan: '❌ Limited layout options',
      woo: '⚠️ PHP & Theme files',
    },
  ];

  return (
    <section id="comparison" className="py-24 md:py-32 bg-[#090B0E] border-y border-white/5 relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 lg:px-8 space-y-12">
        <Reveal className="mx-auto max-w-3xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>VALUE COMPARISON MATRIX</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight font-heading">
            Why Creators Switch to GumShop
          </h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Stop paying hundreds in recurring SaaS subscriptions for bloated features you don&apos;t use.
          </p>
        </Reveal>

        {/* Comparison Table Card */}
        <div className="bg-[#12141C] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-[#161924]/80">
                  <th className="p-4 sm:p-6 text-gray-400 font-bold uppercase tracking-wider">Features &amp; Costs</th>
                  <th className="p-4 sm:p-6 text-indigo-300 font-black uppercase tracking-wider bg-indigo-950/40 border-x border-indigo-500/30">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-indigo-400" />
                      <span>GumShop</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-500 text-white ml-1">WINNER</span>
                    </div>
                  </th>
                  <th className="p-4 sm:p-6 text-gray-400 font-bold uppercase tracking-wider">Shopify</th>
                  <th className="p-4 sm:p-6 text-gray-400 font-bold uppercase tracking-wider">Stan Store</th>
                  <th className="p-4 sm:p-6 text-gray-400 font-bold uppercase tracking-wider">WooCommerce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 sm:p-6 font-bold text-white">{row.feature}</td>
                    <td className="p-4 sm:p-6 font-black text-emerald-400 bg-indigo-950/20 border-x border-indigo-500/20">
                      {row.gumshop}
                    </td>
                    <td className="p-4 sm:p-6 text-gray-400">{row.shopify}</td>
                    <td className="p-4 sm:p-6 text-gray-400">{row.stan}</td>
                    <td className="p-4 sm:p-6 text-gray-400">{row.woo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-[#0E1018] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span><strong>Total Creator Savings:</strong> Save an average of <strong>$580/year</strong> vs. Shopify + paid app plugins.</span>
            </div>
            <Link
              to="/signup"
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-900/40 shrink-0"
            >
              Claim Free Storefront →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  const priceFor = (planName: string, monthly: number) => {
    if (monthly === 0) return 0;
    if (planName === 'Pro') return annual ? 9 : 12;
    if (planName === 'Scale') return annual ? 24 : 29;
    return monthly;
  };

  const annualTotalFor = (planName: string) => {
    if (planName === 'Pro') return 108;
    if (planName === 'Scale') return 288;
    return 0;
  };

  return (
    <section id="pricing" className="scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Simple Pricing
          </p>
          <h2 className="mt-4 text-balance text-4xl font-black tracking-tight text-white md:text-5xl">
            Start free. Scale when you&apos;re ready.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-gray-400">
            No hidden fees. No Shopify-style transaction cuts. Just flat monthly SaaS pricing.
          </p>
        </Reveal>

        <Reveal delay={80} className="mt-9 flex items-center justify-center gap-3">
          <span className={`text-sm font-semibold transition-colors ${annual ? 'text-gray-500' : 'text-white'}`}>
            Monthly
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            aria-label="Toggle annual pricing"
            onClick={() => setAnnual((v) => !v)}
            className={`relative h-7 w-12 rounded-full border border-white/10 transition-colors ${
              annual ? 'bg-indigo-600' : 'bg-white/10'
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                annual ? 'left-7' : 'left-1'
              }`}
            />
          </button>
          <span className={`text-sm font-semibold transition-colors ${annual ? 'text-white' : 'text-gray-500'}`}>
            Annual
          </span>
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-400">
            2 months free (Save 25%)
          </span>
        </Reveal>

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => {
            const external = plan.href.startsWith('http');
            return (
              <Reveal key={plan.name} delay={i * 80} className="h-full">
                <div
                  className={`relative flex h-full flex-col rounded-3xl border p-8 ${
                    plan.popular
                      ? 'border-indigo-500/50 bg-[#14171F] shadow-2xl shadow-indigo-950/50 ring-1 ring-indigo-500/30 lg:-my-3'
                      : 'border-white/8 bg-[#14171F]'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-1 text-xs font-black uppercase tracking-widest text-white shadow-lg">
                      Most Popular
                    </span>
                  )}

                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{plan.tagline}</p>

                  <div className="mt-6 flex items-end gap-1">
                    <span className="text-5xl font-black tracking-tighter text-white">
                      ${priceFor(plan.name, plan.monthly)}
                    </span>
                    <span className="mb-1.5 text-sm font-semibold text-gray-500">/mo</span>
                  </div>
                  {annual && plan.monthly > 0 && (
                    <p className="mt-1 text-xs text-emerald-400 font-semibold">
                      Billed ${annualTotalFor(plan.name)}/year
                    </p>
                  )}

                  {external ? (
                    <a
                      href={plan.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-6 inline-flex items-center justify-center gap-1.5 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all ${
                        plan.popular
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/40 hover:shadow-xl hover:shadow-indigo-900/60'
                          : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ) : (
                    <Link
                      to={plan.href}
                      className={`mt-6 inline-flex items-center justify-center gap-1.5 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all ${
                        plan.popular
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/40 hover:shadow-xl hover:shadow-indigo-900/60'
                          : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  )}

                  <ul className="mt-8 flex flex-col gap-3">
                    {plan.features.map((f) => (
                      <li key={f.label} className="flex items-center gap-3 text-sm">
                        {f.included ? (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                        ) : (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-gray-600">
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                        )}
                        <span className={f.included ? 'text-gray-300' : 'text-gray-600'}>
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={160} className="mt-10 text-center text-sm text-gray-500">
          All plans include a 14-day money-back guarantee. Cancel anytime.
        </Reveal>
      </div>
    </section>
  );
}

const testimonials = [
  {
    quote:
      'I launched my entire EDC accessories store in literally 40 minutes. The Gumroad sync is pure magic.',
    name: 'Marcus T.',
    role: 'EDC Creator',
    initials: 'MT',
    color: 'from-indigo-500 to-purple-600',
  },
  {
    quote:
      'Finally a Shopify alternative that doesn\'t charge 2% on every sale. GumShop pays for itself.',
    name: 'Priya K.',
    role: 'Desk Setup Store',
    initials: 'PK',
    color: 'from-pink-500 to-rose-600',
  },
  {
    quote:
      'The abandoned lead recovery alone doubled my conversion rate in the first week.',
    name: 'Alex M.',
    role: 'Tech Accessories',
    initials: 'AM',
    color: 'from-emerald-500 to-teal-600',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-4xl font-black tracking-tight text-white md:text-5xl">
            Loved by creators and sellers worldwide.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <figure className="flex h-full flex-col rounded-2xl border border-white/8 bg-[#14171F] p-6">
                <div className="flex gap-0.5 text-amber-400" aria-label="5 star rating">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-current" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-pretty leading-relaxed text-gray-300 text-sm">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${t.color} text-sm font-black text-white`}
                    aria-hidden="true"
                  >
                    {t.initials}
                  </span>
                  <span>
                    <span className="block font-bold text-white text-sm">{t.name}</span>
                    <span className="block text-xs text-gray-500">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="px-5 pb-24 md:pb-32 lg:px-8">
      <Reveal className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-pink-900/20 px-6 py-16 text-center md:px-12 md:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(139,92,246,0.2),transparent)]"
          />
          <div className="relative">
            <h2 className="text-balance text-4xl font-black tracking-tight text-white md:text-6xl">
              Your store is 60 seconds away.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-gray-300">
              Join 1,200+ merchants already selling on GumShop. Free to start, no credit card
              required.
            </p>

            <div className="mt-9 flex justify-center">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-bold text-[#07080B] shadow-2xl shadow-black/40 transition-transform hover:scale-[1.03]"
              >
                <Rocket className="h-5 w-5" aria-hidden="true" />
                Launch My Free Store Now
              </Link>
            </div>

            <p className="mt-6 text-sm text-gray-400">
              Already have an account?{' '}
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1 font-semibold text-indigo-300 hover:text-white"
              >
                Sign in <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

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

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features', internal: false },
      { label: 'Pricing', href: '#pricing', internal: false },
      { label: 'How It Works', href: '#how-it-works', internal: false },
      { label: 'Live Demo Store', href: '/store/demo', internal: true },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Admin Login', href: '/admin/login', internal: true },
      { label: 'Create Free Store', href: '/signup', internal: true },
      { label: 'Merchant Guide', href: '/admin/guide', internal: true },
      { label: 'Master Admin / Billing', href: '/super-admin/billing', internal: true },
    ],
  },
  {
    title: 'Storefront',
    links: [
      { label: 'About Us', href: '/about', internal: true },
      { label: 'Customer Support', href: '/contact', internal: true },
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

export function LandingFooter() {
  return (
    <footer className="border-t border-white/5 bg-[#0F1118]">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center shrink-0">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
                  <defs>
                    <linearGradient id="gsFootBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#6366f1"/>
                      <stop offset="100%" stopColor="#9333ea"/>
                    </linearGradient>
                  </defs>
                  <rect width="48" height="48" rx="12" fill="url(#gsFootBg)"/>
                  <path d="M15 20h18l-2 14H17L15 20z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
                  <path d="M19 20c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                  <path d="M25.5 24l-3.5 4.5h3l-1 5 4-5.5h-3l0.5-4z" fill="white"/>
                </svg>
              </span>
              <span className="text-lg font-black tracking-tight text-white">GumShop</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              The 60-Second Headless E-Commerce Platform.
            </p>
            <p className="mt-4 text-xs text-gray-600">
              © 2026 GumShop. All rights reserved.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                {col.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.internal ? (
                      <Link
                        to={link.href}
                        className="text-sm text-gray-400 transition-colors hover:text-indigo-300"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-gray-400 transition-colors hover:text-white"
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

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-sm text-gray-500">
            Made with{' '}
            <span className="text-pink-400" aria-label="love">♥</span>{' '}
            for Gumroad creators worldwide
          </p>
          <div className="flex items-center gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition-colors hover:border-white/20 hover:text-white"
              >
                <s.icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen scroll-smooth bg-[#07080B] text-white selection:bg-sky-500 selection:text-white">
      <LandingNav />
      <main>
        <HeroSection />
        <LogoStrip />
        <ShowcaseCarouselSection />
        <FeaturesSection />
        <CompetitorComparisonSection />
        <HowItWorks />
        <PricingSection />
        <TestimonialsSection />
        <FinalCTA />
      </main>
      <SaaSFooter />
    </div>
  );
};
