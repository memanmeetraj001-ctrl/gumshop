'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ShoppingBag, ArrowRight, Package, ShieldCheck } from 'lucide-react';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || searchParams.get('sale_id') || `GS-${Date.now().toString().slice(-6)}`;
  const storeSlug = searchParams.get('store') || '';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 text-center">
        
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
          Payment Confirmed
        </span>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-3">
          Thank you for your order!
        </h1>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Your payment was processed successfully via Gumroad secure rails. A receipt and product access link have been dispatched to your email.
        </p>

        <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Order Reference</span>
            <span className="font-mono font-bold text-slate-900">{orderId}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Status</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          {storeSlug && (
            <Link
              href={`/shop/${storeSlug}`}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Return to Storefront</span>
            </Link>
          )}

          <Link
            href="/dashboard"
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <span>Merchant Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading order receipt...</div>}>
      <ThankYouContent />
    </Suspense>
  );
}
