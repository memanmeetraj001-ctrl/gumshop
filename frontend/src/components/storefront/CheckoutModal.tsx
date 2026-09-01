import React, { useState } from 'react';
import { Product } from '../../types';
import { api } from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { formatPrice } from '../../utils/formatters';
import { X, ShieldCheck, Truck, Lock, ArrowRight, CheckCircle2, Tag } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  items?: Array<{ product: Product; quantity: number }>;
  totalAmount?: number;
  selectedOptions?: Record<string, string>;
  discountCode?: string;
  discountAmount?: number;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  product,
  items,
  totalAmount,
  selectedOptions,
  discountCode,
  discountAmount = 0,
}) => {
  const { currency } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Compute items & pricing
  const orderItems = product
    ? [
        {
          productId: product.id,
          title: product.title,
          price: product.price,
          quantity: 1,
          thumbnail: product.thumbnail || product.images[0] || '',
          sku: product.sku,
          selectedOptions,
        },
      ]
    : items?.map((it) => ({
        productId: it.product.id,
        title: it.product.title,
        price: it.product.price,
        quantity: it.quantity,
        thumbnail: it.product.thumbnail || it.product.images[0] || '',
        sku: it.product.sku,
      })) || [];

  const rawSubtotal = orderItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const finalTotal = totalAmount !== undefined
    ? totalAmount
    : Math.max(0, rawSubtotal - discountAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !addressLine1 || !city || !state || !postalCode) {
      setError('Please complete all required shipping fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        customerName: name,
        customerEmail: email,
        customerPhone: phone || undefined,
        shippingAddress: {
          addressLine1,
          addressLine2: addressLine2 || undefined,
          city,
          state,
          postalCode,
          country,
        },
        items: orderItems,
        totalAmount: finalTotal,
        discountCode: discountCode || undefined,
        discountAmount: discountAmount || 0,
        currency,
        productId: product?.id || (orderItems.length > 0 ? orderItems[0].productId : undefined),
        notes: notes || undefined,
      };

      const res = await api.createOrder(payload);

      if (res && res.redirectUrl) {
        // Redirect directly to Gumroad checkout with prefilled customer data
        window.location.href = res.redirectUrl;
      } else {
        window.location.href = product?.gumroadUrl || 'https://gumroad.com';
      }
    } catch (err: any) {
      setError(err.message || 'Could not record shipping information. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#14171F] border border-white/15 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-gray-200 animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10 bg-[#0F1115]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider font-heading">
                Shipping &amp; Order Details
              </h3>
              <p className="text-xs text-gray-400">
                Where should we dispatch your gear?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
          {/* Order Items Preview */}
          <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              Order Summary ({orderItems.length} {orderItems.length === 1 ? 'item' : 'items'})
            </span>
            <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
              {orderItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-9 h-9 object-cover rounded-lg bg-black/40 shrink-0"
                    />
                    <div className="truncate">
                      <span className="font-bold text-white truncate block">{item.title}</span>
                      <span className="text-gray-400 text-[11px]">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-black text-white shrink-0">
                    {formatPrice(item.price * item.quantity, currency)}
                  </span>
                </div>
              ))}
            </div>

            {/* Discount Pill */}
            {discountCode && discountAmount > 0 && (
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Promo Applied: {discountCode}</span>
                </span>
                <span>-{formatPrice(discountAmount, currency)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-sm font-bold">
              <span className="text-gray-300">Total Due</span>
              <span className="text-lg font-black text-indigo-400">{formatPrice(finalTotal, currency)}</span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-semibold">
              {error}
            </div>
          )}

          {/* Form */}
          <form id="shipping-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0A0C0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0A0C0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">
                Phone Number (For Carrier Tracking Updates)
              </label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#0A0C0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">
                Street Address *
              </label>
              <input
                type="text"
                required
                placeholder="123 Main Street"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full bg-[#0A0C0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">
                  City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Los Angeles"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#0A0C0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">
                  State / Province *
                </label>
                <input
                  type="text"
                  required
                  placeholder="CA"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-[#0A0C0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">
                  Postal Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="90001"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full bg-[#0A0C0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-5 border-t border-white/10 bg-[#0F1115] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>256-Bit SSL Encrypted &amp; Stored Securely</span>
          </div>

          <button
            type="submit"
            form="shipping-form"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-indigo-900/40 flex items-center justify-center gap-2 transition-all"
          >
            <span>{loading ? 'Securing Order...' : 'Proceed to Payment'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
