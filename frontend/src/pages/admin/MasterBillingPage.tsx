import React, { useState } from 'react';
import { api } from '../../api/client';
import {
  CreditCard,
  Zap,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Radio,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const MasterBillingPage: React.FC = () => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [testEmail, setTestEmail] = useState('admin@gumshop.online');
  const [testPlan, setTestPlan] = useState<'pro' | 'scale'>('pro');
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);

  const webhookEndpoint = `${window.location.protocol}//${window.location.host}/api/billing/webhook`;
  const productionWebhook = 'https://gumshop.online/api/billing/webhook';

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleSimulateWebhook = async () => {
    setSimulating(true);
    setSimulationResult(null);
    try {
      const res = await fetch('/api/billing/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail.trim(),
          product_name: testPlan === 'scale' ? 'GumShop Scale Plan' : 'GumShop Pro Plan',
          permalink: testPlan === 'scale' ? 'gumshop-scale' : 'gumshop-pro',
          price: testPlan === 'scale' ? 2900 : 1200,
          currency: 'usd',
        }),
      });
      const data = await res.json();
      setSimulationResult(data);
    } catch (err: any) {
      setSimulationResult({ error: err.message });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-indigo-400" />
          <span>SaaS Billing &amp; Revenue Operations</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Collect recurring subscriptions for your SaaS platform via your Gumroad account
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#10121A] border border-indigo-500/20 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Target Annual Recurring Revenue</span>
          </span>
          <h3 className="text-3xl font-black text-emerald-400 mt-2">$123,804</h3>
          <p className="text-[11px] text-gray-500 mt-1">From Pro ($12/mo) and Scale ($29/mo) plans</p>
        </div>

        <div className="bg-[#10121A] border border-indigo-500/20 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>Active Tier Pricing</span>
          </span>
          <h3 className="text-2xl font-black text-white mt-2">$12/mo &amp; $29/mo</h3>
          <p className="text-[11px] text-gray-500 mt-1">Pro (50 products) &amp; Scale (unlimited)</p>
        </div>

        <div className="bg-[#10121A] border border-indigo-500/20 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Platform Owner Gumroad Account</span>
          </span>
          <h3 className="text-lg font-black text-purple-400 mt-2 font-mono truncate">manmeetraj6</h3>
          <p className="text-[11px] text-gray-500 mt-1">Direct payouts deposited automatically</p>
        </div>
      </div>

      {/* Step-by-Step Setup Guide */}
      <div className="bg-[#10121A] border border-indigo-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
              <span>Connect Gumroad Webhook Listener (3 Simple Steps)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Whenever a customer subscribes on Gumroad, Gumroad pings this URL and unlocks their store limits automatically
            </p>
          </div>

          <span className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
            <CheckCircle2 className="w-4 h-4" />
            <span>Listener Active on /api/billing/webhook</span>
          </span>
        </div>

        {/* Step Cards */}
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="p-5 bg-[#07080B] border border-white/10 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Copy Your Webhook (Ping) URL</h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  This is the endpoint Gumroad must send subscription events to.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-mono text-xs bg-black/60 border border-white/10 px-3 py-1.5 rounded-xl text-indigo-300 select-all">
                    {productionWebhook}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyWebhookUrl(productionWebhook)}
                    className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-5 bg-[#07080B] border border-white/10 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                2
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Paste into Gumroad Settings &gt; Advanced &gt; Ping</h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Log in to your Gumroad dashboard, go to <strong>Settings &gt; Advanced</strong>, scroll to <strong>Ping</strong>, and paste the URL.
                </p>
              </div>
            </div>
            <a
              href="https://app.gumroad.com/settings/advanced"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shrink-0"
            >
              <span>Open Gumroad Advanced Settings</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Step 3 */}
          <div className="p-5 bg-[#07080B] border border-white/10 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Ensure Your Products are Published on Gumroad</h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Confirm your Pro ($12) and Scale ($29) membership products have permalinks matching:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <a
                    href="https://manmeetraj6.gumroad.com/l/gumshop-pro"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-black/40 border border-white/5 rounded-xl text-xs font-mono text-indigo-300 hover:border-indigo-500/30 flex items-center justify-between gap-2"
                  >
                    <span>/l/gumshop-pro</span>
                    <ExternalLink className="w-3 h-3 text-gray-500" />
                  </a>
                  <a
                    href="https://manmeetraj6.gumroad.com/l/gumshop-scale"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-black/40 border border-white/5 rounded-xl text-xs font-mono text-purple-300 hover:border-purple-500/30 flex items-center justify-between gap-2"
                  >
                    <span>/l/gumshop-scale</span>
                    <ExternalLink className="w-3 h-3 text-gray-500" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Simulator */}
        <div className="p-6 bg-gradient-to-br from-indigo-950/20 to-purple-950/20 border border-indigo-500/30 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-bold text-white">Simulate a Subscription Ping Live</h4>
          </div>
          <p className="text-xs text-gray-400">
            Send a synthetic test ping to the webhook handler right now to verify store upgrade automation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase">Store Owner Email</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase">Plan to Activate</label>
              <select
                value={testPlan}
                onChange={(e) => setTestPlan(e.target.value as any)}
                className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="pro">Pro Plan ($12/mo - 50 slots)</option>
                <option value="scale">Scale Plan ($29/mo - Unlimited slots)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSimulateWebhook}
                disabled={simulating}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {simulating ? 'Sending...' : '⚡ Test Webhook Ping'}
              </button>
            </div>
          </div>

          {simulationResult && (
            <div className="p-3.5 bg-black/70 border border-indigo-500/30 rounded-xl text-xs font-mono text-emerald-400 flex items-center justify-between">
              <span>Webhook Response: {JSON.stringify(simulationResult)}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

