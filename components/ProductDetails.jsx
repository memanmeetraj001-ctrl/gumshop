'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "@/lib/features/cart/cartSlice";
import { 
    Zap, 
    Star, 
    ShieldCheck, 
    Truck, 
    Lock, 
    RotateCcw, 
    ChevronDown, 
    ChevronUp, 
    Check, 
    Sparkles, 
    ShoppingBag,
    Eye
} from "lucide-react";
import toast from "react-hot-toast";
import GumroadIframeModal from "./GumroadIframeModal";

const ProductDetails = ({ product, storeInfo }) => {
    const productId = product.id;
    const dispatch = useDispatch();
    const router = useRouter();

    // Dynamic Color & Size Variant Switcher
    const availableColors = (Array.isArray(product.colors) && product.colors.length > 0)
        ? product.colors
        : [
            { name: "Obsidian Black", hex: "#18181b" },
            { name: "Titanium Silver", hex: "#94a3b8" },
            { name: "Emerald Green", hex: "#10b981" }
        ];

    const availableSizes = (Array.isArray(product.sizes) && product.sizes.length > 0)
        ? product.sizes
        : [
            { name: "Standard Edition", priceDelta: 0 },
            { name: "Pro Bundle (+ Kit)", priceDelta: 15 }
        ];

    const [selectedColor, setSelectedColor] = useState(availableColors[0]);
    const [selectedSize, setSelectedSize] = useState(availableSizes[0]);
    const [selectedQuantity, setSelectedQuantity] = useState(1);
    const [openFaq, setOpenFaq] = useState(0);
    const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, gumroadUrl: '', orderSessionId: '' });
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const images = (product.images && product.images.length > 0) 
        ? product.images 
        : [product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'];
    
    const [mainImage, setMainImage] = useState(images[0]);

    const unitPrice = parseFloat(product.price || 29.99);
    const sizeDelta = parseFloat(selectedSize?.priceDelta || 0);
    const effectiveUnitPrice = unitPrice + sizeDelta;
    const compareAt = parseFloat(product.compareAtPrice || product.mrp || Math.round(unitPrice * 1.35 * 100) / 100) + sizeDelta;

    const colorCode = selectedColor?.name?.substring(0, 3).toUpperCase() || 'DEF';
    const sizeCode = selectedSize?.name?.substring(0, 3).toUpperCase() || 'STD';
    const baseSku = product.sku || `SKU-${product.id?.substring(0, 6)?.toUpperCase() || 'PROD'}`;
    const activeSku = `${baseSku}-${colorCode}-${sizeCode}`;

    const rawStock = Number(product.stockQuantity !== undefined ? product.stockQuantity : 42);
    const isOutOfStock = product.inStock === false || rawStock <= 0;
    const isLowStock = !isOutOfStock && rawStock <= 12;

    const activeVariantLabel = `${selectedColor?.name || 'Default'}${selectedSize ? ` • ${selectedSize.name}` : ''}`;

    // Quantity Tier Breaks Calculations
    const quantityTiers = [
        {
            qty: 1,
            label: "Buy 1 Item",
            pricePerUnit: effectiveUnitPrice,
            totalPrice: effectiveUnitPrice,
            badge: null
        },
        {
            qty: 2,
            label: "Buy 2 (Save 15%)",
            pricePerUnit: Math.round(effectiveUnitPrice * 0.85 * 100) / 100,
            totalPrice: Math.round(effectiveUnitPrice * 0.85 * 2 * 100) / 100,
            badge: "Most Popular ⭐"
        },
        {
            qty: 3,
            label: "Buy 3 (Save 30% + Free Shipping)",
            pricePerUnit: Math.round(effectiveUnitPrice * 0.70 * 100) / 100,
            totalPrice: Math.round(effectiveUnitPrice * 0.70 * 3 * 100) / 100,
            badge: "Best Value 🔥"
        }
    ];

    const currentTier = quantityTiers.find(t => t.qty === selectedQuantity) || quantityTiers[0];

    const handleAddToCart = () => {
        for (let i = 0; i < selectedQuantity; i++) {
            dispatch(addToCart({ 
                productId, 
                product: {
                    ...product,
                    name: `${product.name} (${activeVariantLabel})`,
                    price: currentTier.pricePerUnit,
                    variant: activeVariantLabel,
                    selectedColor: selectedColor?.name,
                    selectedSize: selectedSize?.name,
                    storeId: product.storeId || storeInfo?.id,
                    storeName: storeInfo?.name
                }
            }));
        }
        toast.success(`Added ${selectedQuantity}x "${activeVariantLabel}" to your cart!`);
    };

    // White-Labeled "⚡ Buy Now" Handler (Gumroad In-Page Iframe)
    const handleInstantBuyNow = async () => {
        setIsCheckingOut(true);
        try {
            const res = await fetch('/api/gumroad/dynamic-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: product.storeId || storeInfo?.id,
                    storeName: storeInfo?.name || 'Store',
                    items: [
                        {
                            productId: product.id,
                            name: `${product.name} (${activeVariantLabel})`,
                            price: currentTier.pricePerUnit,
                            quantity: currentTier.qty,
                            variant: activeVariantLabel,
                            gumroadUrl: product.gumroadUrl || ''
                        }
                    ],
                    shippingFee: currentTier.qty >= 3 ? 0 : (storeInfo?.shipping?.standardFee || 4.99),
                    gumroadProductUrl: product?.gumroadUrl || storeInfo?.gumroadProductUrl || (typeof window !== 'undefined' ? ((storeInfo?.username ? localStorage.getItem(`gumroad_url_${storeInfo.username}`) : '') || localStorage.getItem('gumshop_gumroad_url') || localStorage.getItem('gumroad_product_url') || '') : '')
                })
            });

            const storeSlug = storeInfo?.username || (product?.storeId ? String(product.storeId).replace(/^store_/, '') : '');
            const storeScopedUrl = (typeof window !== 'undefined' && storeSlug) ? (localStorage.getItem(`gumroad_url_${storeSlug}`) || localStorage.getItem(`gumroad_product_url_${storeSlug}`)) : '';
            const fallbackGumroadUrl = product?.gumroadUrl || storeInfo?.gumroadProductUrl || storeScopedUrl || (typeof window !== 'undefined' ? (localStorage.getItem('gumshop_gumroad_url') || '') : '');
            const data = await res.json().catch(() => ({}));
            setCheckoutModal({
                isOpen: true,
                gumroadUrl: data.checkoutUrl || fallbackGumroadUrl || '',
                orderSessionId: data.orderSessionId || `ord_${Date.now()}`
            });
        } catch (err) {
            console.error('Checkout error:', err);
            const storeSlug = storeInfo?.username || (product?.storeId ? String(product.storeId).replace(/^store_/, '') : '');
            const storeScopedUrl = (typeof window !== 'undefined' && storeSlug) ? (localStorage.getItem(`gumroad_url_${storeSlug}`) || localStorage.getItem(`gumroad_product_url_${storeSlug}`)) : '';
            const fallbackGumroadUrl = product?.gumroadUrl || storeInfo?.gumroadProductUrl || storeScopedUrl || (typeof window !== 'undefined' ? (localStorage.getItem('gumshop_gumroad_url') || '') : '');
            setCheckoutModal({
                isOpen: true,
                gumroadUrl: fallbackGumroadUrl || '',
                orderSessionId: `ord_${Date.now()}`
            });
        } finally {
            setIsCheckingOut(false);
        }
    };

    const faqs = [
        {
            q: "How fast is delivery?",
            a: "Orders are processed promptly upon payment confirmation. Standard tracked shipping takes 3–7 business days depending on destination."
        },
        {
            q: "What is your refund policy?",
            a: "If you have any issues with your order, contact our support team. We honor return and refund requests according to our store refund policy."
        },
        {
            q: "Are transactions safe and encrypted?",
            a: "Yes! All checkouts are processed via bank-grade 256-bit SSL encryption through verified Gumroad payment infrastructure."
        }
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
                
                {/* Left Column: Product Gallery */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="aspect-square bg-slate-100 rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm relative group">
                        <img 
                            src={mainImage} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        {compareAt > unitPrice && (
                            <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-rose-600 text-white font-extrabold text-xs shadow-md">
                                SAVE {Math.round(((compareAt - unitPrice) / compareAt) * 100)}%
                            </span>
                        )}
                    </div>

                    {/* Thumbnail Strip */}
                    {images.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setMainImage(img)}
                                    className={`size-20 rounded-2xl overflow-hidden border-2 shrink-0 transition ${
                                        mainImage === img ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Customer Photo Reviews UGC Gallery (Rendered only when real reviews exist) */}
                    {Array.isArray(product.reviews) && product.reviews.length > 0 && (
                        <div className="pt-8 border-t border-slate-200">
                            <h4 className="font-bold text-sm text-slate-900 mb-4 flex items-center justify-between">
                                <span>Customer Reviews</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {product.reviews.map((rev, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-emerald-500">
                                                {Array(5).fill('').map((_, i) => (
                                                    <Star key={i} size={13} className="fill-emerald-500" />
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-slate-400">{rev.date || 'Recent'}</span>
                                        </div>
                                        <p className="text-xs text-slate-700 font-medium mt-2 leading-relaxed">
                                            "{rev.comment}"
                                        </p>
                                        <p className="text-[11px] font-bold text-slate-900 mt-2 flex items-center gap-1">
                                            <span>{rev.author}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Buy Box & Conversion Tiers */}
                <div className="lg:col-span-5 space-y-6">
                    
                    {/* Live Viewers & Star Rating */}
                    {/* Status & Category */}
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                                {product.category || 'Featured'}
                            </span>
                            {product.reviewCount > 0 && (
                                <span className="flex items-center gap-1 text-slate-700 font-semibold text-[11px]">
                                    <Star size={13} className="fill-amber-400 text-amber-400" />
                                    <span>{typeof product.rating === 'number' ? product.rating.toFixed(1) : '5.0'}</span>
                                    <span className="text-slate-400">({product.reviewCount})</span>
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs">
                            <span className="size-2 rounded-full bg-emerald-500"></span>
                            <span className="text-emerald-700 font-semibold">{product.inStock !== false ? 'In Stock' : 'Pre-Order'}</span>
                        </div>
                    </div>

                    {/* Product Title, SKU & Category */}
                    <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                                {product.category || 'Featured Collection'}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg font-semibold">
                                SKU: {activeSku}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight leading-snug">
                            {product.name}
                        </h1>
                    </div>

                    {/* Price Header & Real-Time Stock Status */}
                    <div className="space-y-3">
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl sm:text-4xl font-black text-slate-950">
                                ${currentTier.pricePerUnit.toFixed(2)}
                            </span>
                            {compareAt > unitPrice && (
                                <span className="text-lg text-slate-400 line-through font-semibold">
                                    ${(compareAt * selectedQuantity).toFixed(2)}
                                </span>
                            )}
                            {isOutOfStock ? (
                                <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                                    Out of Stock
                                </span>
                            ) : (
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                    ✓ In Stock ({rawStock} units)
                                </span>
                            )}
                        </div>

                        {/* Real-time Urgency Stock Level Bar */}
                        {isLowStock && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                                    <span className="flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                        🔥 High Demand: Only {rawStock} left in stock!
                                    </span>
                                    <span className="text-[11px] font-mono text-amber-700">Almost Sold Out</span>
                                </div>
                                <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${Math.min(100, Math.max(15, (rawStock / 15) * 100))}%` }} 
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Interactive Color & Size Variant Switcher */}
                    <div className="space-y-4 pt-1 pb-1">
                        {/* 1. Color Swatches */}
                        {availableColors.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                    <span className="uppercase tracking-wider text-[11px] text-slate-500">Color / Finish</span>
                                    <span className="text-emerald-600 font-extrabold">{selectedColor?.name}</span>
                                </div>
                                <div className="flex flex-wrap gap-2.5 items-center">
                                    {availableColors.map((col, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedColor(col)}
                                            className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition text-xs font-semibold ${
                                                selectedColor?.name === col.name
                                                    ? 'border-emerald-600 bg-emerald-50/60 text-slate-900 shadow-xs'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                            }`}
                                        >
                                            <span 
                                                className="size-4 rounded-full border border-slate-300/80 shadow-xs shrink-0 flex items-center justify-center"
                                                style={{ backgroundColor: col.hex || '#10b981' }}
                                            >
                                                {selectedColor?.name === col.name && (
                                                    <Check size={10} className={col.hex === '#ffffff' || col.hex === '#fff' ? 'text-slate-900 stroke-[3]' : 'text-white stroke-[3]'} />
                                                )}
                                            </span>
                                            <span>{col.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. Size / Bundle Options */}
                        {availableSizes.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                    <span className="uppercase tracking-wider text-[11px] text-slate-500">Edition / Package</span>
                                    <span className="text-emerald-600 font-extrabold">{selectedSize?.name}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {availableSizes.map((sz, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedSize(sz)}
                                            className={`p-3 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                                                selectedSize?.name === sz.name
                                                    ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                        >
                                            <span className="text-xs font-bold text-slate-900">{sz.name}</span>
                                            <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                                {parseFloat(sz.priceDelta || 0) > 0 ? `+$${parseFloat(sz.priceDelta).toFixed(2)}` : 'Standard Price'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Volume Quantity Breaks ("Buy More, Save More") */}
                    <div className="space-y-3 pt-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                            Select Quantity (Bundle & Save)
                        </label>
                        <div className="space-y-2">
                            {quantityTiers.map((tier) => (
                                <div
                                    key={tier.qty}
                                    onClick={() => setSelectedQuantity(tier.qty)}
                                    className={`p-3.5 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                                        selectedQuantity === tier.qty
                                            ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                                            selectedQuantity === tier.qty ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                                        }`}>
                                            {selectedQuantity === tier.qty && <Check size={12} className="stroke-[3]" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">{tier.label}</p>
                                            <p className="text-[11px] text-slate-500">${tier.pricePerUnit.toFixed(2)} / each</p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        {tier.badge && (
                                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white mb-1 inline-block">
                                                {tier.badge}
                                            </span>
                                        )}
                                        <p className="text-sm font-black text-slate-900">${tier.totalPrice.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* The Primary "⚡ Buy Now" & "Add to Cart" Actions */}
                    <div className="space-y-3 pt-2">
                        {/* Primary "⚡ Buy Now" Button */}
                        <button
                            onClick={handleInstantBuyNow}
                            disabled={isCheckingOut || isOutOfStock}
                            className={`w-full py-4 px-8 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition ${
                                isOutOfStock
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-xl shadow-emerald-600/30 hover:scale-[1.01]'
                            }`}
                        >
                            <Zap size={20} className={isOutOfStock ? "fill-slate-400 text-slate-400" : "fill-white"} />
                            <span>
                                {isOutOfStock 
                                    ? "Sold Out" 
                                    : isCheckingOut 
                                        ? "Preparing Checkout..." 
                                        : `⚡ Buy Now • $${currentTier.totalPrice.toFixed(2)}`}
                            </span>
                        </button>

                        {/* Secondary Add to Cart */}
                        <button
                            onClick={handleAddToCart}
                            disabled={isOutOfStock}
                            className={`w-full py-3 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                                isOutOfStock
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800'
                            }`}
                        >
                            <ShoppingBag size={16} />
                            <span>{isOutOfStock ? "Out of Stock" : "Add to Bag"}</span>
                        </button>
                    </div>

                    {/* Trust & Security Guarantee Seals Strip */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-3 gap-2 text-center text-slate-700">
                        <div className="flex flex-col items-center">
                            <Lock size={18} className="text-emerald-600 mb-1" />
                            <span className="text-[10px] font-bold leading-tight">256-Bit SSL Encrypted</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <Truck size={18} className="text-emerald-600 mb-1" />
                            <span className="text-[10px] font-bold leading-tight">Tracked Delivery</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <RotateCcw size={18} className="text-emerald-600 mb-1" />
                            <span className="text-[10px] font-bold leading-tight">Buyer Protection</span>
                        </div>
                    </div>

                    {/* Product Description */}
                    <div className="pt-2 text-sm text-slate-600 leading-relaxed">
                        <p>{product.description || "Curated with the highest standards of materials and craftsmanship. Guaranteed satisfaction."}</p>
                    </div>

                    {/* Interactive Product FAQs Accordion */}
                    <div className="pt-4 border-t border-slate-200 space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                            Frequently Asked Questions
                        </h4>
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full p-3.5 text-left flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
                                >
                                    <span>{faq.q}</span>
                                    {openFaq === idx ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                </button>
                                {openFaq === idx && (
                                    <div className="p-3.5 pt-0 text-xs text-slate-600 leading-relaxed bg-slate-50/50">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                </div>

            </div>

            {/* Mobile Sticky Bottom Buy Bar */}
            <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:hidden shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom">
                <div>
                    <p className="text-xs font-bold text-slate-900 truncate max-w-36">{product.name}</p>
                    <p className="text-sm font-black text-emerald-600">${currentTier.totalPrice.toFixed(2)}</p>
                </div>
                <button
                    onClick={handleInstantBuyNow}
                    disabled={isCheckingOut}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5"
                >
                    <Zap size={15} className="fill-white" />
                    <span>⚡ Buy Now</span>
                </button>
            </div>

            {/* In-Frame Checkout Modal */}
            <GumroadIframeModal
                isOpen={checkoutModal.isOpen}
                onClose={() => setCheckoutModal({ isOpen: false, gumroadUrl: '', orderSessionId: '' })}
                product={product}
                items={[{
                    id: product.id,
                    name: `${product.name} (${activeVariantLabel})`,
                    price: currentTier.pricePerUnit,
                    quantity: currentTier.qty,
                    image: (product.images && product.images[0]) || product.image
                }]}
                total={currentTier.totalPrice}
                gumroadUrl={checkoutModal.gumroadUrl}
                orderSessionId={checkoutModal.orderSessionId}
            />
        </div>
    );
};

export default ProductDetails;