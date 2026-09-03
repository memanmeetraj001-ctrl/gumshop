import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { demoSoundtrack } from '../../utils/demoSoundtrack';
import {
  X,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  ArrowRight,
  Download,
  RefreshCw,
  ExternalLink,
  Palette,
  ShoppingBag,
  Truck,
  Volume2,
  VolumeX,
  CheckCircle2,
  ShieldCheck,
  Package,
  Layers,
  Search,
  ChevronRight,
  TrendingUp,
  Store,
  DollarSign,
  Globe,
  Smartphone,
  Monitor,
  Settings,
  Flame,
  Check,
  Key,
  ListVideo,
  FastForward,
} from 'lucide-react';

interface VideoDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
}

interface Chapter {
  id: number;
  time: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: any;
  duration: number;
  renderMockup: () => React.ReactNode;
}

export const VideoDemoModal: React.FC<VideoDemoModalProps> = ({ isOpen, onClose, videoUrl }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [elapsed, setElapsed] = useState<number>(0);
  const [currentChapterIdx, setCurrentChapterIdx] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showPlaylist, setShowPlaylist] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const chapters: Chapter[] = [
    {
      id: 1,
      time: '0:00',
      badge: 'Step 1: Onboarding',
      title: 'Store Setup & Onboarding Wizard',
      subtitle: 'Pick your store name, custom subdomain slug, currency, and brand color in seconds.',
      icon: Store,
      duration: 8,
      renderMockup: () => (
        <div className="w-full h-full bg-[#0B0D13] p-4 sm:p-6 flex flex-col justify-between text-left select-none">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold border border-indigo-500/30">
                Step 1 of 4
              </span>
              <span className="text-xs font-bold text-white font-heading">Setup Store Identity</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">Auto-Saving</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-auto">
            <div className="bg-[#121520] p-3 rounded-xl border border-white/10 space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Store Name</label>
              <div className="flex items-center gap-2 text-xs font-bold text-white bg-[#07080C] px-2.5 py-1.5 rounded-lg border border-white/10">
                <Store className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Rubber Couch Studio</span>
              </div>
            </div>

            <div className="bg-[#121520] p-3 rounded-xl border border-white/10 space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Store Subdomain Slug</label>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-[#07080C] px-2.5 py-1.5 rounded-lg border border-white/10">
                <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>gumshop.online/store/rubbercouch</span>
              </div>
            </div>

            <div className="bg-[#121520] p-3 rounded-xl border border-white/10 space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Store Currency</label>
              <div className="flex items-center justify-between text-xs font-bold text-white bg-[#07080C] px-2.5 py-1.5 rounded-lg border border-white/10">
                <span>USD ($ - US Dollar)</span>
                <span className="text-[10px] text-gray-500">7 Active Currencies</span>
              </div>
            </div>

            <div className="bg-[#121520] p-3 rounded-xl border border-white/10 space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Brand Accent Color</label>
              <div className="flex items-center gap-2 text-xs font-bold text-white bg-[#07080C] px-2.5 py-1.5 rounded-lg border border-white/10">
                <span className="w-4 h-4 rounded-full bg-indigo-500 border border-white/40 shadow-sm" />
                <span>Indigo Purple (#6366F1)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
            <span className="text-[10px] text-gray-400">Next: Universal Product Importer</span>
            <div className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-lg flex items-center gap-1 text-[11px] shadow-md animate-pulse">
              <span>Continue →</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      time: '0:08',
      badge: 'Step 2: 1-Click Importer',
      title: 'Universal 1-Click Product Scraper',
      subtitle: 'Paste any Shopify or WooCommerce URL. GumShop extracts photos, titles & prices with automatic discounts.',
      icon: Download,
      duration: 8,
      renderMockup: () => (
        <div className="w-full h-full bg-[#0B0D13] p-4 sm:p-6 flex flex-col justify-between text-left select-none">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase font-heading flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Universal Product Importer</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                Shopify &amp; WooCommerce Engine
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#121520] p-1.5 rounded-xl border border-indigo-500/40">
              <div className="flex-1 px-2.5 py-1 text-xs font-mono text-gray-300 truncate">
                https://store.brand.com/products/wireless-headphones
              </div>
              <div className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 shadow">
                <Sparkles className="w-3 h-3 animate-spin" />
                <span>Scraped (12 Items)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 my-auto">
            {[
              { title: 'Studio Headset Pro', price: '$149.00', orig: '$199.00', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80' },
              { title: 'Matte Leather Strap', price: '$49.00', orig: '$65.00', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80' },
              { title: 'Acoustic Earbuds Gen 2', price: '$89.00', orig: '$120.00', img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&q=80' },
            ].map((item, idx) => (
              <div key={idx} className="bg-[#121520] border border-white/10 rounded-xl p-2 flex flex-col justify-between">
                <div className="aspect-video bg-black/40 rounded-lg overflow-hidden mb-1.5">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="text-[11px] font-bold text-white truncate">{item.title}</div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-[11px] font-black text-indigo-400">{item.price}</span>
                  <span className="text-[9px] text-gray-500 line-through">{item.orig}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Auto-Discount: 25% OFF Applied
            </span>
            <div className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[10px] shadow">
              Replace Demo Catalog &amp; Import (12)
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      time: '0:16',
      badge: 'Step 3: Gumroad Connect',
      title: 'Gumroad API Integration & Catalog Sync',
      subtitle: 'Connect your Gumroad access token and automatically batch-publish your catalog in one click.',
      icon: Key,
      duration: 8,
      renderMockup: () => (
        <div className="w-full h-full bg-[#0B0D13] p-4 sm:p-6 flex flex-col justify-between text-left select-none">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#FF90E8]/20 border border-[#FF90E8]/40 flex items-center justify-center text-[#FF90E8] font-black text-xs">
                G
              </div>
              <span className="text-xs font-bold text-white font-heading">Gumroad Integration Wizard</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
              <Check className="w-3 h-3" /> Connected: ranchiguy
            </span>
          </div>

          <div className="space-y-1.5 my-auto bg-[#121520] p-3 rounded-xl border border-white/10">
            {[
              { name: 'Studio Headset Pro', status: 'Linked', permalink: 'gumroad.com/l/headset-pro' },
              { name: 'Matte Leather Strap', status: 'Linked', permalink: 'gumroad.com/l/leather-strap' },
              { name: 'Acoustic Earbuds Gen 2', status: 'Ready to Sync', permalink: 'Draft Auto-Generated' },
            ].map((row, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 px-2 bg-[#07080C] rounded-lg border border-white/5 text-[11px]">
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span>{row.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-400">{row.permalink}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                    row.status === 'Linked' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {row.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
            <span className="text-[10px] text-gray-400">Auto-Generates Gumroad Checkout Permalinks</span>
            <div className="px-3.5 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-lg text-[10px] shadow-md flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Sync All Products to Gumroad</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      time: '0:24',
      badge: 'Step 4: Merchant CMS',
      title: 'Merchant Command Center & Analytics',
      subtitle: 'Track gross GMV, incoming customer orders, inventory status, and leads in real time.',
      icon: TrendingUp,
      duration: 8,
      renderMockup: () => (
        <div className="w-full h-full bg-[#0B0D13] p-4 sm:p-6 flex flex-col justify-between text-left select-none">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total Revenue', value: '$8,420.00', change: '+24% this week', color: 'text-indigo-400' },
              { label: 'Orders Captured', value: '64 Orders', change: '100% Leads Saved', color: 'text-emerald-400' },
              { label: 'Active Catalog', value: '43 Items', change: 'Gumroad Linked', color: 'text-purple-400' },
              { label: 'Conversion Rate', value: '4.8%', change: 'Direct Checkout', color: 'text-amber-400' },
            ].map((card, idx) => (
              <div key={idx} className="bg-[#121520] p-2.5 rounded-xl border border-white/10">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">{card.label}</span>
                <span className={`text-sm font-black font-heading mt-0.5 block ${card.color}`}>{card.value}</span>
                <span className="text-[8px] text-gray-500 font-mono mt-0.5 block">{card.change}</span>
              </div>
            ))}
          </div>

          <div className="bg-[#121520] rounded-xl border border-white/10 p-2.5 my-auto space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase border-b border-white/5 pb-1">
              <span>Recent Orders (Physical Goods)</span>
              <span>Delivery Address Captured</span>
            </div>
            {[
              { id: 'ORD-84920', name: 'Alexander Ross', city: 'Austin, TX', amt: '$149.00', status: 'Dispatched' },
              { id: 'ORD-84919', name: 'Samantha Wu', city: 'Seattle, WA', amt: '$89.00', status: 'Processing' },
            ].map((ord, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 px-1.5 bg-[#07080C] rounded-lg text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-indigo-400 font-bold">{ord.id}</span>
                  <span className="font-semibold text-white">{ord.name}</span>
                  <span className="text-gray-500 font-mono">({ord.city})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white">{ord.amt}</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[9px] font-bold">
                    {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[10px] text-gray-400">
            <span>Storefront Status: <strong className="text-emerald-400">Live &amp; Taking Orders</strong></span>
            <span className="text-indigo-400 font-bold">View Storefront ↗</span>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      time: '0:32',
      badge: 'Step 5: Theme Studio',
      title: 'Theme Studio & Live Device Simulator',
      subtitle: 'Customize typography, colors, and border styling with instant live preview on Desktop and Mobile frames.',
      icon: Palette,
      duration: 8,
      renderMockup: () => (
        <div className="w-full h-full bg-[#0B0D13] p-4 sm:p-6 flex flex-col justify-between text-left select-none">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-white uppercase font-heading flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Theme Studio &amp; Design Presets</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-white/10 text-white"><Monitor className="w-3 h-3" /></span>
              <span className="p-1 rounded bg-white/5 text-gray-400"><Smartphone className="w-3 h-3" /></span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 my-auto">
            <div className="col-span-1 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Curated Presets</span>
              {[
                { name: 'Cyber Obsidian', active: true, color: 'bg-indigo-600' },
                { name: 'Luxury Minimalist', active: false, color: 'bg-amber-600' },
                { name: 'Specialty Roaster', active: false, color: 'bg-emerald-600' },
              ].map((preset, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border text-[10px] font-bold flex items-center justify-between ${
                    preset.active ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-[#121520] border-white/5 text-gray-400'
                  }`}
                >
                  <span>{preset.name}</span>
                  <span className={`w-2 h-2 rounded-full ${preset.color}`} />
                </div>
              ))}
            </div>

            <div className="col-span-2 bg-[#121520] rounded-xl border border-white/10 p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-md bg-indigo-600 text-[9px] font-black text-white flex items-center justify-center">R</span>
                  <span className="text-[11px] font-black text-white">Rubber Couch</span>
                </div>
                <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">Free Worldwide Shipping</span>
              </div>
              <div className="text-center py-2">
                <h4 className="text-xs font-black text-white uppercase font-heading">Exclusive Audio Hardware</h4>
                <p className="text-[9px] text-gray-400 mt-0.5">Designed for creators and studio masters.</p>
              </div>
              <div className="py-1.5 bg-indigo-600 text-white text-center rounded-lg text-[10px] font-bold shadow">
                Shop Catalog (43 Items)
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] text-gray-400">
            <span>Instant CSS Variable Injection</span>
            <span className="text-emerald-400 font-bold">100% Mobile Responsive</span>
          </div>
        </div>
      ),
    },
    {
      id: 6,
      time: '0:40',
      badge: 'Step 6: Customer Storefront',
      title: 'High-Converting Multi-Tenant Storefront',
      subtitle: 'Shoppers browse your brand catalog and click "Buy Now" to open our 1-click address capture modal.',
      icon: ShoppingBag,
      duration: 8,
      renderMockup: () => (
        <div className="w-full h-full bg-[#0B0D13] p-4 sm:p-6 flex flex-col justify-between text-left select-none">
          <div className="bg-[#121520] rounded-2xl border border-indigo-500/40 p-3.5 space-y-2.5 my-auto shadow-2xl shadow-indigo-950/50">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-black text-white font-heading">1-Click Shipping Address Capture</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">SSL Encrypted</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-[#07080C] p-2 rounded-lg border border-white/5 space-y-0.5">
                <span className="text-gray-500 block">Customer Name</span>
                <span className="font-bold text-white block">Alexander Ross</span>
              </div>
              <div className="bg-[#07080C] p-2 rounded-lg border border-white/5 space-y-0.5">
                <span className="text-gray-500 block">Email Address</span>
                <span className="font-bold text-white block">alex@example.com</span>
              </div>
              <div className="bg-[#07080C] p-2 rounded-lg border border-white/5 space-y-0.5 col-span-2">
                <span className="text-gray-500 block">Street Address</span>
                <span className="font-bold text-white block">742 Evergreen Terrace, Austin, TX 78701</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-[10px] text-gray-400">Total: <strong className="text-white text-xs">$149.00</strong></div>
              <div className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl text-[10px] shadow flex items-center gap-1.5 animate-pulse">
                <span>Save Lead &amp; Pay on Gumroad →</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-gray-400">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Delivery Address Captured Before Payment
            </span>
            <span>Zero Lost Physical Orders</span>
          </div>
        </div>
      ),
    },
    {
      id: 7,
      time: '0:48',
      badge: 'Step 7: Manual Fulfillment',
      title: 'Manual Fulfillment & Order Tracking',
      subtitle: 'Review orders in Admin, input carrier tracking numbers (USPS/FedEx), and give buyers live tracking.',
      icon: Truck,
      duration: 8,
      renderMockup: () => (
        <div className="w-full h-full bg-[#0B0D13] p-4 sm:p-6 flex flex-col justify-between text-left select-none">
          <div className="space-y-3 my-auto">
            <div className="bg-[#121520] p-3 rounded-xl border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 font-bold block">ORDER #GUM-84920</span>
                <span className="text-xs font-bold text-white block mt-0.5">Alexander Ross — Studio Headset Pro</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-emerald-400 font-bold block">Carrier: USPS Priority</span>
                <span className="text-[10px] font-mono text-gray-300 block">9400 1000 0000 0000 12</span>
              </div>
            </div>

            <div className="bg-[#121520] p-3 rounded-xl border border-white/10 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Public Order Tracking Timeline (/track)</span>
              <div className="grid grid-cols-4 gap-1 text-center">
                {[
                  { step: 'Placed', done: true },
                  { step: 'Processing', done: true },
                  { step: 'Dispatched', done: true, active: true },
                  { step: 'Delivered', done: false },
                ].map((s, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className={`h-1.5 rounded-full ${s.done ? 'bg-indigo-500' : 'bg-white/10'}`} />
                    <span className={`text-[9px] font-bold block ${s.active ? 'text-indigo-400' : s.done ? 'text-white' : 'text-gray-600'}`}>
                      {s.step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-gray-400">
            <span>Customer self-service tracking at <strong>/track</strong></span>
            <span className="text-indigo-400 font-bold">Print Packing Slips ↗</span>
          </div>
        </div>
      ),
    },
    {
      id: 8,
      time: '0:56',
      badge: 'Step 8: Master Platform',
      title: 'Master Super-Admin Multi-Tenant Operations',
      subtitle: 'Manage all tenant storefronts, switch store subscription tiers, and view platform gross revenue.',
      icon: Layers,
      duration: 8,
      renderMockup: () => (
        <div className="w-full h-full bg-[#0B0D13] p-4 sm:p-6 flex flex-col justify-between text-left select-none">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-white uppercase font-heading flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Master Platform Directory (/super-admin)</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">
              Super-Admin Mode
            </span>
          </div>

          <div className="space-y-1.5 my-auto bg-[#121520] p-3 rounded-xl border border-white/10">
            {[
              { store: 'Rubber Couch Studio', owner: 'owner@rubbercouch.com', plan: 'Scale (Unlimited)', gmv: '$8,420' },
              { store: 'Modern Minimalist Gear', owner: 'admin@gumshop.online', plan: 'Pro (50 Items)', gmv: '$3,890' },
              { store: 'Artisan Coffee Roasters', owner: 'contact@roaster.io', plan: 'Free Tier (10)', gmv: '$1,240' },
            ].map((tenant, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 px-2 bg-[#07080C] rounded-lg text-[10px]">
                <div>
                  <span className="font-bold text-white block">{tenant.store}</span>
                  <span className="text-gray-500 font-mono text-[9px] block">{tenant.owner}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-emerald-400">{tenant.gmv}</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold text-[9px]">
                    {tenant.plan}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-gray-400">
            <span>SaaS Billing Webhooks &amp; Automated Tier Upgrades</span>
            <span className="text-emerald-400 font-bold">Platform Status: Healthy ✅</span>
          </div>
        </div>
      ),
    },
  ];

  const TOTAL_DURATION = chapters.reduce((acc, c) => acc + c.duration, 0); // 64s total

  const handleClose = () => {
    demoSoundtrack.stop();
    onClose();
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      demoSoundtrack.stop();
    } else if (isPlaying) {
      demoSoundtrack.play();
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next && !isMuted) demoSoundtrack.play();
      else demoSoundtrack.stop();
      return next;
    });
  };

  const handleStop = () => {
    setIsPlaying(false);
    setElapsed(0);
    setCurrentChapterIdx(0);
    demoSoundtrack.stop();
  };

  const handlePrevChapter = () => {
    const prevIdx = Math.max(0, currentChapterIdx - 1);
    jumpToChapter(prevIdx);
  };

  const handleNextChapter = () => {
    const nextIdx = Math.min(chapters.length - 1, currentChapterIdx + 1);
    jumpToChapter(nextIdx);
  };

  const jumpToChapter = (idx: number) => {
    let start = 0;
    for (let i = 0; i < idx; i++) {
      start += chapters[i].duration;
    }
    setElapsed(start);
    setCurrentChapterIdx(idx);
    setIsPlaying(true);
    if (!isMuted) demoSoundtrack.play();
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    if (isOpen && isPlaying && !isMuted) {
      demoSoundtrack.play();
    } else {
      demoSoundtrack.stop();
    }

    return () => demoSoundtrack.stop();
  }, [isOpen, isPlaying, isMuted]);

  // Global Keyboard Shortcuts (Esc, Q, X to exit, Space for play/pause, Left/Right for seek)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'q' || e.key === 'Q' || e.key === 'x' || e.key === 'X') {
        if (isFullscreen) {
          document.exitFullscreen?.();
          setIsFullscreen(false);
        } else {
          handleClose();
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleMute();
      } else if (e.key === 'ArrowRight') {
        setElapsed((prev) => Math.min(TOTAL_DURATION, prev + 4));
      } else if (e.key === 'ArrowLeft') {
        setElapsed((prev) => Math.max(0, prev - 4));
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, isPlaying, isMuted, TOTAL_DURATION]);

  // 60fps Loop
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + (0.05 * playbackSpeed);
        if (next >= TOTAL_DURATION) {
          return 0; // Loop seamlessly
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, TOTAL_DURATION, playbackSpeed]);

  // Map elapsed to chapter
  useEffect(() => {
    let accumulated = 0;
    for (let i = 0; i < chapters.length; i++) {
      accumulated += chapters[i].duration;
      if (elapsed < accumulated) {
        setCurrentChapterIdx(i);
        break;
      }
    }
  }, [elapsed, chapters]);

  if (!isOpen) return null;

  const currentChapter = chapters[currentChapterIdx] || chapters[0];
  const progressPercent = Math.min(100, (elapsed / TOTAL_DURATION) * 100);

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) {
          handleClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-150 cursor-default"
    >
      {/* 🔴 Prominent Floating Top-Right Exit Button */}
      <button
        type="button"
        onClick={handleClose}
        className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[60] px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-2xl shadow-red-900/60 border border-white/20 transition-all hover:scale-105"
        title="Exit Video Player (Esc or Q)"
      >
        <X className="w-4 h-4" />
        <span>Exit Player (Esc)</span>
      </button>

      {/* ── Main VLC-Style Player Container ── */}
      <div
        ref={containerRef}
        className="relative w-full max-w-4xl bg-[#181A20] border-2 border-[#333742] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl shadow-black flex flex-col max-h-[96vh]"
      >
        {/* ── 1. VLC Classic Titlebar ── */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#20232B] border-b border-[#2C303B] text-gray-300 select-none">
          <div className="flex items-center gap-2 truncate">
            {/* VLC Traffic Cone / Logo Accent */}
            <div className="w-5 h-5 rounded bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-[10px] font-black shadow">
              ▲
            </div>
            <span className="text-xs font-bold text-white font-mono truncate">
              GumShop_Platform_Tour_60s.mp4 — VLC Media Player
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 px-2 rounded bg-red-600/80 hover:bg-red-600 text-white transition-colors font-bold text-xs"
              title="Close Player (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── 2. Screen / Canvas Viewport (16:9) ── */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group select-none">
          {videoUrl ? (
            <iframe
              src={videoUrl}
              title="GumShop Video"
              className="w-full h-full border-0"
              allow="autoplay"
              allowFullScreen
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              {/* Dynamic Live Vector UI Render */}
              <div className="absolute inset-0 w-full h-full transition-all duration-200">
                {currentChapter.renderMockup()}
              </div>

              {/* Floating VLC OSD (On-Screen Display) Badge */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-orange-500/40 shadow-lg text-orange-400">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white">
                  Chapter {currentChapter.id}/{chapters.length}: {currentChapter.badge}
                </span>
              </div>

              {/* Click-to-Play/Pause Overlay */}
              <div
                onClick={handleTogglePlay}
                className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
              >
                <div className="p-3.5 rounded-full bg-orange-600/90 text-white shadow-2xl backdrop-blur-md">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 3. Narration Strip / Current Step Info ── */}
        <div className="px-3.5 py-2.5 bg-[#12141A] border-t border-[#262A34] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30 shrink-0">
              {React.createElement(currentChapter.icon, { className: 'w-4 h-4' })}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white block truncate">{currentChapter.title}</span>
              <span className="text-[11px] text-gray-400 block truncate">{currentChapter.subtitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Speed Multiplier */}
            <button
              type="button"
              onClick={() => {
                const speeds = [1.0, 1.25, 1.5, 2.0];
                const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
                setPlaybackSpeed(next);
              }}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-[10px] font-mono font-bold text-gray-300"
              title="Change Speed"
            >
              {playbackSpeed}x
            </button>

            {/* Playlist Toggle */}
            <button
              type="button"
              onClick={() => setShowPlaylist(!showPlaylist)}
              className={`px-2 py-1 rounded border text-[10px] font-bold flex items-center gap-1 transition-colors ${
                showPlaylist ? 'bg-orange-600 text-white border-orange-500' : 'bg-white/5 text-gray-300 border-white/10'
              }`}
            >
              <ListVideo className="w-3 h-3" />
              <span>Chapters ({chapters.length})</span>
            </button>
          </div>
        </div>

        {/* ── 4. Expandable Playlist Drawer ── */}
        {showPlaylist && (
          <div className="p-2 bg-[#0E1015] border-t border-[#262A34] grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
            {chapters.map((ch, idx) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  jumpToChapter(idx);
                  setShowPlaylist(false);
                }}
                className={`p-1.5 rounded-lg text-left truncate font-bold transition-all border ${
                  currentChapterIdx === idx
                    ? 'bg-orange-600 text-white border-orange-500'
                    : 'bg-[#181A20] text-gray-400 border-white/5 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{ch.id}. {ch.badge.replace('Step ', '')}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── 5. Iconic VLC Control Dock ── */}
        <div className="p-3 bg-[#1D2028] border-t border-[#2C303B] space-y-2.5 select-none">
          {/* VLC Scrubber Slider */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-bold text-orange-400 w-10 text-right">
              {formatSecs(elapsed)}
            </span>

            <div
              className="relative flex-1 h-2 bg-[#2E3340] rounded-full overflow-hidden cursor-pointer group/seek"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pct = Math.max(0, Math.min(1, clickX / rect.width));
                setElapsed(pct * TOTAL_DURATION);
              }}
            >
              <div
                className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <span className="text-[10px] font-mono font-bold text-gray-400 w-10">
              {formatSecs(TOTAL_DURATION)}
            </span>
          </div>

          {/* VLC Playback Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            {/* Transport Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevChapter}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                title="Previous Chapter"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                className="p-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition-all shadow-md shadow-orange-950 flex items-center justify-center"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleStop}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                title="Stop / Reset"
              >
                <Square className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNextChapter}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                title="Next Chapter"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-white/10 mx-1" />

              {/* Audio Mute Toggle */}
              <button
                type="button"
                onClick={handleToggleMute}
                className={`p-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  !isMuted ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
                title={isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
              >
                {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="text-[10px] hidden sm:inline">{!isMuted ? 'Sound On' : 'Muted'}</span>
              </button>
            </div>

            {/* Right Action: Launch & Direct Close */}
            <div className="flex items-center gap-2">
              <Link
                to="/signup"
                onClick={handleClose}
                className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-md flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Launch Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {/* Big Red Exit Button right in the dock */}
              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-1.5 bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                title="Exit Player (Esc / Q)"
              >
                <X className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
