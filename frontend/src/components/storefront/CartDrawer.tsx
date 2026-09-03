import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/client';
import { Product } from '../../types';
import { formatPrice } from '../../utils/formatters';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Tag,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';

export const CartDrawer: React.FC = () => {
  const { items, addItem, removeItem, updateQuantity, isDrawerOpen, closeDrawer, subtotal, checkoutGumroad } = useCart();
  const { payments, currency } = useTheme();

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<any>(null);

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    message: string;
  } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Dynamic In-Cart Upsells (Shopify Style)
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (isDrawerOpen) {
      api.getProducts().then(setCatalogProducts).catch(() => {});
    }
  }, [isDrawerOpen]);

  const freeShippingThreshold = 50;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const gumroadIntegration = payments.find((p) => p.provider === 'gumroad' && p.enabled);

  // Upsell candidates: products not currently in the cart
  const inCartIds = new Set(items.map((i) => i.product.id));
  const upsellProducts = catalogProducts.filter((p) => !inCartIds.has(p.id)).slice(0, 3);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;
    setPromoError('');
    setValidatingPromo(true);
    try {
      const res = await api.validateDiscount(promoCodeInput.trim(), subtotal);
      if (res.valid) {
        setAppliedDiscount({
          code: res.code,
          discountType: res.discountType,
          discountValue: res.discountValue,
          discountAmount: res.discountAmount,
          message: res.message,
        });
        setPromoCodeInput('');
      } else {
        setPromoError(res.message || 'Invalid promo code');
      }
    } catch (err: any) {
      setPromoError(err.message || 'Invalid or expired promo code');
    } finally {
      setValidatingPromo(false);
    }
  };

  const discountAmount = appliedDiscount ? appliedDiscount.discountAmount : 0;
  const finalTotal = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

  const openCheckoutModal = (product?: any) => {
    setModalProduct(product || null);
    setCheckoutModalOpen(true);
    closeDrawer();
  };

  if (!isDrawerOpen && !checkoutModalOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-[#14171F] border-l border-white/15 h-full flex flex-col shadow-2xl text-gray-200 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider font-heading">Your Cart</h2>
              <span className="text-xs font-extrabold bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                {items.reduce((sum, i) => sum + i.quantity, 0)} Items
              </span>
            </div>
            <button onClick={closeDrawer} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          <div className="px-6 py-3.5 bg-black/30 border-b border-white/5">
            <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
              {remainingForFreeShipping > 0 ? (
                <span className="text-gray-300">
                  Add <strong className="text-amber-400 font-bold">{formatPrice(remainingForFreeShipping, currency)}</strong> for Free Express Shipping
                </span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> You qualify for FREE Worldwide Express Shipping!
                </span>
              )}
              <span className="text-gray-400">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${remainingForFreeShipping === 0 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-4">
                  <X className="w-8 h-8" />
                </div>
                <p className="text-base font-bold text-white">Your cart is empty</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Explore our curated lifestyle &amp; tech gear to upgrade your setup.
                </p>
                <Link
                  to="/collections/all"
                  onClick={closeDrawer}
                  className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold uppercase tracking-wider rounded-lg transition-colors"
                >
                  Shop Essentials
                </Link>
              </div>
            ) : (
              <>
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-4 p-3.5 bg-white/5 rounded-2xl border border-white/5">
                    <img
                      src={product.thumbnail || product.images[0]}
                      alt={product.title}
                      className="w-18 h-18 sm:w-20 sm:h-20 object-cover rounded-xl bg-black/40 shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <Link
                            to={`/products/${product.slug}`}
                            onClick={closeDrawer}
                            className="text-sm font-bold text-white hover:text-indigo-400 transition-colors line-clamp-1"
                          >
                            {product.title}
                          </Link>
                          <button
                            onClick={() => removeItem(product.id)}
                            className="text-gray-500 hover:text-red-400 p-1"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs font-extrabold text-indigo-400 mt-1">{formatPrice(product.price, currency)}</p>
                      </div>

                      {/* Quantity and Direct Buy option */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center bg-black/40 border border-white/10 rounded-lg">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="p-1 text-gray-400 hover:text-white"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-bold text-white">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="p-1 text-gray-400 hover:text-white"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => openCheckoutModal(product)}
                          className="text-[11px] font-bold text-gray-400 hover:text-white flex items-center gap-1 hover:underline"
                          title="Direct Checkout for this item"
                        >
                          <span>Checkout Item</span>
                          <ExternalLink className="w-3 h-3 text-indigo-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Frequently Bought Together Dynamic In-Cart Upsells (Shopify Style) */}
                {upsellProducts.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Frequently Bought Together</span>
                    </span>

                    <div className="space-y-2.5">
                      {upsellProducts.map((upsell) => (
                        <div key={upsell.id} className="p-3 bg-[#0A0C0F] border border-white/10 rounded-xl flex items-center justify-between gap-3">
                          <img src={upsell.thumbnail || upsell.images[0]} alt={upsell.title} className="w-12 h-12 object-cover rounded-lg shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{upsell.title}</h4>
                            <span className="text-xs font-black text-indigo-400">{formatPrice(upsell.price, currency)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => addItem(upsell, 1)}
                            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 font-bold text-xs rounded-lg border border-indigo-500/30 flex items-center gap-1 shrink-0"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer with Discount Code Box & Checkout Actions */}
          {items.length > 0 && (
            <div className="px-6 py-5 bg-black/40 border-t border-white/10 space-y-4">
              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="space-y-1.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Discount Code (e.g. VIP20)"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-gray-500 uppercase font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={validatingPromo}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase rounded-xl transition-colors shrink-0"
                  >
                    {validatingPromo ? '...' : 'Apply'}
                  </button>
                </div>

                {appliedDiscount && (
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{appliedDiscount.code}: {appliedDiscount.message}</span>
                    </span>
                    <button type="button" onClick={() => setAppliedDiscount(null)} className="text-gray-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {promoError && (
                  <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{promoError}</span>
                  </div>
                )}
              </form>

              {/* Subtotal & Discount Calculation */}
              <div className="space-y-1 pt-2 border-t border-white/5">
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal, currency)}</span>
                </div>

                {appliedDiscount && (
                  <div className="flex justify-between items-center text-xs text-emerald-400 font-bold">
                    <span>Discount ({appliedDiscount.code})</span>
                    <span>-{formatPrice(appliedDiscount.discountAmount, currency)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm font-bold pt-1">
                  <span className="text-white">Estimated Total</span>
                  <span className="text-xl text-white font-extrabold">{formatPrice(finalTotal, currency)}</span>
                </div>
              </div>

              {/* Primary Checkout Button */}
              <button
                onClick={() => openCheckoutModal()}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 transition-all"
              >
                <span>{gumroadIntegration?.buttonText || 'Buy Now — Free Shipping'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>30-Day Money-Back Guarantee · SSL Encrypted</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pre-Checkout Shipping Modal */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        product={modalProduct}
        items={!modalProduct ? items.map((it) => ({ product: it.product, quantity: it.quantity })) : undefined}
        totalAmount={!modalProduct ? finalTotal : undefined}
        discountCode={appliedDiscount?.code}
        discountAmount={appliedDiscount?.discountAmount}
      />
    </>
  );
};
