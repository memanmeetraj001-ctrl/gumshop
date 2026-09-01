import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Product, ProductReview } from '../../types';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { formatPrice, formatDate } from '../../utils/formatters';
import { trackGumroadClick } from '../../utils/analytics';
import { StickyBuyBar } from '../../components/storefront/StickyBuyBar';
import { CheckoutModal } from '../../components/storefront/CheckoutModal';
import {
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  ChevronDown,
  Sparkles,
  Flame,
  CheckCircle2,
  MessageSquarePlus,
  X,
  Send,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews'>('details');
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [revName, setRevName] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState('');
  const [revText, setRevText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const { addItem } = useCart();
  const { currency } = useTheme();
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  const defaultReviews: ProductReview[] = [
    {
      id: 'rev_1',
      name: 'Alexander Ross',
      rating: 5,
      title: 'Exceeded all my expectations!',
      review: 'The build quality and acoustic isolation are incredible. Fast shipping and packaged impeccably.',
      verified: true,
      createdAt: '2026-08-20T10:00:00.000Z',
    },
    {
      id: 'rev_2',
      name: 'Samantha Wu',
      rating: 5,
      title: 'Best investment for my daily routine',
      review: 'I was hesitant at first, but after 2 weeks of daily use, I cannot imagine going back. 10/10 recommend.',
      verified: true,
      createdAt: '2026-08-25T14:30:00.000Z',
    },
    {
      id: 'rev_3',
      name: 'David Keller',
      rating: 4,
      title: 'Solid product & great customer support',
      review: 'Super clean design, feels durable and premium. Customer support answered my questions in minutes.',
      verified: true,
      createdAt: '2026-08-28T09:15:00.000Z',
    },
  ];

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.getProductBySlug(slug)
      .then((p) => {
        setProduct(p);
        setActiveImage(p.images[0] || p.thumbnail);
        if (p.options && p.options.length > 0) {
          const initOpts: Record<string, string> = {};
          p.options.forEach((opt) => {
            if (opt.values && opt.values[0]) initOpts[opt.name] = opt.values[0];
          });
          setSelectedOptions(initOpts);
        }
        api.trackEvent({
          eventType: 'product_view',
          productId: p.id,
          productTitle: p.title,
        }).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#0A0C0F]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-white mb-2">Product Not Found</h2>
        <p className="text-gray-400 text-sm mb-6">The requested catalog item could not be found.</p>
        <Link to="/collections/all" className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl">
          Browse All Products
        </Link>
      </div>
    );
  }

  const discountPercent = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 50;

  const reviewsList = product.reviews && product.reviews.length > 0 ? product.reviews : defaultReviews;
  const ratingScore = product.averageRating || 4.9;

  const handleOptionSelect = (optionName: string, value: string) => {
    const updated = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(updated);

    // If variant matching has specific image, switch image
    if (product.variants) {
      const match = product.variants.find((v) => {
        return Object.entries(updated).every(([k, val]) => v.options[k] === val);
      });
      if (match && match.image) {
        setActiveImage(match.image);
      }
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revName || !revText) return;
    setSubmittingReview(true);
    try {
      const res = await api.submitProductReview(product.id, {
        name: revName,
        rating: revRating,
        title: revTitle,
        review: revText,
      });
      if (res.success && res.review) {
        const updatedList = [res.review, ...reviewsList];
        setProduct({ ...product, reviews: updatedList, averageRating: res.averageRating, reviewCount: res.reviewCount });
        setReviewModalOpen(false);
        setRevName('');
        setRevTitle('');
        setRevText('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const openCheckoutModal = () => {
    trackGumroadClick(product!.id, product!.title, product!.gumroadUrl || '');
    setCheckoutModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0C0F] text-gray-200 py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-8">
          <Link to="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link to="/collections/all" className="hover:text-white">Shop</Link>
          <span>/</span>
          <span className="text-white truncate">{product.title}</span>
        </nav>

        {/* Main Grid: Gallery Left | Product Info Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-[#14171F] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
              <img
                src={activeImage}
                alt={product.title}
                className="w-full h-full object-cover object-center transition-all duration-300"
              />
              {product.bestseller && (
                <div className="absolute top-4 left-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-lg">
                  Best Seller
                </div>
              )}
            </div>

            {/* Thumbnail switcher */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                      activeImage === img ? 'border-indigo-500 scale-95' : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="text-xs font-bold text-gray-400 hover:text-white underline underline-offset-2"
                >
                  {ratingScore} ({reviewsList.length} Customer Reviews)
                </button>
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> In Stock & Ready to Ship
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white uppercase font-heading leading-tight">
                {product.title}
              </h1>

              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 font-mono">
                <span>SKU: {product.sku}</span>
                <span>•</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" /> Only 4 left in stock - high demand
                </span>
              </div>
            </div>

            {/* Price section */}
            <div className="flex items-baseline gap-4 p-4 bg-[#14171F] rounded-2xl border border-white/10 shadow-lg">
              <span className="text-3xl font-black text-white">{formatPrice(product.price, currency)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-lg line-through text-gray-500 font-bold">
                  {formatPrice(product.compareAtPrice, currency)}
                </span>
              )}
              <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-black uppercase rounded-lg">
                Save {discountPercent}%
              </span>
            </div>

            {/* Product Options & Swatches Matrix (Shopify Style) */}
            {product.options && product.options.length > 0 && (
              <div className="space-y-4 pt-2">
                {product.options.map((opt) => (
                  <div key={opt.name} className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold uppercase text-gray-400 tracking-wider">{opt.name}:</span>
                      <span className="font-bold text-white">{selectedOptions[opt.name] || opt.values[0]}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {opt.values.map((val) => {
                        const isSelected = (selectedOptions[opt.name] || opt.values[0]) === val;
                        const hex = opt.colorHexes?.[val];

                        if (opt.isColor && hex) {
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleOptionSelect(opt.name, val)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0A0C0F] scale-110' : 'opacity-80 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: hex }}
                              title={val}
                            >
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-white drop-shadow-md" />}
                            </button>
                          );
                        }

                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleOptionSelect(opt.name, val)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-900/30'
                                : 'bg-[#14171F] text-gray-300 border-white/10 hover:border-white/20'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Short Description */}
            <p className="text-sm text-gray-300 leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Quantity and Actions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-[#14171F] border border-white/10 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white text-lg font-bold"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white text-lg font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => addItem(product, quantity)}
                  className="flex-1 py-4 px-6 bg-white/10 hover:bg-white/15 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all border border-white/15 flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
              </div>

              {/* Primary Direct Checkout Button */}
              <button
                onClick={openCheckoutModal}
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-indigo-900/40 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <span>{product.buttonText || 'Buy Now — Free Shipping'}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 text-center">
              <div className="p-3 bg-white/5 rounded-2xl">
                <Truck className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
                <p className="text-[11px] font-bold text-white">Free Express Shipping</p>
                <p className="text-[10px] text-gray-400">2-4 Business Days</p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl">
                <RotateCcw className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-[11px] font-bold text-white">30-Day Guarantee</p>
                <p className="text-[10px] text-gray-400">Hassle-Free Returns</p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl">
                <ShieldCheck className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <p className="text-[11px] font-bold text-white">2-Year Warranty</p>
                <p className="text-[10px] text-gray-400">Full Coverage</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Section: Description, Specifications, Reviews */}
        <div className="mt-16 sm:mt-24 border-t border-white/10 pt-12">
          <div className="flex border-b border-white/10 gap-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-4 text-sm font-extrabold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                activeTab === 'details' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Product Description
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-4 text-sm font-extrabold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                activeTab === 'specs' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Technical Specifications ({product.specifications?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-4 text-sm font-extrabold uppercase tracking-wider transition-colors border-b-2 -mb-px flex items-center gap-2 ${
                activeTab === 'reviews' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <span>Customer Reviews</span>
              <span className="px-2 py-0.5 text-[10px] bg-indigo-600/20 text-indigo-400 rounded-full font-bold">
                {reviewsList.length}
              </span>
            </button>
          </div>

          <div className="pt-8">
            {activeTab === 'details' && (
              <div
                className="prose prose-invert max-w-none text-gray-300 leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}

            {activeTab === 'specs' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                {product.specifications?.map((spec, i) => (
                  <div key={i} className="p-4 bg-[#14171F] rounded-2xl border border-white/10 flex justify-between">
                    <span className="text-xs font-bold text-gray-400">{spec.key}</span>
                    <span className="text-xs font-bold text-white">{spec.value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8 max-w-4xl">
                {/* Reviews Header & Write Review Button */}
                <div className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div>
                      <h3 className="text-4xl font-black text-white">{ratingScore}</h3>
                      <div className="flex text-amber-400 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Based on {reviewsList.length} verified reviews</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setReviewModalOpen(true)}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-900/30 flex items-center gap-2"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span>Write a Customer Review</span>
                  </button>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviewsList.map((rev) => (
                    <div key={rev.id} className="bg-[#14171F] border border-white/10 rounded-2xl p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                            {rev.name[0]}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block">{rev.name}</span>
                            <span className="text-[10px] text-gray-500 font-mono">{formatDate(rev.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Verified Buyer
                          </span>
                          <div className="flex text-amber-400">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                      </div>

                      {rev.title && <h4 className="text-sm font-bold text-white">{rev.title}</h4>}
                      <p className="text-xs text-gray-300 leading-relaxed">{rev.review}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Write Review Modal */}
        {reviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative">
              <button
                onClick={() => setReviewModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider font-heading">
                  Write a Customer Review
                </h3>
                <p className="text-xs text-gray-400">Share your experience with this item</p>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRevRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= revRating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus Vance"
                    value={revName}
                    onChange={(e) => setRevName(e.target.value)}
                    className="w-full bg-[#0A0C0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Review Headline</label>
                  <input
                    type="text"
                    placeholder="e.g. Phenomenal audio clarity and comfort"
                    value={revTitle}
                    onChange={(e) => setRevTitle(e.target.value)}
                    className="w-full bg-[#0A0C0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Review Comments</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="What did you like or dislike about this product?"
                    value={revText}
                    onChange={(e) => setRevText(e.target.value)}
                    className="w-full bg-[#0A0C0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingReview ? 'Submitting...' : 'Submit Verified Review'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Sticky Buy Bar for Mobile */}
        <StickyBuyBar product={product} onBuyNow={openCheckoutModal} />

        {/* Pre-Checkout Shipping Modal */}
        <CheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          product={product}
          selectedOptions={selectedOptions}
        />
      </div>
    </div>
  );
};
