'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  CheckCircle, 
  ExternalLink, 
  ShoppingBag, 
  Sparkles, 
  Youtube, 
  Instagram, 
  Twitter, 
  Share2, 
  Lock, 
  Package,
  Layers,
  Check
} from 'lucide-react';
import GumroadIframeModal from '@/components/GumroadIframeModal';
import { getGumroadCheckoutUrl } from '@/lib/gumroad';
import toast from 'react-hot-toast';

export default function CreatorBioPage({ params: rawParams }) {
  const params = use(rawParams);
  const slug = params.slug;

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inframe Checkout Modal state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [activeCheckoutUrl, setActiveCheckoutUrl] = useState('');
  const [activeCheckoutTitle, setActiveCheckoutTitle] = useState('');
  const [activeCheckoutAmount, setActiveCheckoutAmount] = useState('');

  useEffect(() => {
    const loadCreatorData = async () => {
      try {
        const storeRes = await fetch('/api/stores');
        const storeData = await storeRes.json();
        if (storeData.success && Array.isArray(storeData.stores)) {
          const found = storeData.stores.find(s => 
            s.slug.toLowerCase() === slug.toLowerCase() || 
            s.id.toLowerCase() === slug.toLowerCase() ||
            s.id.toLowerCase() === `store_${slug.toLowerCase()}`
          );
          if (found) {
            setStore(found);
            const prodRes = await fetch(`/api/products?store_id=${found.id}`);
            const prodData = await prodRes.json();
            if (prodData.success && Array.isArray(prodData.products)) {
              setProducts(prodData.products.filter(p => p.is_active));
            }
          }
        }
      } catch (e) {
        toast.error('Failed to load creator bio');
      } finally {
        setLoading(false);
      }
    };

    loadCreatorData();
  }, [slug]);

  const handleInstantBuy = (product) => {
    const checkoutUrl = getGumroadCheckoutUrl(product, '', slug);
    setActiveCheckoutUrl(checkoutUrl);
    setActiveCheckoutTitle(product.title);
    setActiveCheckoutAmount(product.price ? product.price.toFixed(2) : '0.00');
    setCheckoutModalOpen(true);
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Creator link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono text-slate-400">Loading Creator Bio...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black mb-2">Creator Not Found</h1>
        <p className="text-xs text-slate-400 mb-6">The creator profile for @{slug} does not exist.</p>
        <Link href="/dashboard" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center p-4 sm:p-6 selection:bg-indigo-500 selection:text-white">
      
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-900/30 via-purple-900/20 to-pink-900/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md mx-auto flex flex-col items-center pt-8 pb-16">
        
        {/* Top Floating Bar */}
        <div className="w-full flex items-center justify-between mb-8 px-2">
          <Link 
            href={`/shop/${slug}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white transition backdrop-blur-md"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
            <span>Visit Full Store</span>
          </Link>

          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white transition backdrop-blur-md"
            title="Share Profile"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Creator Profile Header Matching Mockup */}
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[3px] shadow-xl shadow-indigo-500/20">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-black text-3xl text-white overflow-hidden">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <span>{store.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center border-2 border-slate-950 shadow-md">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
        </div>

        <h1 className="text-xl font-black text-white flex items-center gap-1.5 tracking-tight">
          <span>@{store.name}</span>
        </h1>

        <p className="text-xs text-slate-300 text-center max-w-xs mt-2 leading-relaxed px-4">
          {store.description || 'Digital Creator • Content Strategist • Exclusive Products, Guides & Official Merch'}
        </p>

        {/* Social Icons Row */}
        <div className="flex items-center gap-3 mt-5 mb-8">
          {[
            { icon: Youtube, href: '#' },
            { icon: Instagram, href: '#' },
            { icon: Twitter, href: '#' }
          ].map((soc, i) => (
            <a
              key={i}
              href={soc.href}
              className="w-10 h-10 rounded-full bg-slate-900/80 border border-slate-800/80 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-700 hover:scale-110 transition shadow-sm backdrop-blur-md"
            >
              <soc.icon className="w-4 h-4" />
            </a>
          ))}
        </div>

        {/* Product Cards Stack Matching Mockup */}
        <div className="w-full space-y-4">
          {products.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center backdrop-blur-md">
              <Package className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <div className="text-xs font-bold text-slate-300">Products Coming Soon</div>
              <p className="text-[11px] text-slate-500 mt-1">This creator hasn't published active items yet.</p>
            </div>
          ) : (
            products.map((p, idx) => {
              // Accent color variations
              const borderStyles = [
                'border-cyan-500/30 hover:border-cyan-400/60 bg-gradient-to-b from-slate-900/90 to-slate-900/40',
                'border-purple-500/30 hover:border-purple-400/60 bg-gradient-to-b from-slate-900/90 to-slate-900/40',
                'border-amber-500/30 hover:border-amber-400/60 bg-gradient-to-b from-slate-900/90 to-slate-900/40'
              ];
              const borderStyle = borderStyles[idx % borderStyles.length];

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border p-4 backdrop-blur-md transition-all duration-200 shadow-lg ${borderStyle}`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span>{p.category || 'Featured Release'}</span>
                    <span className="text-emerald-400 font-mono">${p.price?.toFixed(2)} USD</span>
                  </div>

                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-800 overflow-hidden border border-slate-700/80 flex-shrink-0">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 m-auto text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white leading-tight line-clamp-1">{p.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-snug">
                        {p.description || 'Instant digital download or worldwide shipping. Lifetime access.'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => handleInstantBuy(p)}
                      className="py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-md shadow-cyan-500/20 transition flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Instant Buy</span>
                    </button>
                    <Link
                      href={`/shop/${slug}`}
                      className="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center"
                    >
                      <span>Details</span>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Absolutely Zero Third-Party Branding! */}
        <div className="mt-12 text-center text-[11px] text-slate-600">
          <span>Protected by Gumroad 256-bit SSL Rails</span>
        </div>

      </div>

      {/* Gumroad Inframe Checkout Modal */}
      <GumroadIframeModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        checkoutUrl={activeCheckoutUrl}
        productTitle={activeCheckoutTitle}
        amount={activeCheckoutAmount}
      />

    </div>
  );
}
