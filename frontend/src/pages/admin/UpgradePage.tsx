import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import {
  Zap,
  Check,
  Crown,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Layers,
  Globe,
  Tag,
  Headphones,
  CheckCircle2,
} from 'lucide-react';

export const UpgradePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get('plan');

  const [annual, setAnnual] = useState(false);
  const [activePlan, setActivePlan] = useState<'free' | 'pro' | 'scale'>('free');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('active');
  const [planExpiresAt, setPlanExpiresAt] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getBillingPlan()
      .then((data) => {
        setActivePlan(data.plan);
        setSubscriptionStatus(data.subscriptionStatus || 'active');
        setPlanExpiresAt(data.planExpiresAt);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan: 'pro' | 'scale') => {
    try {
      setCheckoutLoading(plan);
      setError(null);
      const cycle = annual ? 'annual' : 'monthly';
      const { checkoutUrl } = await api.getCheckoutUrl(plan, cycle);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setError('Could not generate checkout link. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate checkout. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const proPrice = annual ? 9 : 12;
  const scalePrice = annual ? 24 : 29;

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SaaS Plan Upgrades</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight font-heading">
          Scale Your Store Without Limits
        </h1>
        <p className="text-sm text-gray-400 max-w-xl mx-auto">
          Choose the right plan to unlock unlimited inventory imports, custom domains, and automated sales sync.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold text-center">
          {error}
        </div>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${!annual ? 'text-white' : 'text-gray-500'}`}>
          Monthly Billing
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          onClick={() => setAnnual((v) => !v)}
          className={`relative h-8 w-14 rounded-full border border-white/10 transition-colors p-1 ${
            annual ? 'bg-indigo-600' : 'bg-white/10'
          }`}
        >
          <span
            className={`block h-6 w-6 rounded-full bg-white transition-transform ${
              annual ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
        <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${annual ? 'text-white' : 'text-gray-500'}`}>
          Annual Billing
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
          Save 25% (2 Months Free)
        </span>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Starter Free */}
        <div className={`rounded-3xl border p-6 sm:p-8 flex flex-col justify-between transition-all ${
          activePlan === 'free' ? 'border-white/20 bg-[#14171F]' : 'border-white/5 bg-[#0F1118] opacity-80'
        }`}>
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Starter</span>
                <h3 className="text-xl font-black text-white mt-1">Free Tier</h3>
              </div>
              {activePlan === 'free' && (
                <span className="px-2.5 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase">
                  Current
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">Perfect for exploring and launching your very first store.</p>
            <div className="pt-2">
              <span className="text-4xl font-black text-white">$0</span>
              <span className="text-xs text-gray-500 ml-1">/forever</span>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-gray-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>10 Active Products</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>1-Click Scraper Importer</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Gumroad Instant Checkout Sync</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Customer Shipping Address Capture</span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <div className="w-full py-3 rounded-xl bg-white/5 text-gray-400 text-xs font-bold text-center uppercase tracking-wider">
              {activePlan === 'free' ? '✓ Currently Active' : 'Free Tier'}
            </div>
          </div>
        </div>

        {/* Pro Creator */}
        <div className={`rounded-3xl border p-6 sm:p-8 flex flex-col justify-between relative shadow-2xl transition-all ${
          activePlan === 'pro'
            ? 'border-indigo-500 bg-gradient-to-b from-indigo-950/40 to-[#14171F] ring-2 ring-indigo-500/50'
            : initialPlan === 'pro'
            ? 'border-indigo-500 bg-[#14171F] ring-2 ring-indigo-500/30'
            : 'border-indigo-500/30 bg-[#14171F] hover:border-indigo-500/60'
        }`}>
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-900/50">
            Recommended
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Creator</span>
                <h3 className="text-xl font-black text-white mt-1">Pro Plan</h3>
              </div>
              {activePlan === 'pro' && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">For serious creators building a recognizable eCommerce brand.</p>
            <div className="pt-2">
              <span className="text-4xl font-black text-white">${proPrice}</span>
              <span className="text-xs text-gray-500 ml-1">/month</span>
              {annual && (
                <p className="text-[11px] text-emerald-400 font-semibold mt-1">Billed $108 annually</p>
              )}
            </div>

            <div className="pt-4 border-t border-white/5 space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-white font-medium">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>50 Active Products</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-white font-medium">
                <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                <span><strong>Custom Domain Support</strong> (yourbrand.com)</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-300">
                <Tag className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Promo Codes &amp; Discount Engine</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Live Order Tracking Timeline</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Abandoned Lead Email Recovery</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-300">
                <Headphones className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Priority Customer Support</span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            {activePlan === 'pro' ? (
              <div className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center uppercase tracking-wider flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Currently Active Plan</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleUpgrade('pro')}
                disabled={checkoutLoading !== null}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {checkoutLoading === 'pro' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting to Checkout…</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Upgrade to Pro — ${proPrice}/mo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Unlimited Scale */}
        <div className={`rounded-3xl border p-6 sm:p-8 flex flex-col justify-between transition-all ${
          activePlan === 'scale'
            ? 'border-purple-500 bg-gradient-to-b from-purple-950/40 to-[#14171F] ring-2 ring-purple-500/50'
            : 'border-purple-500/30 bg-[#14171F] hover:border-purple-500/60'
        }`}>
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Enterprise</span>
                <h3 className="text-xl font-black text-white mt-1">Scale Plan</h3>
              </div>
              {activePlan === 'scale' && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">For multi-store entrepreneurs and high-volume power sellers.</p>
            <div className="pt-2">
              <span className="text-4xl font-black text-white">${scalePrice}</span>
              <span className="text-xs text-gray-500 ml-1">/month</span>
              {annual && (
                <p className="text-[11px] text-purple-400 font-semibold mt-1">Billed $288 annually</p>
              )}
            </div>

            <div className="pt-4 border-t border-white/5 space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-white font-medium">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong>Unlimited Active Products</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-white font-medium">
                <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                <span><strong>Unlimited Multi-Tenant Stores</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Everything in Pro Plan</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-300">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                <span>100% White-Label (Remove Badge)</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Webhook Webhook Sync Engine</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-300">
                <Headphones className="w-4 h-4 text-purple-400 shrink-0" />
                <span>VIP 1-on-1 Onboarding Support</span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            {activePlan === 'scale' ? (
              <div className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center uppercase tracking-wider flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Currently Active Plan</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleUpgrade('scale')}
                disabled={checkoutLoading !== null}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {checkoutLoading === 'scale' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting to Checkout…</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    <span>Upgrade to Scale — ${scalePrice}/mo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* License Key Quick Claim Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#14171F] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Already Purchased on Gumroad? Activate License Key</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              If you purchased your subscription directly on Gumroad, enter your license key from your receipt below for instant activation.
            </p>
          </div>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formEl = e.currentTarget;
            const keyInput = (formEl.elements.namedItem('licenseKey') as HTMLInputElement)?.value;
            const emailInput = (formEl.elements.namedItem('email') as HTMLInputElement)?.value;
            try {
              setCheckoutLoading('claim');
              setError(null);
              const res = await api.claimLicense(emailInput, keyInput);
              if (res.success) {
                setActivePlan((res.plan as 'free' | 'pro' | 'scale') || 'pro');
                alert(res.message || 'Plan upgraded successfully!');
              }
            } catch (err: any) {
              setError(err.message || 'Invalid license key or email.');
            } finally {
              setCheckoutLoading(null);
            }
          }}
          className="flex flex-col sm:flex-row items-center gap-3 pt-2"
        >
          <input
            type="email"
            name="email"
            required
            placeholder="Account Email (e.g. your@store.com)"
            className="w-full sm:w-1/3 px-4 py-2.5 rounded-xl bg-[#090B0E] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            name="licenseKey"
            required
            placeholder="Gumroad License Key (e.g. GUM-PRO-XXXX-XXXX)"
            className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-[#090B0E] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={checkoutLoading === 'claim'}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shrink-0"
          >
            {checkoutLoading === 'claim' ? 'Activating…' : 'Activate Plan'}
          </button>
        </form>
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="p-6 rounded-3xl bg-[#14171F] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Secure Subscription via Gumroad
            </h4>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Encrypted 256-bit SSL checkout. Visa, Mastercard, AMEX, PayPal, Apple Pay, and Google Pay supported.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest shrink-0">
          Manage &amp; cancel anytime with 1-click
        </span>
      </div>
    </div>
  );
};
