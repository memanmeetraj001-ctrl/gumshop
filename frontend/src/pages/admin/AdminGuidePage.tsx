import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Zap,
  Package,
  KeyRound,
  Truck,
  Globe,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const AdminGuidePage: React.FC = () => {
  const [openChapter, setOpenChapter] = useState<number | null>(1);

  const chapters = [
    {
      id: 1,
      title: 'Chapter 1: Store Setup & Brand Customization',
      icon: Globe,
      content: (
        <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
          <p>
            Welcome to GumShop! Your store is pre-configured with modern defaults. Here is how to make it your own:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-400">
            <li><strong>Store Name &amp; Contact:</strong> Go to <Link to="/admin/settings" className="text-indigo-400 font-bold hover:underline">Store Settings</Link> to update your brand name, support email, and currency.</li>
            <li><strong>Theme Colors &amp; Styling:</strong> Go to <Link to="/admin/appearance" className="text-indigo-400 font-bold hover:underline">Appearance &amp; Theme</Link> to select your accent color, fonts, border radius, and announcement banner text.</li>
            <li><strong>Navigation Menu:</strong> Customize your header links in <Link to="/admin/navigation" className="text-indigo-400 font-bold hover:underline">Navigation Menu</Link>.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Chapter 2: Adding Products & The 1-Click Importer',
      icon: Package,
      content: (
        <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
          <p>
            GumShop gives you two fast ways to build your catalog:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-400">
            <li><strong>Manual Entry:</strong> Click <Link to="/admin/products/new" className="text-indigo-400 font-bold hover:underline">Add Product</Link> to upload photos, specs, FAQs, and custom pricing.</li>
            <li><strong>Secret 1-Click Importer:</strong> Open the <Link to="/admin/import" className="text-indigo-400 font-bold hover:underline">Product Importer</Link> tool, paste any Shopify or e-commerce URL, and GumShop will automatically extract titles, prices, descriptions, and CDN photos.</li>
            <li><strong>Free Tier Note:</strong> The Starter Free plan includes up to 10 active products.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 3,
      title: 'Chapter 3: Connecting Gumroad & Automated Sync',
      icon: Zap,
      content: (
        <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
          <p>
            How to get your Gumroad API Access Token and publish your catalog in 1 click:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-gray-400">
            <li>Log in to your account at <a href="https://gumroad.com" target="_blank" rel="noreferrer" className="text-indigo-400 font-bold hover:underline">gumroad.com</a>.</li>
            <li>Click your profile avatar in the top right &gt; select <strong>Settings</strong> &gt; open the <strong>Advanced</strong> tab.</li>
            <li>Scroll down to <strong>Applications</strong> and click <strong>&quot;Generate token&quot;</strong>.</li>
            <li>Copy the token and paste it into <Link to="/admin/gumroad" className="text-indigo-400 font-bold hover:underline">Gumroad Sync</Link>.</li>
            <li>Click <strong>&quot; - Sync All Products&quot;</strong>  - GumShop will automatically create all your items on Gumroad and link the checkout buttons!</li>
          </ol>
        </div>
      ),
    },
    {
      id: 4,
      title: 'Chapter 4: Customer Orders & Shipping Fulfillment',
      icon: Truck,
      content: (
        <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
          <p>
            How the pre-checkout shipping address capture flow works:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-400">
            <li>When a buyer clicks <strong>&quot;Buy Now&quot;</strong> on your store, an on-site modal asks for their delivery address (Street, City, State, ZIP, Country).</li>
            <li>The lead is saved instantly to <Link to="/admin/orders" className="text-indigo-400 font-bold hover:underline">Customer Orders</Link> before the buyer is redirected to Gumroad.</li>
            <li>In the Orders manager, click <strong>&quot;Copy Address&quot;</strong> for instant label printing or <strong>&quot;Export CSV&quot;</strong> for batch shipping with USPS / UPS / FedEx.</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span>GumShop Store Owner Guide &amp; FAQ</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Complete documentation for setting up, importing products, and syncing with Gumroad
        </p>
      </div>

      {/* Chapters Accordion */}
      <div className="space-y-4">
        {chapters.map((ch) => {
          const Icon = ch.icon;
          const isOpen = openChapter === ch.id;

          return (
            <div
              key={ch.id}
              className="bg-[#14141E] border border-white/10 rounded-3xl overflow-hidden shadow-xl"
            >
              <button
                type="button"
                onClick={() => setOpenChapter(isOpen  ? null  : ch.id)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                    {ch.title}
                  </h3>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isOpen  ? 'rotate-180 text-indigo-400'  : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="p-6 pt-2 border-t border-white/5">
                  {ch.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
