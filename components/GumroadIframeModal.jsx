'use client';
import { useState, useEffect } from 'react';
import { X, Lock, ExternalLink, ShieldCheck, Loader2 } from 'lucide-react';

export default function GumroadIframeModal({ isOpen, onClose, checkoutUrl, productTitle, amount }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Disable body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !checkoutUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl h-[92vh] max-h-[750px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                <span>Secure Checkout</span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">256-bit Encrypted</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-[280px]">
                {productTitle} {amount ? `• $${amount}` : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href={checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition text-xs flex items-center gap-1"
              title="Open full page in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-500/80 text-slate-300 hover:text-white transition"
              title="Close checkout"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Embedded Iframe */}
        <div className="relative flex-1 w-full bg-white">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900 text-slate-300 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-xs font-medium text-slate-400">Connecting to secure checkout rail...</p>
            </div>
          )}

          <iframe
            src={checkoutUrl}
            title="Gumroad Payment Terminal"
            className="w-full h-full border-0"
            allow="payment; camera"
            onLoad={() => setLoading(false)}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guaranteed Buyer Protection & Instant Delivery</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 transition font-medium"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
