import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { formatPrice } from '../../utils/formatters';
import { Category, Product } from '../../types';
import {
  Download,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Zap,
  Tag,
} from 'lucide-react';

export const AdminScraperPage: React.FC = () => {
  const navigate = useNavigate();

  // Legal Disclaimer state
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);

  // Scraper Form State
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
  const [wooKey, setWooKey] = useState('');
  const [wooSecret, setWooSecret] = useState('');
  const [scrapedProducts, setScrapedProducts] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Import Settings
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(50); // Default 50% discount
  const [importStatus, setImportStatus] = useState<'published' | 'draft'>('published');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Existing store product count for 10-product limit check
  const [currentProductCount, setCurrentProductCount] = useState<number>(0);
  const maxLimit = 10;

  useEffect(() => {
    api.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setSelectedCategory(cats[0].id);
    }).catch(() => {});

    api.getProducts({ status: 'all' }).then((prods) => {
      setCurrentProductCount(prods.length);
    }).catch(() => {});
  }, []);

  const remainingSlots = Math.max(0, maxLimit - currentProductCount);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setScanning(true);
    setError(null);
    setScrapedProducts([]);
    setImportResult(null);

    try {
      // 1. Detect platform
      const detect = await api.detectPlatform(url.trim());
      setDetectedPlatform(detect.platform);

      // 2. Execute appropriate scraper
      let res;
      if (detect.platform === 'shopify') {
        res = await api.scrapeShopify(url.trim());
      } else if (detect.platform === 'woocommerce') {
        res = await api.scrapeWooCommerce(url.trim(), wooKey || undefined, wooSecret || undefined);
      } else {
        res = await api.scrapeHtml(url.trim());
      }

      if (res && res.products && res.products.length > 0) {
        setScrapedProducts(res.products);
        // Pre-select up to the remaining slots
        const initialSelected = new Set<number>();
        const toSelect = Math.min(res.products.length, remainingSlots);
        for (let i = 0; i < toSelect; i++) initialSelected.add(i);
        setSelectedIndices(initialSelected);
      } else {
        setError('No products found at this URL. Please verify the link is accessible.');
      }
    } catch (err: any) {
      setError(err.message || 'Scrape failed. Please check the URL.');
    } finally {
      setScanning(false);
    }
  };

  const toggleSelect = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIndices.size === scrapedProducts.length) {
      setSelectedIndices(new Set());
    } else {
      const all = new Set<number>();
      scrapedProducts.forEach((_, i) => all.add(i));
      setSelectedIndices(all);
    }
  };

  const handleImport = async () => {
    if (selectedIndices.size === 0) {
      alert('Please select at least one product to import.');
      return;
    }

    if (selectedIndices.size > remainingSlots) {
      if (!confirm(`You have selected ${selectedIndices.size} products, but only ${remainingSlots} free slots remain (10 limit). Only the first ${remainingSlots} will be imported. Proceed-`)) {
        return;
      }
    }

    setImporting(true);
    setError(null);

    const selectedList = scrapedProducts.filter((_, i) => selectedIndices.has(i));

    try {
      const res = await api.importScrapedProducts({
        products: selectedList,
        categoryId: selectedCategory,
        discountPercent,
        status: importStatus,
      });

      setImportResult(res);
      setCurrentProductCount(res.totalNow);
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Legal Disclaimer Modal */}
      {!hasAgreed && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#14141E] border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase font-heading">
                  Product Importer Terms of Use
                </h3>
                <p className="text-[11px] text-gray-400">Please review before using the import tool</p>
              </div>
            </div>

            <div className="p-4 bg-[#0A0A0F] rounded-2xl border border-white/5 text-xs text-gray-300 leading-relaxed space-y-2">
              <p>
                <strong>Important Legal Notice:</strong> You must have legal rights to import and sell the products you are migrating.
              </p>
              <p className="text-gray-400">
                This tool is intended for migrating your own product catalog from other e-commerce platforms (Shopify, WooCommerce, etc.) to your GumShop store. Importing third-party copyrighted content without authorization may violate intellectual property laws.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                className="accent-indigo-600 w-4 h-4 mt-0.5"
              />
              <span className="text-xs text-gray-300">
                I confirm that I own or have permission to import and distribute these products.
              </span>
            </label>

            <button
              disabled={!disclaimerAccepted}
              onClick={() => setHasAgreed(true)}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-40 transition-all"
            >
              I Agree &amp; Continue to Importer
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" />
            <span>One-Click Product Importer</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Import products, multi-angle photos, and descriptions from Shopify, WooCommerce, or web pages
          </p>
        </div>

        {/* Free tier slot badge */}
        <div className="px-4 py-2 bg-[#14141E] border border-white/10 rounded-xl flex items-center gap-2">
          <span className="text-xs text-gray-400">Free Tier Slots:</span>
          <span className="text-xs font-black text-white">
            {currentProductCount} / {maxLimit} Products Used
          </span>
        </div>
      </div>

      {/* Scraper Input Card */}
      <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 space-y-6">
        <form onSubmit={handleScan} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Target Store or Product URL (Shopify / WooCommerce / Web Page)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="e.g. https://allbirds.com or https://example.myshopify.com"
                  className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
                />
                <Globe className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
              </div>
              <button
                type="submit"
                disabled={scanning || !url}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Scanning Store...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Scan &amp; Preview Products</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {detectedPlatform && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-2 text-xs text-indigo-300">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>
                Detected: <strong className="uppercase text-white">{detectedPlatform}</strong> store engine. Ready for batch extraction.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-semibold">
              {error}
            </div>
          )}
        </form>
      </div>

      {/* Scraped Results Preview */}
      {scrapedProducts.length > 0 && (
        <div className="space-y-6">
          {/* Settings Bar */}
          <div className="bg-[#14141E] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
              >
                {selectedIndices.size === scrapedProducts.length  ? 'Deselect All'  : 'Select All'}
              </button>
              <span className="text-xs text-gray-500">-</span>
              <span className="text-xs text-gray-300">
                <strong className="text-white">{selectedIndices.size}</strong> of {scrapedProducts.length} selected for import
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div>
                <label className="text-gray-400 mr-2 font-semibold">Assign Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-[#0A0A0F] border border-white/10 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 mr-2 font-semibold">Discount Price:</label>
                <select
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="bg-[#0A0A0F] border border-white/10 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={0}>Original Price (0% off)</option>
                  <option value={20}>20% Flash Sale</option>
                  <option value={30}>30% Flash Sale</option>
                  <option value={50}>50% Slashed Price</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleImport}
                disabled={importing || selectedIndices.size === 0}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase rounded-xl shadow-lg shadow-emerald-900/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {importing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Import {selectedIndices.size} Products</span>
              </button>
            </div>
          </div>

          {/* Import Result Banner */}
          {importResult && (
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Successfully Imported {importResult.importedCount} Products!
                </h4>
                <p className="text-[11px] text-gray-300 mt-1">
                  Products are now live in your catalog. You can edit their prices, descriptions, and Gumroad links in the Products manager.
                </p>
              </div>
              <Link
                to="/admin/products"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl whitespace-nowrap"
              >
                View in Catalog →
              </Link>
            </div>
          )}

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {scrapedProducts.map((p, idx) => {
              const isSelected = selectedIndices.has(idx);
              const previewDiscountPrice = discountPercent > 0 && p.price > 0
                 ? Math.round(p.price * (1 - discountPercent / 100) * 100) / 100 : p.price;

              return (
                <div
                  key={idx}
                  onClick={() => toggleSelect(idx)}
                  className={`bg-[#14141E] border rounded-2xl p-3 cursor-pointer transition-all ${
                    isSelected
                       ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 bg-indigo-500/5'
                      : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="aspect-square bg-black/40 rounded-xl overflow-hidden mb-3 relative">
                    <img
                      src={p.thumbnail || p.images[0]}
                      alt={p.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e-auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="accent-indigo-600 w-4 h-4"
                      />
                    </div>
                    {discountPercent > 0 && (
                      <span className="absolute bottom-2 left-2 text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  <h5 className="text-xs font-bold text-white truncate">{p.title}</h5>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm font-black text-white">{formatPrice(previewDiscountPrice)}</span>
                    {discountPercent > 0 && (
                      <span className="text-[10px] line-through text-gray-500">{formatPrice(p.price)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
