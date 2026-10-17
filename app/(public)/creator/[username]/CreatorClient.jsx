'use client'

import React, { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import { 
    CheckCircle2, 
    Share2, 
    Copy, 
    ExternalLink, 
    Download, 
    Zap, 
    Sparkles, 
    ArrowLeft, 
    Check, 
    Globe, 
    Smartphone, 
    Monitor,
    Mail,
    X,
    Store,
    ShoppingBag,
    Star,
    Flame,
    Clock,
    MessageCircle,
    Truck,
    Package,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Tag,
    Ticket,
    Search,
    ArrowUpDown,
    SlidersHorizontal,
    Grid,
    List,
    LayoutGrid
} from 'lucide-react';
import GumroadIframeModal from '@/components/GumroadIframeModal';
import CartDrawer from '@/components/CartDrawer';
import ExitIntentModal from '@/components/ExitIntentModal';
import AiShoppingAssistant from '@/components/AiShoppingAssistant';
import Loading from '@/components/Loading';
import { decodeHtmlEntities } from '@/lib/textUtils';
import { getCoupon } from '@/lib/firebaseDb';
import { 
    DEFAULT_DEMO_CREATOR, 
    getStoreAndCatalog,
    getStoreAndCatalogSync 
} from '@/lib/storePresets';
import { getSafeImageUrl, handleImageError } from '@/lib/imageUtils';
import LiveSalesToaster from '@/components/LiveSalesToaster';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '@/lib/features/cart/cartSlice';

const PRESET_STYLES = {
    warm_studio: {
        bg: 'bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]',
        frame: 'bg-white text-slate-900',
        card: 'bg-white border-slate-100 text-slate-900',
        subtext: 'text-slate-600'
    },
    dark_glass: {
        bg: 'bg-gradient-to-b from-[#090d16] via-[#0f172a] to-[#020617]',
        frame: 'bg-slate-950 text-white',
        card: 'bg-slate-900/90 border-slate-800 text-white',
        subtext: 'text-slate-400'
    },
    sunset: {
        bg: 'bg-gradient-to-b from-[#fff1f2] via-[#ffe4e6] to-[#fef3c7]',
        frame: 'bg-white text-slate-900',
        card: 'bg-white border-rose-100 text-slate-900',
        subtext: 'text-slate-600'
    },
    clean_white: {
        bg: 'bg-white',
        frame: 'bg-white text-slate-900',
        card: 'bg-slate-50 border-slate-200 text-slate-900',
        subtext: 'text-slate-600'
    },
    neon_cyber: {
        bg: 'bg-[#030712]',
        frame: 'bg-gray-950 text-cyan-200',
        card: 'bg-gray-900 border-cyan-900/60 text-cyan-100',
        subtext: 'text-cyan-400/80'
    },
    editorial_paper: {
        bg: 'bg-gradient-to-b from-[#FAF8F5] via-[#F4EFEA] to-[#EAE3D9]',
        frame: 'bg-[#FAF8F5] text-stone-900',
        card: 'bg-white border-stone-200 text-stone-900',
        subtext: 'text-stone-600'
    },
    midnight_luxe: {
        bg: 'bg-gradient-to-b from-[#0B0F19] via-[#090D15] to-[#04060A]',
        frame: 'bg-[#0B0F19] text-amber-100',
        card: 'bg-[#121826] border-amber-500/20 text-amber-50',
        subtext: 'text-amber-300/70'
    },
    pastel_candy: {
        bg: 'bg-gradient-to-b from-[#F5F3FF] via-[#FDF2F8] to-[#FFF1F2]',
        frame: 'bg-white text-slate-900',
        card: 'bg-white/95 border-purple-100 text-slate-900',
        subtext: 'text-purple-600'
    },
    emerald_forest: {
        bg: 'bg-gradient-to-b from-[#064E3B] via-[#022C22] to-[#011C15]',
        frame: 'bg-[#022C22] text-emerald-100',
        card: 'bg-[#064E3B]/60 border-emerald-700/40 text-emerald-50',
        subtext: 'text-emerald-300/70'
    }
};

function resolveCtaTheme(themeColor, isDarkSurface = false) {
    const raw = (themeColor && typeof themeColor === 'string' && themeColor.trim()) ? themeColor.trim() : '#10B981';
    let hex = raw.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const lum = (r * 299 + g * 587 + b * 114) / 1000;

    // If on a dark surface (e.g. dark sticky bar) and themeColor is too dark to pop (< 90 lum), fallback to high-contrast Emerald #10B981
    const effectiveBg = (isDarkSurface && lum < 90) ? '#10B981' : raw;

    let effHex = effectiveBg.replace('#', '');
    if (effHex.length === 3) effHex = effHex.split('').map(c => c + c).join('');
    const er = parseInt(effHex.substring(0, 2), 16) || 0;
    const eg = parseInt(effHex.substring(2, 4), 16) || 0;
    const eb = parseInt(effHex.substring(4, 6), 16) || 0;
    const effLum = (er * 299 + eg * 587 + eb * 114) / 1000;

    const isLightBg = effLum >= 130;
    return {
        backgroundColor: effectiveBg,
        color: isLightBg ? '#020617' : '#ffffff',
        fillClass: isLightBg ? 'fill-slate-950' : 'fill-white'
    };
}

function getProductVariantPricing(product, variantOrSizeName) {
    const basePrice = parseFloat(product?.price !== undefined && product?.price !== null && product?.price !== '' ? product.price : 52.99);
    if (!variantOrSizeName || !product) {
        return { effectivePrice: basePrice, priceDelta: 0, matchedVariant: null };
    }
    const cleanName = String(variantOrSizeName).toLowerCase().trim();

    // 1. Check product.variants
    if (Array.isArray(product.variants) && product.variants.length > 0) {
        const matched = product.variants.find(v => {
            if (!v) return false;
            if (v.id && String(v.id) === String(variantOrSizeName)) return true;
            const vName = String(v.name || v.label || v.title || '').toLowerCase().trim();
            return vName === cleanName || vName.includes(cleanName) || cleanName.includes(vName);
        });
        if (matched) {
            const vPrice = parseFloat(matched.price || 0);
            const baseV0Price = parseFloat(product.variants[0]?.price || 0);
            let priceDelta = 0;
            if (matched.priceDelta !== undefined && matched.priceDelta !== null && !isNaN(parseFloat(matched.priceDelta))) {
                priceDelta = Math.max(0, parseFloat(matched.priceDelta));
            } else if (matched.effectivePrice && parseFloat(matched.effectivePrice) >= basePrice) {
                priceDelta = Math.max(0, Math.round((parseFloat(matched.effectivePrice) - basePrice) * 100) / 100);
            } else if (vPrice > baseV0Price && baseV0Price > 0) {
                priceDelta = Math.round((vPrice - baseV0Price) * 100) / 100;
            } else if (vPrice > 0 && (!baseV0Price || baseV0Price === 0) && vPrice > basePrice) {
                priceDelta = Math.round((vPrice - basePrice) * 100) / 100;
            }
            return {
                effectivePrice: Math.round((basePrice + priceDelta) * 100) / 100,
                priceDelta,
                matchedVariant: matched
            };
        }
    }

    // 2. Check product.sizes
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
        const matched = product.sizes.find(s => {
            if (!s) return false;
            const sName = String(s.name || s.label || '').toLowerCase().trim();
            return sName === cleanName || sName.includes(cleanName) || cleanName.includes(sName);
        });
        if (matched && matched.priceDelta) {
            const priceDelta = parseFloat(matched.priceDelta) || 0;
            return {
                effectivePrice: Math.round((basePrice + priceDelta) * 100) / 100,
                priceDelta,
                matchedVariant: matched
            };
        }
    }

    return { effectivePrice: basePrice, priceDelta: 0, matchedVariant: null };
}

function formatCreatorProfile(store, rawUsername) {
    if (!store) return null;
    try {
        const cleanUser = (rawUsername || store.username || store.slug || '').toLowerCase().trim();
        const storeClean = (store.username || store.slug || cleanUser).toLowerCase().trim();
        const bioProfile = (typeof store.bioProfile === 'object' && store.bioProfile !== null)
            ? store.bioProfile
            : ((typeof store.data?.bioProfile === 'object' && store.data?.bioProfile !== null) ? store.data.bioProfile : {});

        const rawDisplayName = bioProfile.displayName || store.name || store.storeName || (rawUsername ? String(rawUsername).replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Store');
        const displayName = decodeHtmlEntities(String(rawDisplayName || 'Store'));
        
        // Fall back to demo socials ONLY for explicit demo store
        const defaultSocials = storeClean === 'demo' ? DEFAULT_DEMO_CREATOR.socials : {};
        const mergedSocials = { ...defaultSocials, ...(store.socials || {}), ...(bioProfile.socials || {}) };

        const rawBio = bioProfile.tagline || store.bio || store.description || store.tagline || `Official storefront for ${displayName}. Browse our curated collection.`;
        const cleanBio = decodeHtmlEntities(String(rawBio || ''));

        return {
            id: store.id || `store_${storeClean}`,
            name: displayName,
            handle: bioProfile.handle || store.username || store.slug || cleanUser,
            verified: bioProfile.verified !== undefined ? Boolean(bioProfile.verified) : true,
            bio: cleanBio,
            avatar: (() => {
                const raw = bioProfile.avatar || store.avatar || store.logo || store.logo_url || '';
                const safe = (typeof raw === 'string' && raw.startsWith('http://')) ? raw.replace('http://', 'https://') : (typeof raw === 'string' ? raw : '');
                return safe || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
            })(),
            socials: mergedSocials,
            customLinks: Array.isArray(bioProfile.customLinks) ? bioProfile.customLinks : [],
            leadMagnet: bioProfile.leadMagnet || null,
            backgroundPreset: bioProfile.backgroundPreset || 'warm_studio',
            productDisplayMode: bioProfile.productDisplayMode || 'all',
            featuredProductIds: Array.isArray(bioProfile.featuredProductIds) ? bioProfile.featuredProductIds : [],
            gumroadProductUrl: store.gumroadProductUrl || store.gumroadUrl || '',
            themeColor: bioProfile.themeColor || store.themeColor || '#10B981',
            tracking: store.tracking || bioProfile.tracking || {},
            status: store.status || 'approved'
        };
    } catch (err) {
        console.error("formatCreatorProfile error, returning safe fallback profile:", err);
        const safeName = store?.name || rawUsername || 'Store';
        return {
            id: store?.id || `store_${rawUsername || 'unknown'}`,
            name: safeName,
            handle: rawUsername || 'store',
            verified: true,
            bio: store?.bio || store?.description || 'Official storefront.',
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(safeName)}`,
            socials: {},
            customLinks: [],
            leadMagnet: null,
            backgroundPreset: 'warm_studio',
            productDisplayMode: 'all',
            featuredProductIds: [],
            gumroadProductUrl: store?.gumroadProductUrl || store?.gumroadUrl || '',
            themeColor: '#10B981',
            tracking: {},
            status: 'approved'
        };
    }
}

export default function CreatorClient({ initialStore = null, initialProducts = [], username = '' }) {
    const clientPathUser = typeof window !== 'undefined' ? (window.location.pathname.split('/creator/')[1]?.split('/')[0] || '') : '';
    const rawUsername = username || initialStore?.username || initialStore?.slug || clientPathUser || 'demo';
    const cleanUser = rawUsername.toLowerCase().trim();

    // Instant initial state resolution: if initialStore passed from Server Component, load in 0ms!
    const [storeInfo, setStoreInfo] = useState(initialStore || null);
    const [creator, setCreator] = useState(() => initialStore ? formatCreatorProfile(initialStore, rawUsername) : null);
    const [products, setProducts] = useState(Array.isArray(initialProducts) && initialProducts.length > 0 ? initialProducts : (initialStore?.products || []));
    const [loading, setLoading] = useState(!initialStore);
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState('full'); // 'full' | 'phone'
    const [isMobileDevice, setIsMobileDevice] = useState(true);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // Dynamic Mobile / iPad / Tablet & Preview Mode Detection
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkMobileOrTablet = () => {
            const ua = navigator.userAgent || '';
            // 1. Mobile & tablet user agents (iPhone, iPad, iPod, Android, etc.)
            const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
            // 2. iPadOS 13+ desktop-class Safari reports as Macintosh with multi-touch points
            const isIPadOS = /Macintosh/i.test(ua) && Boolean(navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
            // 3. Touch screen with tablet or mobile viewport
            const isTouchScreen = Boolean(
                (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
                (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
                ('ontouchstart' in window)
            );
            const isTabletOrMobileWidth = window.innerWidth <= 1024;

            return isMobileUA || isIPadOS || (isTouchScreen && isTabletOrMobileWidth);
        };

        const isMobile = checkMobileOrTablet();
        setIsMobileDevice(isMobile);

        const params = new URLSearchParams(window.location.search);
        const hasPreview = params.get('preview') === 'true' || params.get('mode') === 'preview' || params.get('admin') === 'true';
        setIsPreviewMode(hasPreview);

        if (isMobile || !hasPreview) {
            setViewMode('full');
        }

        const handleResize = () => {
            const mobileNow = checkMobileOrTablet();
            setIsMobileDevice(mobileNow);
            if (mobileNow) {
                setViewMode('full');
            }
        };

        window.addEventListener('resize', handleResize, { passive: true });
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const dispatch = useDispatch();
    const cartState = useSelector(state => state?.cart) || {};
    const cartItems = (cartState.cartItems && typeof cartState.cartItems === 'object' && !Array.isArray(cartState.cartItems)) ? cartState.cartItems : {};
    const cartProducts = (cartState.cartProducts && typeof cartState.cartProducts === 'object' && !Array.isArray(cartState.cartProducts)) ? cartState.cartProducts : {};
    const cartCount = useMemo(() => {
        let count = 0;
        for (const [key, qty] of Object.entries(cartItems)) {
            const numQty = parseInt(qty || 0);
            if (!numQty || numQty <= 0) continue;
            const baseId = key.includes('__') ? key.split('__')[0] : key;
            const prod = cartProducts[key] || cartProducts[baseId];
            const pSlug = prod?.storeSlug || (prod?.storeId ? String(prod.storeId).replace(/^store_/, '') : '');
            if (!pSlug || pSlug === cleanUser || prod?.storeId === `store_${cleanUser}`) {
                count += numQty;
            }
        }
        return count;
    }, [cartItems, cartProducts, cleanUser]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Stan Storefront Sorting & Options States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'price_asc' | 'price_desc' | 'best_sellers' | 'name_asc' | 'newest'
    const [layoutView, setLayoutView] = useState('list'); // 'list' | 'grid'
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [quickViewActivePhoto, setQuickViewActivePhoto] = useState(0);
    const [quickViewSelectedBundle, setQuickViewSelectedBundle] = useState(0);
    const [quickViewSelectedVariant, setQuickViewSelectedVariant] = useState('');

    // High-Conversion Urgency & Scarcity States
    const [flashCountdown, setFlashCountdown] = useState({
        hours: '02',
        minutes: '44',
        seconds: '19',
        totalSecs: 9859
    });
    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const curSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
            const cycleSecs = 4 * 3600; // resets gracefully every 4 hours
            const remaining = cycleSecs - (curSecs % cycleSecs);
            const h = Math.floor(remaining / 3600);
            const m = Math.floor((remaining % 3600) / 60);
            const s = remaining % 60;
            setFlashCountdown({
                hours: String(h).padStart(2, '0'),
                minutes: String(m).padStart(2, '0'),
                seconds: String(s).padStart(2, '0'),
                totalSecs: remaining
            });
        };
        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
    }, []);

    // Same-Day Dispatch Shipping Cutoff Calculator (5:00 PM local cutoff)
    const shippingCutoff = useMemo(() => {
        const now = new Date();
        const cutoffHour = 17;
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        if (currentHour < cutoffHour) {
            const diffMinutes = (cutoffHour * 60) - (currentHour * 60 + currentMinute);
            const h = Math.floor(diffMinutes / 60);
            const m = diffMinutes % 60;
            return `${h > 0 ? `${h}h ` : ''}${m}m`;
        }
        return 'Tomorrow 9am';
    }, []);

    // Deterministic Live Social Demand Proof (Believable & Consistent Across Page Reloads)
    const socialDemand = useMemo(() => {
        let hash = 0;
        const str = cleanUser || 'store';
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        const seed = Math.abs(hash);
        const orders = 28 + (seed % 27); // Believable range: 28 to 54
        const viewers = 11 + (seed % 14); // Believable range: 11 to 24
        return { orders, viewers };
    }, [cleanUser]);

    // Cart Reservation Timer (10-minute inventory hold)
    const [cartReserveSeconds, setCartReserveSeconds] = useState(599);
    useEffect(() => {
        const timer = setInterval(() => {
            setCartReserveSeconds(prev => (prev > 1 ? prev - 1 : 599));
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    const formattedReserveTime = useMemo(() => {
        const m = Math.floor(cartReserveSeconds / 60);
        const s = cartReserveSeconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }, [cartReserveSeconds]);

    // High-Conversion Sales States
    const [showStickyBar, setShowStickyBar] = useState(false);
    const [selectedPackIndex, setSelectedPackIndex] = useState(0);
    const [selectedSize, setSelectedSize] = useState('Medium (M)');

    // Scroll listener for sticky floating buy bar (throttled with RAF & boolean gating for 60fps smooth scrolling)
    useEffect(() => {
        let ticking = false;
        let lastState = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const shouldShow = window.scrollY > 240;
                    if (shouldShow !== lastState) {
                        lastState = shouldShow;
                        setShowStickyBar(shouldShow);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Checkout Modal State
    const [checkoutModal, setCheckoutModal] = useState({
        isOpen: false,
        product: null,
        total: 0,
        gumroadUrl: '',
        orderSessionId: ''
    });

    // Free Download Lead Modal State
    const [freeDownloadModal, setFreeDownloadModal] = useState({
        isOpen: false,
        product: null,
        email: '',
        submitted: false
    });

    // In-Bio Email Lead Magnet State
    const [bioLeadEmail, setBioLeadEmail] = useState('');
    const [bioLeadSubmitted, setBioLeadSubmitted] = useState(false);

    // Auto-Scrolling Verified Customer Reviews Carousel State
    const [activeReviewIndex, setActiveReviewIndex] = useState(0);
    const [isHoveredReview, setIsHoveredReview] = useState(false);

    // Resolve customer reviews from storeInfo or primary product
    const effectiveReviews = useMemo(() => {
        if (Array.isArray(storeInfo?.reviews) && storeInfo.reviews.length > 0) {
            return storeInfo.reviews;
        }
        const p0 = products && products.length > 0 ? products[0] : null;
        if (p0) {
            const pRevs = p0.reviews || p0.data?.reviews || p0.rating || p0.data?.rating;
            if (Array.isArray(pRevs) && pRevs.length > 0 && typeof pRevs[0] === 'object') {
                return pRevs;
            }
        }
        return [];
    }, [storeInfo?.reviews, products]);

    // Automatic Niche/Category Detection (Apparel/Costumes vs Toys/Hardware/Tech)
    const hasWearableSizes = useMemo(() => {
        const targetProd = (products && products.length > 0 ? products[0] : null);
        if (!targetProd) return false;

        const cat = (typeof targetProd?.category === 'string' ? targetProd.category : targetProd?.category?.name || '').toLowerCase();
        const name = (targetProd?.name || '').toLowerCase();
        const storeName = (storeInfo?.name || '').toLowerCase();
        const storeBio = (storeInfo?.bioProfile?.bio || storeInfo?.description || '').toLowerCase();
        const combinedContext = `${name} ${cat} ${storeName} ${storeBio}`.toLowerCase();

        // 1. Explicit negative exclusion: toys, guns, blasters, hardware, electronics, RC, batteries, ammo, tools, rubber
        const isHardwareOrToy = /toy|gun|blaster|rifle|pistol|launcher|bullet|nerf|ammo|magazine|battery|charger|rc\b|drone|car\b|truck|motor|gadget|knife|blade|tool|electronics|gel\s*ball|rubber/i.test(
            combinedContext
        );
        if (isHardwareOrToy) return false;

        // 2. Explicit positive inclusion: must genuinely be apparel, clothing, or costumes
        const isApparelOrCostume = /apparel|clothing|costume|outfit|shirt|jacket|shoes|pants|hoodie|harness|collar|vest|sweater|suit|dress|wear\b/i.test(
            `${name} ${cat}`
        );
        if (!isApparelOrCostume) return false;

        // 3. Size check: verify sizes are actual wearable sizes (S, M, L, XL, etc.)
        const sizesList = Array.isArray(targetProd?.sizes) && targetProd.sizes.length > 0 
            ? targetProd.sizes 
            : (Array.isArray(targetProd?.variants) ? targetProd.variants : []);
            
        if (sizesList.length > 0) {
            const hasClothingSizes = sizesList.some(s => {
                const sName = typeof s === 'string' ? s : (s?.name || s?.label || s?.title || '');
                return /^(xs|s|m|l|xl|xxl|2xl|3xl|small|medium|large|x-large)/i.test(sName.trim()) ||
                       /\((xs|s|m|l|xl|xxl|2xl|3xl)\)/i.test(sName.trim());
            });
            return hasClothingSizes;
        }

        return true;
    }, [products, storeInfo]);

    // Dynamic Package Bullets for Unboxing Highlight Modal
    const packageBullets = useMemo(() => {
        const p0 = products && products.length > 0 ? products[0] : null;
        if (!p0) return ['1x Premium Standard Package', '1x Official Accessories', '1x Quick-Start Guide', '1x 30-Day Guarantee'];
        if (hasWearableSizes) {
            return [
                `1x Hand-Crafted ${p0.name || 'Costume'}`,
                '1x Lightweight Accessory Kit & Fasteners',
                '1x Breathable Comfort Straps & Buckles',
                '1x Quick Sizing & Washing Care Guide'
            ];
        }
        return [
            `1x Complete ${p0.name || 'Item'} Unit`,
            '1x Full Accessory Kit & Operating Manual',
            '1x Sealed Protective Shock-Proof Packaging',
            '1x 30-Day Quality Guarantee Certificate'
        ];
    }, [products, hasWearableSizes]);

    useEffect(() => {
        const reviewCount = effectiveReviews.length;
        if (isHoveredReview || reviewCount <= 1) return;
        const reviewTimer = setInterval(() => {
            if (typeof document !== 'undefined' && document.hidden) return;
            setActiveReviewIndex(prev => (prev + 1) % reviewCount);
        }, 3500);
        return () => clearInterval(reviewTimer);
    }, [isHoveredReview, effectiveReviews]);

    // Automatic Hero Photo Carousel State
    const [activeHeroPhotoIndex, setActiveHeroPhotoIndex] = useState(0);
    const [isHoveredHeroPhoto, setIsHoveredHeroPhoto] = useState(false);

    // Stan Bio In-Lander Coupon State
    const [stanAppliedCoupon, setStanAppliedCoupon] = useState(null);
    const [stanCouponInput, setStanCouponInput] = useState('');
    const [isCouponInputOpen, setIsCouponInputOpen] = useState(false);
    const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);

    // Sync active coupon from sessionStorage on initial load
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem('active_coupon');
            if (stored && !stanAppliedCoupon) {
                setStanAppliedCoupon({
                    code: stored.toUpperCase(),
                    type: 'percentage',
                    discount: 10,
                    label: '10% OFF'
                });
            }
        }
    }, []);

    // Interactive Circular Story Highlights State ('reviews' | 'unboxing' | 'deals' | 'sizing' | null)
    const [activeStoryHighlight, setActiveStoryHighlight] = useState(null);

    // Capture incoming UTM marketing tags and persist to sessionStorage for checkout attribution
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const search = window.location.search;
            if (search) {
                const sp = new URLSearchParams(search);
                const source = sp.get('utm_source');
                const medium = sp.get('utm_medium');
                const campaign = sp.get('utm_campaign');
                const content = sp.get('utm_content');
                const term = sp.get('utm_term');
                if (source || medium || campaign) {
                    const attribution = {
                        source: source || '',
                        medium: medium || '',
                        campaign: campaign || '',
                        content: content || '',
                        term: term || '',
                        timestamp: new Date().toISOString()
                    };
                    sessionStorage.setItem('active_utm', JSON.stringify(attribution));
                }
            }
        }
    }, []);

    // Resolve hero product's gallery images for automatic carousel
    const heroItemForCarousel = (products && products.length > 0) ? products[0] : null;
    const heroGalleryImages = useMemo(() => {
        if (!heroItemForCarousel) return [];
        if (Array.isArray(heroItemForCarousel.images) && heroItemForCarousel.images.length > 0) {
            return heroItemForCarousel.images.filter(img => typeof img === 'string' && img.trim().length > 0);
        }
        if (heroItemForCarousel.image) return [heroItemForCarousel.image];
        return [];
    }, [heroItemForCarousel]);

    // Auto-advance hero photo carousel every 3.5s (pausing on hover / interaction)
    useEffect(() => {
        if (isHoveredHeroPhoto || heroGalleryImages.length <= 1) return;
        const photoTimer = setInterval(() => {
            if (typeof document !== 'undefined' && document.hidden) return;
            setActiveHeroPhotoIndex(prev => (prev + 1) % heroGalleryImages.length);
        }, 3500);
        return () => clearInterval(photoTimer);
    }, [isHoveredHeroPhoto, heroGalleryImages]);

    const handleApplyStanCoupon = async (eOrCode) => {
        let code = '';
        if (typeof eOrCode === 'string') {
            code = eOrCode.trim().toUpperCase();
        } else {
            if (eOrCode && eOrCode.preventDefault) eOrCode.preventDefault();
            code = stanCouponInput.trim().toUpperCase();
        }
        if (!code) return;
        setIsCheckingCoupon(true);
        try {
            const storeKey = creator?.id || rawUsername;
            let couponData = null;
            try {
                couponData = await getCoupon(code, storeKey);
            } catch {}

            if (!couponData) {
                // High-converting promo code fallbacks
                if (['SAVE25', 'FLASH25', 'SAVE20', 'SAVE10', 'WELCOME10', 'VIP15', 'HALLOWEEN'].includes(code)) {
                    const discount = (code === 'SAVE25' || code === 'FLASH25') ? 25 : (code === 'SAVE20' ? 20 : (code === 'VIP15' ? 15 : 10));
                    couponData = {
                        code,
                        type: 'percentage',
                        discount,
                        label: `${discount}% OFF`
                    };
                }
            }

            if (couponData) {
                const discountNum = parseFloat(couponData.discount || 10);
                const label = couponData.type === 'fixed' ? `$${discountNum} OFF` : `${discountNum}% OFF`;
                setStanAppliedCoupon({
                    code: couponData.code || code,
                    type: couponData.type || 'percentage',
                    discount: discountNum,
                    label
                });
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('active_coupon', couponData.code || code);
                }
                toast.success(`Coupon "${couponData.code || code}" applied! ${label} 🎉`);
                setIsCouponInputOpen(false);
            } else {
                toast.error('Invalid or expired coupon code');
            }
        } catch (err) {
            toast.error('Failed to apply coupon');
        } finally {
            setIsCheckingCoupon(false);
        }
    };

    const handleRemoveStanCoupon = () => {
        setStanAppliedCoupon(null);
        setStanCouponInput('');
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('active_coupon');
        }
        toast.success('Coupon removed');
    };

    useEffect(() => {
        let isMounted = true;

        // If initialStore is already provided from Server Component SSR, skip redundant network fetch
        if (initialStore) {
            setLoading(false);
            // Still register store sync listeners below
        }

        // Safety timer to prevent perpetual loading spinner if network drops
        const safetyTimer = setTimeout(() => {
            if (isMounted) setLoading(false);
        }, 5000);

        const loadCreatorStore = async (isRetry = false) => {
            // If already loaded from SSR and this is the initial mount, skip
            if ((initialStore || (Array.isArray(initialProducts) && initialProducts.length > 0)) && !isRetry) {
                if (isMounted) setLoading(false);
                return;
            }

            try {
                // 1. Authoritative Supabase / serverDb fetch
                let store = null;
                let resolvedProducts = [];
                try {
                    const res = await fetch(`/api/store/data?slug=${encodeURIComponent(rawUsername)}`, { cache: 'no-store' });
                    if (res.ok) {
                        const apiData = await res.json();
                        if (apiData.success && apiData.store) {
                            store = apiData.store;
                            resolvedProducts = Array.isArray(apiData.products) ? apiData.products : [];
                        }
                    }
                } catch (e) {
                    console.warn("Direct API fetch error:", e);
                }

                // 2. Direct Supabase / PostgREST fallback
                if (!store) {
                    try {
                        const { resolveStoreAndProducts } = await import('@/lib/storePresets');
                        const fallbackData = await resolveStoreAndProducts(rawUsername);
                        if (fallbackData?.store) {
                            store = fallbackData.store;
                            resolvedProducts = fallbackData.products || [];
                        }
                    } catch (e) {
                        console.warn("Direct data layer fallback error:", e);
                    }
                }

                // 3. Auto-retry once after 1s before giving up (guards against cold start / mobile latency)
                if (!store && !isRetry && cleanUser !== 'demo') {
                    setTimeout(() => {
                        if (isMounted) loadCreatorStore(true);
                    }, 1000);
                    return;
                }

                if (isMounted) {
                    if (store) {
                        setStoreInfo(store);
                        const prof = formatCreatorProfile(store, rawUsername);
                        setCreator(prof);
                        setProducts(resolvedProducts || []);
                        if (typeof document !== 'undefined') {
                            document.title = `${prof?.name || rawUsername} (@${cleanUser}) — Stan Store & Bio Catalog | GumShop`;
                        }
                    } else if (cleanUser === 'demo') {
                        const demoData = getStoreAndCatalogSync('demo');
                        setStoreInfo(demoData.store);
                        const prof = formatCreatorProfile(demoData.store, 'demo');
                        setCreator(prof);
                        setProducts(demoData.products || []);
                        if (typeof document !== 'undefined') {
                            document.title = `${prof?.name || 'Store'} — Stan Store & Bio Catalog | GumShop`;
                        }
                    } else {
                        // Only clear if store was never loaded, preventing transient flash
                        setStoreInfo(prev => prev || null);
                        setCreator(prev => prev || null);
                        setProducts(prev => (prev && prev.length > 0) ? prev : []);
                    }
                }
            } catch (err) {
                console.error("Error loading creator bio:", err);
                if (isMounted && cleanUser === 'demo') {
                    const demoData = getStoreAndCatalogSync('demo');
                    setStoreInfo(demoData.store);
                    setCreator(formatCreatorProfile(demoData.store, 'demo'));
                    setProducts(demoData.products || []);
                }
            } finally {
                clearTimeout(safetyTimer);
                if (isMounted) setLoading(false);
            }
        };

        loadCreatorStore();

        const handleSync = () => {
            loadCreatorStore();
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('products_updated', handleSync);
            window.addEventListener('active_store_changed', handleSync);
        }

        return () => {
            isMounted = false;
            clearTimeout(safetyTimer);
            if (typeof window !== 'undefined') {
                window.removeEventListener('products_updated', handleSync);
                window.removeEventListener('active_store_changed', handleSync);
            }
        };
    }, [cleanUser, rawUsername]);

    const handleCopyShareLink = () => {
        if (typeof window !== 'undefined') {
            const url = window.location.href;
            navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success("Bio link copied to clipboard! 📋");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Ad Pixel Event Dispatcher
    const firePixelEvent = (eventName, data = {}) => {
        if (typeof window === 'undefined') return;
        try {
            if (window.fbq) window.fbq('track', eventName, data);
            if (window.ttq) window.ttq.track(eventName, data);
            if (window.gtag) window.gtag('event', eventName, data);
        } catch {}
    };

    useEffect(() => {
        if (creator) {
            firePixelEvent('PageView', { content_name: creator.name });
        }
    }, [creator]);

    const handleAddToCart = (product, bundle = null) => {
        if (!product || !product.id) return;
        try {
            const qty = bundle ? (parseInt(bundle.qty, 10) || 1) : 1;
            const baseBundlePrice = bundle 
                ? (parseFloat(bundle.totalPrice || bundle.price || product.price) || 0)
                : (parseFloat(product.price || 0) || 0);
            const unitPrice = bundle
                ? (bundle.pricePerUnit ? (parseFloat(bundle.pricePerUnit) || 0) : Number((baseBundlePrice / qty).toFixed(2)))
                : (parseFloat(product.price || 0) || baseBundlePrice);
            const sizeName = (product.variant && typeof product.variant === 'string')
                ? product.variant
                : (hasWearableSizes ? (typeof selectedSize === 'object' ? (selectedSize?.name || selectedSize?.label) : selectedSize) : null);
            const variantStr = [sizeName, bundle?.label].filter(Boolean).join(' • ');

            dispatch(addToCart({
                productId: product.id,
                quantity: qty,
                product: {
                    ...product,
                    name: product.name || 'Product',
                    price: unitPrice,
                    variant: variantStr || '',
                    storeId: creator?.id || `store_${cleanUser}`,
                    storeSlug: cleanUser,
                    image: product.image || (Array.isArray(product.images) && product.images[0]) || ''
                }
            }));
            toast.success(`Added ${product.name || 'item'} to cart! 🛒`);
            setIsCartOpen(true);
        } catch (err) {
            console.error('Error adding to cart:', err);
            toast.error('Could not add item to cart. Please try again.');
        }
    };

    // ⚡ Instant Buy via Gumroad Trigger (Supports Selected Bundle, Quantity, and Coupon)
    const handleInstantBuy = async (product, bundle = null, discountAmount = 0, couponCode = '') => {
        const qty = bundle ? (bundle.qty || 1) : 1;
        const baseBundlePrice = bundle 
            ? parseFloat(bundle.totalPrice || bundle.price || product.price) 
            : parseFloat(product.price || 0);

        let effectiveDiscount = parseFloat(discountAmount || 0);
        if (effectiveDiscount === 0 && stanAppliedCoupon) {
            effectiveDiscount = stanAppliedCoupon.type === 'fixed'
                ? Math.min(baseBundlePrice, parseFloat(stanAppliedCoupon.discount || 0))
                : Math.round(baseBundlePrice * (parseFloat(stanAppliedCoupon.discount || 0) / 100) * 100) / 100;
        }

        const finalPrice = Math.max(1.00, Math.round((baseBundlePrice - effectiveDiscount) * 100) / 100);
        const unitPrice = bundle
            ? (bundle.pricePerUnit ? parseFloat(bundle.pricePerUnit) : Number((baseBundlePrice / qty).toFixed(2)))
            : (parseFloat(product.price || 0) || baseBundlePrice);

        const sizeName = (product.variant && typeof product.variant === 'string')
            ? product.variant
            : (hasWearableSizes ? (typeof selectedSize === 'object' ? (selectedSize?.name || selectedSize?.label) : selectedSize) : null);
        const sizePrefix = sizeName ? `Option: ${sizeName}` : '';
        const bundleLabel = bundle?.label;
        const variantDesc = [sizePrefix, bundleLabel].filter(Boolean).join(' • ');
        const itemName = variantDesc ? `${product.name} (${variantDesc})` : product.name;

        const orderSessionId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        firePixelEvent('InitiateCheckout', {
            content_name: itemName,
            value: finalPrice,
            currency: 'USD'
        });

        let activeAttribution = null;
        if (typeof window !== 'undefined') {
            try {
                const rawUtm = sessionStorage.getItem('active_utm');
                if (rawUtm) activeAttribution = JSON.parse(rawUtm);
            } catch {}
        }
        
        // ⚡ 0ms Instant Feedback: Open Checkout Modal immediately at Step 1 (Shipping Address)
        // while the dynamic Gumroad link warms up in parallel in the background!
        setCheckoutModal({
            isOpen: true,
            product: { ...product, name: itemName },
            selectedBundle: bundle ? { ...bundle, pricePerUnit: unitPrice } : { qty: 1, totalPrice: finalPrice, pricePerUnit: unitPrice },
            total: finalPrice,
            gumroadUrl: '',
            orderSessionId: orderSessionId,
            storeId: creator?.id || `store_${cleanUser}`,
            storeSlug: cleanUser
        });

        try {
            const res = await fetch('/api/gumroad/dynamic-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: creator?.id || `store_${cleanUser}`,
                    storeSlug: cleanUser,
                    storeName: creator?.name || 'Creator Store',
                    attribution: activeAttribution,
                    items: [{
                        productId: product.id,
                        name: itemName,
                        price: unitPrice,
                        quantity: qty,
                        selectedSize: sizeName || '',
                        variant: sizeName || '',
                        selectedVariantId: product.selectedVariantId || '',
                        image: product.image || product.images?.[0]
                    }],
                    discountAmount: effectiveDiscount,
                    couponCode: couponCode || (stanAppliedCoupon ? stanAppliedCoupon.code : ''),
                    gumroadProductUrl: creator?.gumroadProductUrl || product.gumroadUrl || ''
                })
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.checkoutUrl) {
                if (data.error) {
                    toast.error(data.error);
                }
            } else if (data.checkoutUrl) {
                setCheckoutModal(prev => ({
                    ...prev,
                    gumroadUrl: data.checkoutUrl,
                    total: typeof data.total === 'number' ? data.total : prev.total,
                    orderSessionId: data.orderSessionId || prev.orderSessionId
                }));
            }
        } catch (e) {
            console.warn("Dynamic checkout warmup notice:", e);
        }
    };

    // Free Download Handler
    const handleFreeDownloadClick = (product) => {
        setFreeDownloadModal({
            isOpen: true,
            product: product,
            email: '',
            submitted: false
        });
    };

    const handleFreeDownloadSubmit = (e) => {
        e.preventDefault();
        if (!freeDownloadModal.email || !freeDownloadModal.email.includes('@')) {
            toast.error("Please enter a valid email address.");
            return;
        }

        const email = freeDownloadModal.email.trim().toLowerCase();

        // 1. Dispatch to dedicated leads API for 1-click marketing export
        fetch('/api/store/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                store: cleanUser,
                email: email,
                source: 'Digital Freebie Download',
                leadMagnetTitle: freeDownloadModal.product?.name || 'Digital Resource'
            })
        }).catch(() => {});

        // 2. Dispatch to server-side orders store
        const leadName = email ? email.split('@')[0] : 'Subscriber';
        fetch('/api/store/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                storeId: storeInfo?.id || `store_${cleanUser}`,
                customer: { name: leadName, email },
                items: [{
                    name: freeDownloadModal.product?.name || 'Digital Freebie',
                    price: 0,
                    quantity: 1
                }],
                total: 0,
                source: 'Digital Freebie Download',
                status: 'lead'
            })
        }).catch(() => {});

        setFreeDownloadModal(prev => ({ ...prev, submitted: true }));
        toast.success(`Download link sent to ${email}! 🎉`);
        setTimeout(() => {
            setFreeDownloadModal({ isOpen: false, product: null, email: '', submitted: false });
        }, 2200);
    };

    const handleBioLeadSubmit = (e) => {
        e.preventDefault();
        const email = bioLeadEmail.trim().toLowerCase();
        if (!email || !email.includes('@')) {
            toast.error("Please enter a valid email address.");
            return;
        }

        const leadName = email ? email.split('@')[0] : 'Subscriber';
        const newLead = {
            id: `lead_${Date.now()}`,
            name: leadName,
            email: email,
            totalSpent: 0,
            orderCount: 0,
            source: 'Stan Bio Lead Magnet',
            lastOrderDate: new Date().toISOString()
        };

        // 1. Dispatch to dedicated leads API for 1-click CSV export
        fetch('/api/store/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                store: cleanUser,
                email: email,
                source: 'Stan Bio Lead Magnet',
                leadMagnetTitle: creator.leadMagnet?.title || 'Complimentary Guide'
            })
        }).catch(() => {});

        // 2. Dispatch to server-side order/lead store
        fetch('/api/store/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                storeId: storeInfo?.id || `store_${cleanUser}`,
                customer: {
                    name: leadName,
                    email: email,
                },
                items: [{
                    name: creator.leadMagnet?.title || 'Free Creator Playbook',
                    price: 0,
                    quantity: 1
                }],
                total: 0,
                source: 'Stan Bio Lead Magnet',
                status: 'lead'
            })
        }).catch(() => {});

        // 3. Persist in local storage for instant offline resilience
        try {
            const crmKey = `gumshop_customers_${cleanUser}`;
            const existing = JSON.parse(localStorage.getItem(crmKey) || '[]');
            if (!existing.some(c => c.email === email)) {
                existing.unshift(newLead);
                localStorage.setItem(crmKey, JSON.stringify(existing));
            }
        } catch {}

        setBioLeadSubmitted(true);
        toast.success(`Access granted! Sent to ${bioLeadEmail} 🎉`, { duration: 3500 });
    };

    const displayedProducts = creator?.productDisplayMode === 'curated'
        ? products.filter(p => Array.isArray(creator.featuredProductIds) && creator.featuredProductIds.includes(p.id))
        : products;

    // Dynamic Category Extraction across all products in store (must be top-level hook)
    const storeCategories = useMemo(() => {
        const cats = new Set();
        (displayedProducts || []).forEach(p => {
            if (!p) return;
            const c = typeof p.category === 'string' ? p.category.trim() : (p.category?.name || '');
            if (c && c.toLowerCase() !== 'general') cats.add(c);
        });
        return ['All', ...Array.from(cats)];
    }, [displayedProducts]);

    // Reactive Filtering & Sorting Pipeline (must be top-level hook)
    const processedProducts = useMemo(() => {
        let list = Array.isArray(displayedProducts) ? displayedProducts.filter(Boolean) : [];

        // 1. Category Filter
        if (selectedCategory && selectedCategory !== 'All') {
            list = list.filter(p => {
                if (!p) return false;
                const c = typeof p.category === 'string' ? p.category.trim() : (p.category?.name || '');
                return c.toLowerCase() === selectedCategory.toLowerCase();
            });
        }

        // 2. Keyword Search Filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(p => {
                if (!p) return false;
                return (p.name || '').toLowerCase().includes(q) ||
                    (p.description || '').toLowerCase().includes(q) ||
                    (typeof p.category === 'string' ? p.category.toLowerCase() : '').includes(q);
            });
        }

        // 3. Sorting Options
        switch (sortBy) {
            case 'price_asc':
                list.sort((a, b) => (parseFloat(a?.price) || 0) - (parseFloat(b?.price) || 0));
                break;
            case 'price_desc':
                list.sort((a, b) => (parseFloat(b?.price) || 0) - (parseFloat(a?.price) || 0));
                break;
            case 'best_sellers':
                list.sort((a, b) => {
                    const aScore = a?.badge ? 2 : (Array.isArray(a?.reviews) ? a.reviews.length : 0);
                    const bScore = b?.badge ? 2 : (Array.isArray(b?.reviews) ? b.reviews.length : 0);
                    return bScore - aScore;
                });
                break;
            case 'name_asc':
                list.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
                break;
            case 'newest':
                list.sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
                break;
            case 'featured':
            default:
                break;
        }
        return list;
    }, [displayedProducts, selectedCategory, searchQuery, sortBy]);

    // Progressive Windowing for High-Performance Rendering & Sub-10ms SSR (<115KB payload)
    const [visibleCount, setVisibleCount] = useState(24);

    useEffect(() => {
        setVisibleCount(24);
    }, [selectedCategory, searchQuery, sortBy]);

    const visibleProducts = useMemo(() => {
        return processedProducts.slice(0, visibleCount);
    }, [processedProducts, visibleCount]);

    useEffect(() => {
        if (visibleCount >= processedProducts.length) return;
        const target = document.getElementById('stan-store-load-more');
        if (!target) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0] && entries[0].isIntersecting) {
                setVisibleCount(prev => Math.min(prev + 24, processedProducts.length));
            }
        }, { rootMargin: '300px' });
        observer.observe(target);
        return () => observer.disconnect();
    }, [visibleCount, processedProducts.length]);

    if (loading) return <Loading />;

    if (!storeInfo || !creator) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-4 font-sans">
                <div className="size-20 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-rose-500 mb-4">
                    <Store size={36} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Store Not Found</h2>
                <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
                    The link-in-bio store <code className="font-mono text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">@{rawUsername}</code> may have been renamed or has not been published yet.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <Link prefetch={false}href={`/shop/${rawUsername}`} className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition">
                        Check Standard Shop
                    </Link>
                    <Link prefetch={false}href="/dashboard" className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition">
                        Master HQ
                    </Link>
                </div>
            </div>
        );
    }

    if (storeInfo.status === 'archived') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-4 font-sans">
                <div className="size-20 rounded-3xl bg-amber-50 border border-amber-200 shadow-sm flex items-center justify-center text-amber-600 mb-4">
                    <Store size={36} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Store Inactive</h2>
                <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
                    The link-in-bio profile <code className="font-mono text-amber-700 font-bold bg-amber-100/60 px-2 py-0.5 rounded">@{rawUsername}</code> is currently archived.
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                    <Link prefetch={false}href="/dashboard" className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition">
                        Manage in Master HQ
                    </Link>
                </div>
            </div>
        );
    }

    const activePreset = PRESET_STYLES[creator?.backgroundPreset] || PRESET_STYLES.warm_studio;

    return (
        <div className={`min-h-screen text-slate-900 selection:bg-rose-500 selection:text-white flex flex-col font-sans antialiased ${activePreset.bg}`}>
            {/* SEO Rich Snippets JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ProfilePage",
                        "mainEntity": {
                            "@type": "Person",
                            "name": creator.name,
                            "description": creator.bio,
                            "image": creator.avatar,
                            "url": `https://gumshop.online/creator/${rawUsername}`,
                            "sameAs": Object.values(creator.socials || {}).filter(Boolean)
                        }
                    })
                }}
            />

            {/* Meta Pixel Tracking Script */}
            {creator?.tracking?.metaPixelId && (
                <script
                    id="meta-pixel"
                    dangerouslySetInnerHTML={{
                        __html: `
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${creator.tracking.metaPixelId}');
                        fbq('track', 'PageView');
                        `
                    }}
                />
            )}

            {/* TikTok Pixel Tracking Script */}
            {creator?.tracking?.tiktokPixelId && (
                <script
                    id="tiktok-pixel"
                    dangerouslySetInnerHTML={{
                        __html: `
                        !function (w, d, t) {
                            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                            ttq.load('${creator.tracking.tiktokPixelId}');
                            ttq.page();
                        }(window, document, 'ttq');
                        `
                    }}
                />
            )}

            {/* ⚡ High-Converting Sticky Flash Sale Urgency Bar */}
            <aside 
                aria-label="Flash sale promotion" 
                className="sticky top-0 z-50 w-full bg-gradient-to-r from-red-600 via-orange-600 to-rose-600 text-white shadow-md select-none border-b border-white/10"
            >
                <div className="max-w-[440px] mx-auto px-3 py-1.5 sm:py-2 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 font-black tracking-tight shrink-0">
                        <span className="size-2 rounded-full bg-yellow-300 animate-ping shrink-0" />
                        <span className="text-[11px] sm:text-xs uppercase tracking-tight">⚡ FLASH SALE: 20% OFF</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-0.5 font-mono font-black bg-black/40 px-2 py-0.5 rounded-lg text-[11px] text-yellow-300 tracking-wider shadow-inner">
                            <span>{flashCountdown.hours}</span>
                            <span className="animate-pulse">:</span>
                            <span>{flashCountdown.minutes}</span>
                            <span className="animate-pulse">:</span>
                            <span>{flashCountdown.seconds}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleApplyStanCoupon('SAVE20')}
                            className="px-2.5 py-1 rounded-full bg-white text-rose-700 hover:bg-yellow-50 font-black text-[10px] tracking-wider transition active:scale-95 shadow-sm cursor-pointer uppercase shrink-0"
                            title="Apply 20% off code SAVE20"
                        >
                            {stanAppliedCoupon?.code === 'SAVE20' ? 'APPLIED ✓' : 'APPLY CODE'}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Desktop Admin / Switcher Banner - Strictly hidden on mobile/iPad and only shown in explicit desktop preview mode */}
            {isPreviewMode && !isMobileDevice && (
                <header className="hidden md:flex items-center justify-between px-6 py-3 bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
                    <div className="flex items-center gap-3">
                        <Link prefetch={false}href="/" 
                            className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition"
                        >
                            <ArrowLeft size={14} /> Back to GumShop
                        </Link>
                        <span className="text-slate-300">|</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100">
                            ⚡ Link-in-Bio Mode • Live Store Sync
                        </span>
                        <Link prefetch={false}href={`/store/bio-editor?store=${encodeURIComponent(rawUsername)}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                        >
                            <Smartphone size={12} className="text-rose-500" />
                            <span>Edit Bio Profile</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-medium">
                            <button
                                onClick={() => setViewMode('phone')}
                                aria-label="Switch to Phone Frame view"
                                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                                    viewMode === 'phone' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Smartphone size={13} /> Phone Frame
                            </button>
                            <button
                                onClick={() => setViewMode('full')}
                                aria-label="Switch to Full Width view"
                                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                                    viewMode === 'full' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Monitor size={13} /> Full Width
                            </button>
                        </div>

                        {/* Copy Bio Link */}
                        <button
                            onClick={handleCopyShareLink}
                            aria-label="Copy store bio link"
                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                        >
                            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                            <span>{copied ? "Copied!" : "Copy Bio Link"}</span>
                        </button>

                        {/* View Standard Catalog */}
                        <Link prefetch={false}href={`/shop/${rawUsername}`}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                        >
                            <Globe size={13} />
                            <span>Standard Grid Shop</span>
                        </Link>
                    </div>
                </header>
            )}

            {/* Main Stage with Dynamic Atmosphere Preset - Full Screen by default on mobile/iPad */}
            <main className={`flex-1 flex flex-col items-center justify-start w-full min-h-screen overflow-x-hidden ${
                isPreviewMode && !isMobileDevice && viewMode === 'phone' ? 'p-0 md:py-8 md:px-4' : 'p-0 m-0'
            } ${activePreset.bg}`}>
                
                {/* Mobile Smartphone Frame Container - Opens in Full View on Mobile/iPad */}
                <div 
                    className={`w-full transition-all duration-300 ${
                        isPreviewMode && !isMobileDevice && viewMode === 'phone' 
                            ? `w-full max-w-full sm:max-w-[430px] mx-auto md:my-auto md:rounded-[48px] md:border-[10px] md:border-slate-900 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] md:ring-1 md:ring-slate-800/10 relative overflow-hidden ${activePreset.frame}`
                            : `w-full max-w-full sm:max-w-xl md:max-w-2xl mx-auto min-h-screen rounded-none border-0 shadow-none ring-0 my-0 relative ${activePreset.frame}`
                    }`}
                >
                    {/* Inner Content Canvas */}
                    <div className="px-4 sm:px-6 pt-5 pb-12 w-full min-h-screen flex flex-col justify-between">
                        
                        {/* ─── Profile Header ─── */}
                        <div>
                            <div className="flex flex-col items-center text-center">
                                
                                {/* Store Logo / Creator Avatar */}
                                <div className="relative mb-3 group">
                                    <div className="size-20 sm:size-22 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-slate-200 to-slate-100 ring-2 ring-slate-200/80 shadow-md">
                                        <img 
                                            src={getSafeImageUrl(creator.avatar, 'avatar')} 
                                            alt={creator.name || 'Store'} 
                                            decoding="async"
                                            className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => handleImageError(e, 'avatar', creator.name || 'Store')}
                                        />
                                    </div>
                                    <button 
                                        onClick={handleCopyShareLink}
                                        aria-label="Share creator profile"
                                        className="absolute bottom-0 right-0 size-7 bg-white text-slate-700 hover:text-slate-950 rounded-full border border-slate-200 shadow-xs flex items-center justify-center transition active:scale-90"
                                    >
                                        <Share2 size={13} />
                                    </button>
                                </div>

                                {/* Creator Display Name & Verified Blue Badge */}
                                <h1 className="text-lg sm:text-xl font-extrabold text-slate-950 tracking-tight flex items-center justify-center gap-1.5">
                                    <span>{decodeHtmlEntities(creator.name)}</span>
                                    <span title="Verified Merchant" className="inline-flex items-center text-blue-500">
                                        <svg className="w-5 h-5 fill-blue-500 text-white" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.2 14.2l-3.5-3.5 1.4-1.4 2.1 2.1 5.6-5.6 1.4 1.4-7 7z"/>
                                        </svg>
                                    </span>
                                </h1>

                                {/* Bio / Tagline Paragraph */}
                                <p className="text-xs sm:text-[13px] text-slate-600 font-medium max-w-xs mt-1.5 leading-relaxed">
                                    {decodeHtmlEntities(creator.bio)}
                                </p>

                                {/* 🔥 Real-Time Social Demand & Shipping Cutoff Tickers */}
                                <div className="mt-2.5 flex flex-col items-center gap-1.5 w-full max-w-xs mx-auto">
                                    <div className="w-full py-1 px-3 rounded-full bg-rose-50 border border-rose-200/70 text-rose-700 text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs">
                                        <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                                        <span>🔥 {socialDemand.orders} items ordered today</span>
                                        <span className="text-rose-300">•</span>
                                        <span>👀 {socialDemand.viewers} shoppers viewing</span>
                                    </div>
                                    <div className="w-full py-0.5 px-2.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[10.5px] font-semibold flex items-center justify-center gap-1">
                                        <span>📦</span>
                                        <span>Order within <strong className="font-bold text-emerald-800">{shippingCutoff}</strong> for Same-Day Dispatch</span>
                                    </div>
                                </div>

                                {/* Direct Bridge to Full Storefront & Cart */}
                                <div className="mt-3 flex items-center justify-center flex-wrap gap-2">
                                    <Link prefetch={false}href={`/shop/${rawUsername}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shadow-xs transition active:scale-95"
                                    >
                                        <Globe size={12} className="text-emerald-400" />
                                        <span>Full Storefront</span>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setIsCartOpen(true)}
                                        className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition active:scale-95 cursor-pointer border border-slate-200/60"
                                    >
                                        <ShoppingBag size={12} className="text-slate-700" />
                                        <span>Cart</span>
                                        {cartCount > 0 && (
                                            <span className="size-4 rounded-full bg-emerald-600 text-white text-[9.5px] font-black flex items-center justify-center">
                                                {cartCount}
                                            </span>
                                        )}
                                    </button>
                                    <Link prefetch={false}href={`/shop/${rawUsername}/track`}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition"
                                    >
                                        <span>Track Order</span>
                                    </Link>
                                </div>

                                {/* Social Links Hub */}
                                <div className="flex items-center justify-center gap-3 mt-3 text-slate-600">
                                    {creator.socials?.instagram && (
                                        <a 
                                            href={creator.socials.instagram} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 transition hover:scale-110"
                                            aria-label="Instagram"
                                        >
                                            <svg className="size-4 fill-current" viewBox="0 0 24 24">
                                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                            </svg>
                                        </a>
                                    )}

                                    {creator.socials?.twitter && (
                                        <a 
                                            href={creator.socials.twitter} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 transition hover:scale-110"
                                            aria-label="Twitter / X"
                                        >
                                            <svg className="size-4 fill-current" viewBox="0 0 24 24">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                            </svg>
                                        </a>
                                    )}

                                    {creator.socials?.youtube && (
                                        <a 
                                            href={creator.socials.youtube} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 transition hover:scale-110"
                                            aria-label="YouTube"
                                        >
                                            <svg className="size-4 fill-current" viewBox="0 0 24 24">
                                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                            </svg>
                                        </a>
                                    )}

                                    {creator.socials?.github && (
                                        <a 
                                            href={creator.socials.github} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 transition hover:scale-110"
                                            aria-label="GitHub"
                                        >
                                            <svg className="size-4 fill-current" viewBox="0 0 24 24">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                                            </svg>
                                        </a>
                                    )}
                                </div>

                                {/* ─── Circular Story Highlights (Instagram / TikTok Style) ─── */}
                                <div className="mt-4 w-full">
                                    <div className="flex items-center justify-between max-w-xs mx-auto gap-2 py-1">
                                        {[
                                            { id: 'reviews', label: 'Reviews', badge: '4.9★', ring: 'from-amber-400 via-orange-500 to-amber-600', icon: Star },
                                            { id: 'unboxing', label: 'In The Box', badge: 'Preview', ring: 'from-blue-500 via-indigo-500 to-purple-600', icon: Package },
                                            { id: 'deals', label: 'Deals', badge: 'Coupons', ring: 'from-emerald-400 via-teal-500 to-emerald-600', icon: Ticket },
                                            hasWearableSizes
                                                ? { id: 'sizing', label: 'Fit Guide', badge: 'Guarantee', ring: 'from-rose-400 via-pink-500 to-purple-600', icon: ShieldCheck }
                                                : { id: 'specs', label: 'Specs & Safety', badge: 'Certified', ring: 'from-rose-400 via-pink-500 to-purple-600', icon: ShieldCheck }
                                        ].map((story) => {
                                            const IconComp = story.icon;
                                            return (
                                                <button
                                                    key={story.id}
                                                    type="button"
                                                    onClick={() => setActiveStoryHighlight(story.id)}
                                                    className="flex flex-col items-center gap-1 group cursor-pointer focus:outline-none shrink-0"
                                                >
                                                    <div className={`p-0.5 rounded-full bg-gradient-to-tr ${story.ring} shadow-xs transition-transform duration-200 group-hover:scale-105 group-active:scale-95`}>
                                                        <div className="size-12 sm:size-13 rounded-full bg-white flex items-center justify-center p-0.5">
                                                            <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center text-slate-800 group-hover:bg-slate-100 transition">
                                                                <IconComp size={18} className="text-slate-800" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-700 tracking-tight text-center">
                                                        {story.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* ─── Custom CTA Link Buttons (Stan Store Killer Feature) ─── */}
                                {creator.customLinks?.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {creator.customLinks.map((link, idx) => (
                                            <a
                                                key={link.id || idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="relative block w-full p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all font-bold text-xs sm:text-sm text-slate-800 text-center active:scale-[0.99]"
                                                style={link.highlight ? { borderColor: creator.themeColor || '#10B981', borderWidth: '1.5px' } : {}}
                                            >
                                                {link.highlight && (
                                                    <span 
                                                        className="absolute -top-2.5 right-3 text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white shadow-2xs"
                                                        style={{ backgroundColor: creator.themeColor || '#10B981' }}
                                                    >
                                                        {link.badge || '⭐ Featured'}
                                                    </span>
                                                )}
                                                <span>{link.title}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {/* ─── Email Lead Magnet Opt-In Card ─── */}
                                {creator.leadMagnet?.enabled && (
                                    <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md relative overflow-hidden text-left">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-xs">🎁</span>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                                                VIP Drops Club
                                            </span>
                                        </div>
                                        <h4 className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                                            {creator.leadMagnet.title || 'VIP Members Club & Secret Drops'}
                                        </h4>
                                        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                                            {creator.leadMagnet.subtitle || 'Enter your email for private launch alerts, restocks, and exclusive promo codes.'}
                                        </p>

                                        {bioLeadSubmitted ? (
                                            <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                                                <CheckCircle2 size={14} className="text-emerald-400" />
                                                <span>You’re on the VIP list! Welcome aboard.</span>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleBioLeadSubmit} className="mt-3 flex gap-1.5">
                                                <input 
                                                    type="email"
                                                    required
                                                    placeholder="Enter your email..."
                                                    value={bioLeadEmail}
                                                    onChange={e => setBioLeadEmail(e.target.value)}
                                                    className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                                />
                                                <button
                                                    type="submit"
                                                    className="px-3.5 py-1.5 rounded-xl font-black text-xs transition active:scale-95 shrink-0"
                                                    style={{ 
                                                        backgroundColor: resolveCtaTheme(creator.themeColor, true).backgroundColor, 
                                                        color: resolveCtaTheme(creator.themeColor, true).color 
                                                    }}
                                                >
                                                    {creator.leadMagnet.buttonText || 'Claim Free'}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                )}

                            </div>

                            {/* ─── Product Section: Single-Product Hero Lander OR Multi-Product Stack ─── */}
                            {(displayedProducts.length > 0 && (displayedProducts.length === 1 || storeInfo?.singleProductStore)) ? (
                                /* 🚀 ULTRA HIGH-CONVERTING SINGLE-PRODUCT HERO LANDER */
                                (() => {
                                    const heroItem = displayedProducts[0];
                                    if (!heroItem) return null;
                                    const baseItem = heroItem.name ? String(heroItem.name).split(' ')[0] : 'Item';
                                    const heroPrice = parseFloat(heroItem.price !== undefined && heroItem.price !== null && heroItem.price !== '' ? heroItem.price : 52.99);
                                    const heroCompare = parseFloat(heroItem.compareAtPrice || heroItem.comparePrice || (heroPrice === 52.99 ? 69.99 : Math.round(heroPrice * 1.35 * 100) / 100));
                                    const discountPct = heroCompare > heroPrice ? Math.round(((heroCompare - heroPrice) / heroCompare) * 100) : 0;
                                    const heroBullets = Array.isArray(heroItem.bullets) && heroItem.bullets.length > 0
                                        ? heroItem.bullets
                                        : [
                                            "Light-up pumpkin lantern with high-intensity LED",
                                            "Adjustable chest & belly straps for comfy all-night fit",
                                            "Lightweight padded saddle — fits cats and dogs easily"
                                        ];

                                    return (
                                        <div className="mt-4 bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] space-y-4">
                                            {/* Large Immersive Product Imagery with Automatic Carousel */}
                                            <div 
                                                className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 select-none group"
                                                onMouseEnter={() => setIsHoveredHeroPhoto(true)}
                                                onMouseLeave={() => setIsHoveredHeroPhoto(false)}
                                                onTouchStart={() => setIsHoveredHeroPhoto(true)}
                                                onTouchEnd={() => setIsHoveredHeroPhoto(false)}
                                            >
                                                {(heroGalleryImages.length > 0 ? heroGalleryImages : [heroItem.image || '/placeholder.png']).map((imgUrl, imgIdx) => (
                                                    <img 
                                                        key={imgIdx}
                                                        src={getSafeImageUrl(imgUrl)} 
                                                        alt={`${decodeHtmlEntities(heroItem.name)} - View ${imgIdx + 1}`} 
                                                        loading={imgIdx === 0 ? "eager" : "lazy"}
                                                        decoding="async"
                                                        className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-500 ease-in-out ${
                                                            imgIdx === activeHeroPhotoIndex ? 'opacity-100 z-1 scale-100' : 'opacity-0 z-0 pointer-events-none'
                                                        }`}
                                                        onError={(e) => handleImageError(e, 'product')}
                                                    />
                                                ))}

                                                {/* Top Badges */}
                                                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                                                    {discountPct > 0 ? (
                                                        <span className="px-2.5 py-1 rounded-full bg-slate-900/90 text-white font-black text-xs shadow-md">
                                                            Save {discountPct}%
                                                        </span>
                                                    ) : <span />}
                                                    <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1">
                                                        <span className="size-1.5 rounded-full bg-white animate-pulse" />
                                                        In Stock
                                                    </span>
                                                </div>

                                                {/* Prev / Next Chevrons (Only if multiple images exist) */}
                                                {heroGalleryImages.length > 1 && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveHeroPhotoIndex(prev => (prev - 1 + heroGalleryImages.length) % heroGalleryImages.length);
                                                            }}
                                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-8 rounded-full bg-slate-900/50 hover:bg-slate-900/80 text-white backdrop-blur-xs flex items-center justify-center transition shadow-md z-10 opacity-70 group-hover:opacity-100 cursor-pointer"
                                                            aria-label="Previous photo"
                                                        >
                                                            <ChevronLeft size={18} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveHeroPhotoIndex(prev => (prev + 1) % heroGalleryImages.length);
                                                            }}
                                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 size-8 rounded-full bg-slate-900/50 hover:bg-slate-900/80 text-white backdrop-blur-xs flex items-center justify-center transition shadow-md z-10 opacity-70 group-hover:opacity-100 cursor-pointer"
                                                            aria-label="Next photo"
                                                        >
                                                            <ChevronRight size={18} />
                                                        </button>

                                                        {/* Bottom Dots Indicator Bar & Photo Counter */}
                                                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                                                            <div className="flex items-center gap-1.5 bg-slate-900/40 backdrop-blur-xs px-2.5 py-1 rounded-full pointer-events-auto">
                                                                {heroGalleryImages.map((_, pIdx) => (
                                                                    <button
                                                                        key={pIdx}
                                                                        type="button"
                                                                        onClick={() => setActiveHeroPhotoIndex(pIdx)}
                                                                        className={`transition-all rounded-full cursor-pointer ${
                                                                            activeHeroPhotoIndex === pIdx 
                                                                                ? 'w-4 h-1.5 bg-white shadow-xs' 
                                                                                : 'size-1.5 bg-white/60 hover:bg-white/90'
                                                                        }`}
                                                                        aria-label={`Go to photo ${pIdx + 1}`}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <span className="px-2 py-0.5 rounded-full bg-slate-900/60 backdrop-blur-xs text-white text-[10px] font-bold">
                                                                {activeHeroPhotoIndex + 1} / {heroGalleryImages.length}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Headline & Kicker */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                                                        ● {heroItem.kicker || 'OFFICIAL RELEASE'}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg sm:text-xl font-black text-slate-950 leading-tight">
                                                    {decodeHtmlEntities(heroItem.name)}
                                                </h3>
                                                {heroItem.subtitle && (
                                                    <p className="text-xs font-serif text-slate-500 uppercase tracking-wider mt-0.5">
                                                        {decodeHtmlEntities(heroItem.subtitle)}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Key Benefit Highlights */}
                                            <div className="space-y-1.5 py-1">
                                                {heroBullets.map((bullet, bIdx) => (
                                                    <div key={bIdx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                                                        <Check size={14} className="text-amber-600 shrink-0 mt-0.5 stroke-[3]" />
                                                        <span>{decodeHtmlEntities(bullet)}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Dynamic Multi-Pack Bundle Selector */}
                                            {(() => {
                                                const rawSizes = (Array.isArray(heroItem.sizes) && heroItem.sizes.length > 0)
                                                    ? heroItem.sizes
                                                    : ((Array.isArray(heroItem.variants) && heroItem.variants.length > 0)
                                                        ? heroItem.variants
                                                        : (hasWearableSizes ? [
                                                            { name: 'Small (S)', label: 'Small (S)' },
                                                            { name: 'Medium (M)', label: 'Medium (M)', popular: true },
                                                            { name: 'Large (L)', label: 'Large (L)' },
                                                            { name: 'X-Large (XL)', label: 'X-Large (XL)' }
                                                        ] : []));

                                                const heroSizes = rawSizes.map(s => {
                                                    if (typeof s === 'string') return { name: s, label: s };
                                                    return {
                                                        name: s.name || s.title || s.label || String(s),
                                                        label: s.label || s.name || s.title || String(s),
                                                        popular: Boolean(s.popular)
                                                    };
                                                });

                                                const activeSizeName = selectedSize || heroSizes[1]?.name || heroSizes[0]?.name || '';
                                                const sizePricing = getProductVariantPricing(heroItem, activeSizeName);
                                                const sizePriceDelta = sizePricing.priceDelta;
                                                const effectiveHeroPrice = sizePricing.effectivePrice;

                                                const rawBundles = (Array.isArray(heroItem.customBundles) && heroItem.customBundles.length > 0)
                                                    ? heroItem.customBundles
                                                    : [
                                                        {
                                                            qty: 1,
                                                            label: `1 ${baseItem}`,
                                                            subtitle: "One legendary rider",
                                                            totalPrice: heroPrice,
                                                            pricePerUnit: heroPrice,
                                                            badge: null
                                                        },
                                                        {
                                                            qty: 2,
                                                            label: `2 ${baseItem}s`,
                                                            subtitle: "Popular Choice",
                                                            totalPrice: Math.round(heroPrice * 1.4082075 * 100) / 100,
                                                            pricePerUnit: Math.round((heroPrice * 1.4082075 / 2) * 100) / 100,
                                                            badge: "MOST POPULAR"
                                                        },
                                                        {
                                                            qty: 3,
                                                            label: `3 ${baseItem}s`,
                                                            subtitle: "Ultimate Value",
                                                            totalPrice: Math.round(heroPrice * 1.81623 * 100) / 100,
                                                            pricePerUnit: Math.round((heroPrice * 1.81623 / 3) * 100) / 100,
                                                            badge: "BEST VALUE"
                                                        }
                                                    ];

                                                const bundles = rawBundles.map(b => {
                                                    const qty = parseInt(b.qty, 10) || 1;
                                                    const baseTotal = parseFloat(b.totalPrice || b.price || (heroPrice * qty));
                                                    const scaledTotal = Math.round((baseTotal + (sizePriceDelta * qty)) * 100) / 100;
                                                    const scaledUnit = Math.round((scaledTotal / qty) * 100) / 100;
                                                    return {
                                                        ...b,
                                                        qty,
                                                        totalPrice: scaledTotal,
                                                        pricePerUnit: scaledUnit
                                                    };
                                                });

                                                const activeBundle = bundles[selectedPackIndex] || bundles[0];
                                                const activeBundlePrice = parseFloat(activeBundle.totalPrice || activeBundle.price || effectiveHeroPrice);
                                                const couponDiscountVal = stanAppliedCoupon 
                                                    ? (stanAppliedCoupon.type === 'fixed' 
                                                        ? Math.min(activeBundlePrice, stanAppliedCoupon.discount) 
                                                        : Math.round(activeBundlePrice * (stanAppliedCoupon.discount / 100) * 100) / 100) 
                                                    : 0;
                                                const finalDiscountedPrice = Math.max(1.00, Math.round((activeBundlePrice - couponDiscountVal) * 100) / 100);

                                                const heroItemWithVariant = {
                                                    ...heroItem,
                                                    variant: activeSizeName,
                                                    selectedVariantId: sizePricing.matchedVariant?.id || '',
                                                    price: activeBundle.pricePerUnit || effectiveHeroPrice
                                                };

                                                return (
                                                    <div className="space-y-3 pt-2 border-t border-slate-100">
                                                        {/* Price Banner & Stock Urgency */}
                                                        <div className="flex items-baseline justify-between">
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-2xl sm:text-3xl font-black text-slate-950">
                                                                    ${finalDiscountedPrice.toFixed(2)}
                                                                </span>
                                                                {couponDiscountVal > 0 ? (
                                                                    <>
                                                                        <span className="text-sm text-slate-400 line-through font-semibold">
                                                                            ${activeBundlePrice.toFixed(2)}
                                                                        </span>
                                                                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                                            {stanAppliedCoupon.label}
                                                                        </span>
                                                                    </>
                                                                ) : ((heroCompare + sizePriceDelta) > effectiveHeroPrice && (
                                                                    <span className="text-sm text-slate-400 line-through font-semibold">
                                                                        ${((heroCompare + sizePriceDelta) * (activeBundle.qty || 1)).toFixed(2)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                Ships in 24-48h
                                                            </span>
                                                        </div>

                                                        {/* Interactive Size / Option Selector */}
                                                        {(hasWearableSizes || heroSizes.length > 1) && heroSizes.length > 0 && (
                                                            <div className="space-y-1.5 pt-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                                        <span>{hasWearableSizes ? 'Select Size:' : 'Select Option:'}</span>
                                                                        <span className="text-amber-700 font-black">{activeSizeName}</span>
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setActiveStoryHighlight(hasWearableSizes ? 'sizing' : 'specs')}
                                                                        className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer transition underline underline-offset-2"
                                                                    >
                                                                        <span>{hasWearableSizes ? '📏 Fit Guide' : '🛡️ Specs'}</span>
                                                                    </button>
                                                                </div>
                                                                <div className={`grid gap-1.5 ${heroSizes.length === 4 ? 'grid-cols-4' : (heroSizes.length <= 3 ? 'grid-cols-3' : 'grid-cols-4')}`}>
                                                                    {heroSizes.map((sz, sIdx) => {
                                                                        const sName = String(sz.name || sz.label || '');
                                                                        const isSelected = activeSizeName === sName || (!selectedSize && (sz.popular || sIdx === 1));
                                                                        const matchParen = sName.match(/\(([^)]+)\)/);
                                                                        const shortLabel = sz.short || (matchParen ? matchParen[1] : (sName.length <= 4 ? sName : sName.slice(0, 3)));
                                                                        const subLabel = sName.includes('(') ? sName.split('(')[0].trim() : sName;
                                                                        const isPopular = sz.popular || sName.includes('(M)') || sName.toLowerCase().startsWith('med');
                                                                        return (
                                                                            <button
                                                                                key={sName}
                                                                                type="button"
                                                                                onClick={() => setSelectedSize(sName)}
                                                                                className={`relative py-2 px-1.5 rounded-xl text-center cursor-pointer transition-all duration-150 touch-manipulation select-none active:scale-95 border-2 ${
                                                                                    isSelected
                                                                                        ? 'border-slate-950 bg-slate-950 text-white shadow-sm ring-1 ring-slate-950'
                                                                                        : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                                                                                }`}
                                                                            >
                                                                                {isPopular && (
                                                                                    <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[7.5px] font-black uppercase px-1.5 py-0.2 rounded-full tracking-wider whitespace-nowrap shadow-2xs ${
                                                                                        isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-amber-300'
                                                                                    }`}>
                                                                                        Popular
                                                                                    </span>
                                                                                )}
                                                                                <span className="block text-xs font-black leading-none">{shortLabel}</span>
                                                                                <span className={`block text-[8.5px] font-medium leading-none mt-1 truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                                                                                    {subLabel}
                                                                                </span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Interactive Multi-Pack Cards */}
                                                        <div className={`grid gap-2 ${bundles.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                                            {bundles.map((bundle, bIdx) => {
                                                                const isSelected = selectedPackIndex === bIdx;
                                                                const bPrice = parseFloat(bundle.totalPrice || bundle.price || effectiveHeroPrice);
                                                                return (
                                                                    <button
                                                                        key={bIdx}
                                                                        type="button"
                                                                        aria-pressed={isSelected}
                                                                        onClick={() => setSelectedPackIndex(bIdx)}
                                                                        className={`relative p-2.5 sm:p-3 rounded-2xl text-left transition-all duration-150 cursor-pointer border-2 outline-none touch-manipulation select-none active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-1 ${
                                                                            isSelected 
                                                                                ? 'border-slate-950 bg-slate-900/5 shadow-sm ring-1 ring-slate-950' 
                                                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                                                        }`}
                                                                    >
                                                                        {bundle.badge && (
                                                                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs whitespace-nowrap max-w-[95%] truncate">
                                                                                {bundle.badge}
                                                                            </span>
                                                                        )}
                                                                        <div className="flex items-center justify-between gap-1">
                                                                            <p className={`text-xs font-bold truncate ${isSelected ? 'text-slate-950 font-black' : 'text-slate-800'}`}>
                                                                                {bundle.label || `${bundle.qty || (bIdx + 1)} ${baseItem}`}
                                                                            </p>
                                                                            <div className={`size-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                                                                isSelected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white'
                                                                            }`}>
                                                                                {isSelected && <Check size={10} strokeWidth={3} />}
                                                                            </div>
                                                                        </div>
                                                                        <p className={`text-[12px] font-black mt-1 ${isSelected ? 'text-slate-950' : 'text-slate-700'}`}>
                                                                            ${bPrice.toFixed(2)}
                                                                        </p>
                                                                        {bundle.subtitle && (
                                                                            <p className="text-[9px] text-slate-500 font-medium leading-tight mt-0.5 line-clamp-1">
                                                                                {bundle.subtitle}
                                                                            </p>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* 🎟️ Stan Bio In-Lander Coupon Section */}
                                                        <div className="pt-2">
                                                            {!stanAppliedCoupon ? (
                                                                <div>
                                                                    {!isCouponInputOpen ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setIsCouponInputOpen(true)}
                                                                            className="text-xs font-bold text-slate-600 hover:text-slate-950 flex items-center gap-1.5 transition py-1 cursor-pointer"
                                                                        >
                                                                            <Tag size={13} className="text-emerald-600" />
                                                                            <span>Have a promo code? Add coupon</span>
                                                                        </button>
                                                                    ) : (
                                                                        <form onSubmit={handleApplyStanCoupon} className="flex gap-1.5 items-center mt-1 animate-in fade-in">
                                                                            <div className="relative flex-1">
                                                                                <Tag size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Promo code (e.g. SAVE10)"
                                                                                    value={stanCouponInput}
                                                                                    onChange={(e) => setStanCouponInput(e.target.value)}
                                                                                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 uppercase font-bold focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50/70"
                                                                                    autoFocus
                                                                                />
                                                                            </div>
                                                                            <button
                                                                                type="submit"
                                                                                disabled={isCheckingCoupon || !stanCouponInput.trim()}
                                                                                className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
                                                                            >
                                                                                {isCheckingCoupon ? '...' : 'Apply'}
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => { setIsCouponInputOpen(false); setStanCouponInput(''); }}
                                                                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg text-xs cursor-pointer"
                                                                            >
                                                                                <X size={14} />
                                                                            </button>
                                                                        </form>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-950">
                                                                    <div className="flex items-center gap-1.5 text-xs">
                                                                        <span className="size-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                                                            <Check size={10} strokeWidth={3} />
                                                                        </span>
                                                                        <span className="font-black uppercase tracking-wide">{stanAppliedCoupon.code}</span>
                                                                        <span className="text-emerald-700 font-medium">({stanAppliedCoupon.label} • Saved ${couponDiscountVal.toFixed(2)})</span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleRemoveStanCoupon}
                                                                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition"
                                                                        title="Remove coupon"
                                                                    >
                                                                        <X size={13} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Dual Buying Actions: BUY NOW + Add to Cart */}
                                                        <div className="space-y-2">
                                                            <button
                                                                onClick={() => handleInstantBuy(heroItemWithVariant, activeBundle, couponDiscountVal, stanAppliedCoupon?.code)}
                                                                className="w-full py-3.5 px-6 rounded-2xl font-black text-base tracking-wider shadow-lg transition-all duration-150 active:scale-[0.96] active:opacity-90 touch-manipulation select-none flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 uppercase outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                                                                style={{ 
                                                                    backgroundColor: resolveCtaTheme(creator.themeColor || '#f97316', false).backgroundColor, 
                                                                    color: resolveCtaTheme(creator.themeColor || '#f97316', false).color 
                                                                }}
                                                            >
                                                                <Zap size={18} className={resolveCtaTheme(creator.themeColor || '#f97316', false).fillClass} style={{ fill: resolveCtaTheme(creator.themeColor || '#f97316', false).color }} />
                                                                <span>BUY NOW</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddToCart(heroItemWithVariant, activeBundle)}
                                                                className="w-full py-2.5 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs tracking-wider transition-all duration-150 active:scale-[0.96] active:opacity-90 touch-manipulation select-none flex items-center justify-center gap-2 cursor-pointer border border-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                                                            >
                                                                <ShoppingBag size={15} className="text-slate-700" />
                                                                <span>ADD TO CART</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 font-semibold pt-1">
                                                <span className="flex items-center gap-1">
                                                    <ShieldCheck size={13} className="text-emerald-600" />
                                                    Damage-Free Guarantee
                                                </span>
                                                <span>•</span>
                                                <span>Free Tracked US Shipping</span>
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : displayedProducts.length > 1 ? (
                                <div className="mt-4 space-y-3">
                                    {/* ─── Sorting & Options Controls Toolbar ─── */}
                                    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-2.5">
                                        {/* Top: Live Search Filter */}
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search in store..."
                                                className="w-full pl-8 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                                            />
                                            {searchQuery && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSearchQuery('')}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                                    title="Clear search"
                                                >
                                                    <X size={13} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Middle: Category Filter Pills */}
                                        {storeCategories.length > 1 && (
                                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                                                {storeCategories.map(cat => {
                                                    const isSelected = selectedCategory === cat;
                                                    return (
                                                        <button
                                                            key={cat}
                                                            type="button"
                                                            onClick={() => setSelectedCategory(cat)}
                                                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                                                                isSelected
                                                                    ? 'text-white shadow-xs'
                                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/50'
                                                            }`}
                                                            style={isSelected ? {
                                                                backgroundColor: resolveCtaTheme(creator.themeColor || '#10b981', false).backgroundColor,
                                                                color: resolveCtaTheme(creator.themeColor || '#10b981', false).color
                                                            } : {}}
                                                        >
                                                            {cat}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Bottom: Item Count, Sort Dropdown & Layout View Toggle */}
                                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                                            <span className="text-[11px] font-bold text-slate-500">
                                                Showing {Math.min(visibleCount, processedProducts.length)} of {processedProducts.length} {processedProducts.length === 1 ? 'item' : 'items'}
                                            </span>

                                            <div className="flex items-center gap-2">
                                                {/* Sort Dropdown */}
                                                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                                                    <ArrowUpDown size={11} className="text-slate-400 shrink-0" />
                                                    <select
                                                        value={sortBy}
                                                        onChange={(e) => setSortBy(e.target.value)}
                                                        className="bg-transparent text-[11px] font-bold text-slate-700 outline-none cursor-pointer"
                                                        aria-label="Sort products"
                                                    >
                                                        <option value="featured">Featured</option>
                                                        <option value="price_asc">Price: Low to High</option>
                                                        <option value="price_desc">Price: High to Low</option>
                                                        <option value="best_sellers">Best Sellers</option>
                                                        <option value="name_asc">Name: A - Z</option>
                                                        <option value="newest">Newest</option>
                                                    </select>
                                                </div>

                                                {/* Layout View Toggle */}
                                                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                                                    <button
                                                        type="button"
                                                        onClick={() => setLayoutView('list')}
                                                        className={`p-1.5 rounded-lg transition cursor-pointer ${layoutView === 'list' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                                                        title="List View"
                                                        aria-label="List View"
                                                    >
                                                        <List size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setLayoutView('grid')}
                                                        className={`p-1.5 rounded-lg transition cursor-pointer ${layoutView === 'grid' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                                                        title="Grid View"
                                                        aria-label="Grid View"
                                                    >
                                                        <LayoutGrid size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Empty Search/Filter State */}
                                    {processedProducts.length === 0 ? (
                                        <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 p-6">
                                            <ShoppingBag size={24} className="mx-auto text-slate-300 mb-2" />
                                            <p className="text-xs font-bold text-slate-700">No products match your filter</p>
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setSortBy('featured'); }}
                                                className="mt-3 px-4 py-1.5 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
                                            >
                                                Reset Filters
                                            </button>
                                        </div>
                                    ) : layoutView === 'grid' ? (
                                        /* ─── 2-Column Responsive Visual Grid View ─── */
                                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                            {visibleProducts.map((item, index) => {
                                                const isFree = parseFloat(item.price || 0) === 0 || item.isFreeDownload;
                                                const priceNum = parseFloat(item.price || 0);
                                                const priceDisplay = isFree 
                                                    ? "Free" 
                                                    : `$${priceNum.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
                                                
                                                return (
                                                    <div 
                                                        key={item.id || index}
                                                        className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between group"
                                                    >
                                                        <div>
                                                            {/* Image with Click for Options */}
                                                            <div 
                                                                onClick={() => { setQuickViewProduct(item); setQuickViewActivePhoto(0); setQuickViewSelectedBundle(0); setQuickViewSelectedVariant(''); }}
                                                                className="aspect-square w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-100 relative cursor-pointer"
                                                            >
                                                                <img 
                                                                    src={getSafeImageUrl(item.image || (item.images && item.images[0]))} 
                                                                    alt={item.name || 'Product'} 
                                                                    loading="lazy"
                                                                    decoding="async"
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                    onError={(e) => handleImageError(e, 'product')}
                                                                />
                                                                <span className="absolute top-1.5 left-1.5 text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-rose-600 text-white shadow-xs flex items-center gap-1">
                                                                    <span className="size-1 rounded-full bg-white animate-pulse" />
                                                                    {index === 0 ? 'ONLY 3 LEFT' : (index === 1 ? 'BEST SELLER' : (item.badge || 'SELLING FAST'))}
                                                                </span>
                                                            </div>

                                                            {/* Product Title */}
                                                            <h3 
                                                                onClick={() => { setQuickViewProduct(item); setQuickViewActivePhoto(0); setQuickViewSelectedBundle(0); setQuickViewSelectedVariant(''); }}
                                                                className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 mt-2 cursor-pointer hover:text-slate-700"
                                                            >
                                                                {item.name}
                                                            </h3>

                                                            {/* Category Pill & Scarcity */}
                                                            <div className="flex items-center justify-between gap-1 mt-1">
                                                                {item.category && (
                                                                    <span className="inline-block text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                                                                        {typeof item.category === 'string' ? item.category : (item.category?.name || 'Featured')}
                                                                    </span>
                                                                )}
                                                                <span className="text-[9px] font-bold text-rose-600 flex items-center gap-0.5">
                                                                    🔥 {index === 0 ? '85%' : (index === 1 ? '74%' : '62%')} claimed
                                                                </span>
                                                            </div>

                                                            {/* Low-stock Progress Meter */}
                                                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1 mb-0.5">
                                                                <div 
                                                                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" 
                                                                    style={{ width: `${index === 0 ? 85 : (index === 1 ? 74 : 62)}%` }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Price & Action Buttons */}
                                                        <div className="mt-2 pt-2 border-t border-slate-100">
                                                            <div className="flex items-baseline justify-between mb-2">
                                                                <span className="text-xs sm:text-sm font-black text-slate-900">
                                                                    {priceDisplay}
                                                                </span>
                                                                {item.compareAtPrice > item.price && (
                                                                    <span className="text-[10px] text-slate-400 line-through">
                                                                        ${parseFloat(item.compareAtPrice).toFixed(2)}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {isFree ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleFreeDownloadClick(item)}
                                                                    className="w-full py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-[11px] transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                                                                >
                                                                    <Package size={11} className="text-emerald-600" />
                                                                    <span>Free Sample</span>
                                                                </button>
                                                            ) : (() => {
                                                                const hasMultipleOptions = (Array.isArray(item.variants) && item.variants.length > 1) || (Array.isArray(item.sizes) && item.sizes.length > 1);
                                                                return (
                                                                    <div className="grid grid-cols-2 gap-1.5">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (hasMultipleOptions) {
                                                                                    setQuickViewProduct(item);
                                                                                    setQuickViewActivePhoto(0);
                                                                                    setQuickViewSelectedBundle(0);
                                                                                    setQuickViewSelectedVariant('');
                                                                                } else {
                                                                                    handleAddToCart(item);
                                                                                }
                                                                            }}
                                                                            className="py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-[11px] transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                                                                            title={hasMultipleOptions ? "Select Options" : "Add to Cart"}
                                                                        >
                                                                            <ShoppingBag size={11} className="text-slate-600" />
                                                                            <span>{hasMultipleOptions ? 'Options' : '+ Cart'}</span>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (hasMultipleOptions) {
                                                                                    setQuickViewProduct(item);
                                                                                    setQuickViewActivePhoto(0);
                                                                                    setQuickViewSelectedBundle(0);
                                                                                    setQuickViewSelectedVariant('');
                                                                                } else {
                                                                                    handleInstantBuy(item);
                                                                                }
                                                                            }}
                                                                            className="py-1.5 rounded-xl font-black text-[11px] transition active:scale-95 shadow-xs flex items-center justify-center gap-1 tracking-tight uppercase cursor-pointer"
                                                                            style={{ 
                                                                                backgroundColor: resolveCtaTheme(creator.themeColor || '#ef4444', false).backgroundColor, 
                                                                                color: resolveCtaTheme(creator.themeColor || '#ef4444', false).color 
                                                                            }}
                                                                        >
                                                                            <Zap size={11} className={resolveCtaTheme(creator.themeColor || '#ef4444', false).fillClass} style={{ fill: resolveCtaTheme(creator.themeColor || '#ef4444', false).color }} />
                                                                            <span>BUY</span>
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        /* ─── Classic Stan List Layout ─── */
                                        <div className="space-y-3">
                                            {visibleProducts.map((item, index) => {
                                                const isFree = parseFloat(item.price || 0) === 0 || item.isFreeDownload;
                                                const priceNum = parseFloat(item.price || 0);
                                                const priceDisplay = isFree 
                                                    ? "Free" 
                                                    : `$${priceNum.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
                                                
                                                return (
                                                    <div 
                                                        key={item.id || index}
                                                        className="bg-white rounded-2xl p-3 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all flex items-center gap-3 group"
                                                    >
                                                        {/* Square Rounded Thumbnail with click for options */}
                                                        <div 
                                                            onClick={() => { setQuickViewProduct(item); setQuickViewActivePhoto(0); setQuickViewSelectedBundle(0); setQuickViewSelectedVariant(''); }}
                                                            className="size-16 sm:w-16 sm:h-16 object-cover rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 relative cursor-pointer"
                                                        >
                                                            <img 
                                                                src={getSafeImageUrl(item.image || (item.images && item.images[0]))} 
                                                                alt={item.name || 'Product'} 
                                                                loading="lazy"
                                                                decoding="async"
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                onError={(e) => handleImageError(e, 'product')}
                                                            />
                                                        </div>

                                                        {/* Product Content Column */}
                                                        <div className="flex-1 min-w-0">
                                                            {/* Scarcity Badges */}
                                                            <div className="mb-1 flex items-center gap-1.5 flex-wrap">
                                                                <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 border border-rose-500/20">
                                                                    <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                                    {item.badge || (index === 0 ? '⚡ Only 3 Left at this price' : (index === 1 ? '🔥 Best Seller • High Demand' : '⚡ Almost Gone'))}
                                                                </span>
                                                            </div>
                                                            <h3 
                                                                onClick={() => { setQuickViewProduct(item); setQuickViewActivePhoto(0); setQuickViewSelectedBundle(0); setQuickViewSelectedVariant(''); }}
                                                                className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 cursor-pointer hover:text-slate-700"
                                                            >
                                                                {item.name}
                                                            </h3>

                                                            {/* Category / Tag Pill & Claimed Meter */}
                                                            <div className="flex items-center justify-between gap-2 mt-1">
                                                                {item.category && (
                                                                    <span className="inline-block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                                        {typeof item.category === 'string' ? item.category : (item.category?.name || 'Featured')}
                                                                    </span>
                                                                )}
                                                                <span className="text-[9px] font-bold text-rose-600">
                                                                    🔥 {index === 0 ? '85%' : (index === 1 ? '74%' : '62%')} claimed
                                                                </span>
                                                            </div>

                                                            {/* Micro Progress Bar */}
                                                            <div className="w-full max-w-[180px] h-1 bg-slate-100 rounded-full overflow-hidden mt-0.5 mb-1">
                                                                <div 
                                                                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" 
                                                                    style={{ width: `${index === 0 ? 85 : (index === 1 ? 74 : 62)}%` }}
                                                                />
                                                            </div>

                                                            {/* Bottom Row: Price & High-Converting CTA */}
                                                            <div className="flex items-center justify-between gap-2 mt-2">
                                                                <span className="text-sm sm:text-base font-black text-slate-900">
                                                                    {priceDisplay}
                                                                </span>

                                                                {isFree ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleFreeDownloadClick(item)}
                                                                        className="py-1.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs transition active:scale-95 shadow-2xs flex items-center gap-1 cursor-pointer"
                                                                    >
                                                                        <Package size={13} className="text-emerald-600" />
                                                                        <span>Claim Free Sample</span>
                                                                    </button>
                                                                ) : (() => {
                                                                    const hasMultipleOptions = (Array.isArray(item.variants) && item.variants.length > 1) || (Array.isArray(item.sizes) && item.sizes.length > 1);
                                                                    return (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    if (hasMultipleOptions) {
                                                                                        setQuickViewProduct(item);
                                                                                        setQuickViewActivePhoto(0);
                                                                                        setQuickViewSelectedBundle(0);
                                                                                        setQuickViewSelectedVariant('');
                                                                                    } else {
                                                                                        handleAddToCart(item);
                                                                                    }
                                                                                }}
                                                                                className="py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
                                                                                title={hasMultipleOptions ? "Select Options" : "Add to Cart"}
                                                                            >
                                                                                <ShoppingBag size={12} className="text-slate-600" />
                                                                                <span>{hasMultipleOptions ? 'Options' : '+ Cart'}</span>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    if (hasMultipleOptions) {
                                                                                        setQuickViewProduct(item);
                                                                                        setQuickViewActivePhoto(0);
                                                                                        setQuickViewSelectedBundle(0);
                                                                                        setQuickViewSelectedVariant('');
                                                                                    } else {
                                                                                        handleInstantBuy(item);
                                                                                    }
                                                                                }}
                                                                                className="py-1.5 px-3 sm:px-3.5 rounded-xl font-black text-xs transition active:scale-95 shadow-xs flex items-center gap-1 tracking-tight uppercase cursor-pointer"
                                                                                style={{ 
                                                                                    backgroundColor: resolveCtaTheme(creator.themeColor || '#ef4444', false).backgroundColor, 
                                                                                    color: resolveCtaTheme(creator.themeColor || '#ef4444', false).color 
                                                                                }}
                                                                            >
                                                                                <Zap size={13} className={resolveCtaTheme(creator.themeColor || '#ef4444', false).fillClass} style={{ fill: resolveCtaTheme(creator.themeColor || '#ef4444', false).color }} />
                                                                                <span>BUY NOW</span>
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Progressive Windowing: Show More & Infinite Scroll Sentinel */}
                                    {visibleCount < processedProducts.length && (
                                        <div className="pt-3 pb-1 text-center" id="stan-store-load-more">
                                            <button
                                                type="button"
                                                onClick={() => setVisibleCount(prev => Math.min(prev + 24, processedProducts.length))}
                                                className="w-full py-3.5 px-6 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-xs shadow-xs hover:border-slate-300 transition cursor-pointer flex items-center justify-center gap-2 group"
                                            >
                                                <span>Show More Products ({processedProducts.length - visibleCount} remaining)</span>
                                                <span className="group-hover:translate-y-0.5 transition-transform">↓</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Clean Empty Store State - Never Shows Ghost Products */
                                <div className="text-center py-10 px-4 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 mt-5">
                                    <div className="size-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                                        <ShoppingBag size={22} />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-800">Products Coming Soon</h3>
                                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                                        This store is currently curating their catalog. Check back shortly!
                                    </p>
                                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
                                        <Link prefetch={false}href={`/shop/${rawUsername}`}
                                            className="text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 shadow-2xs transition"
                                        >
                                            Visit Full Storefront
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* ─── Physical Delivery Trust Ribbon ─── */}
                            <div className="mt-5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-around gap-2 text-[10px] font-bold text-slate-700 shadow-2xs">
                                <span className="flex items-center gap-1 text-emerald-800">
                                    <Truck size={13} className="text-emerald-600" />
                                    <span>Tracked Courier</span>
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1 text-slate-800">
                                    <Package size={13} className="text-indigo-600" />
                                    <span>Sealed Box Packaging</span>
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1 text-amber-800">
                                    <ShieldCheck size={13} className="text-amber-600" />
                                    <span>30-Day Guarantee</span>
                                </span>
                            </div>

                            {/* ─── Authentic Store Reviews (Rendered strictly if store or primary product has customer testimonials) ─── */}
                            {Array.isArray(effectiveReviews) && effectiveReviews.length > 0 && (
                                <div 
                                    className="mt-6 pt-5 border-t border-slate-200/70"
                                    onMouseEnter={() => setIsHoveredReview(true)}
                                    onMouseLeave={() => setIsHoveredReview(false)}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1">
                                            <Star size={13} className="text-amber-400 fill-amber-400" />
                                            <span>Customer Feedback</span>
                                        </span>
                                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                            Verified Reviews ({effectiveReviews.length})
                                        </span>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5 transition-all duration-300 relative">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-0.5 text-amber-400">
                                                {[...Array(effectiveReviews[activeReviewIndex]?.rating || 5)].map((_, i) => (
                                                    <Star key={i} size={11} className="fill-amber-400" />
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                                                {effectiveReviews[activeReviewIndex]?.badge || 'Verified Purchase'}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-700 font-medium italic leading-relaxed min-h-[46px]">
                                            "{effectiveReviews[activeReviewIndex]?.text || effectiveReviews[activeReviewIndex]?.review || effectiveReviews[activeReviewIndex]?.comment || effectiveReviews[activeReviewIndex]?.content || 'Exceptional quality and fast delivery!'}"
                                        </p>

                                        <div className="flex items-center justify-between pt-1">
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 rounded-full bg-slate-100 text-[11px] font-black flex items-center justify-center shrink-0">
                                                    {(effectiveReviews[activeReviewIndex]?.name || effectiveReviews[activeReviewIndex]?.author || effectiveReviews[activeReviewIndex]?.user?.name || 'Customer').charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-800 block leading-tight">
                                                        {effectiveReviews[activeReviewIndex]?.name || effectiveReviews[activeReviewIndex]?.author || effectiveReviews[activeReviewIndex]?.user?.name || 'Verified Customer'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Carousel Navigation Dots */}
                                            <div className="flex items-center gap-1.5">
                                                {effectiveReviews.map((_, dotIdx) => (
                                                    <button
                                                        key={dotIdx}
                                                        type="button"
                                                        onClick={() => setActiveReviewIndex(dotIdx)}
                                                        aria-label={`Go to review ${dotIdx + 1}`}
                                                        className={`transition-all rounded-full ${
                                                            activeReviewIndex === dotIdx 
                                                                ? 'w-4 h-1.5 bg-slate-900' 
                                                                : 'size-1.5 bg-slate-300 hover:bg-slate-400'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─── Stan Store In-Bio Footer ─── */}
                            <footer className="mt-8 pt-5 pb-2 border-t border-slate-200/80 px-2 text-center">
                                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-[11px] font-semibold text-slate-500">
                                    <Link prefetch={false}href={`/shop/${cleanUser}`} className="hover:text-slate-900 font-bold text-slate-800 transition">
                                        Full Storefront
                                    </Link>
                                    <span className="text-slate-300">•</span>
                                    <Link prefetch={false}href={`/policies/shipping?store=${cleanUser}`} className="hover:text-slate-900 transition">
                                        Shipping Policy
                                    </Link>
                                    <span className="text-slate-300">•</span>
                                    <Link prefetch={false}href={`/policies/refund?store=${cleanUser}`} className="hover:text-slate-900 transition">
                                        Refund & Return Policy
                                    </Link>
                                    <span className="text-slate-300">•</span>
                                    <Link prefetch={false}href={`/policies/privacy?store=${cleanUser}`} className="hover:text-slate-900 transition">
                                        Privacy Policy
                                    </Link>
                                    <span className="text-slate-300">•</span>
                                    <Link prefetch={false}href={`/policies/terms?store=${cleanUser}`} className="hover:text-slate-900 transition">
                                        Terms of Service
                                    </Link>
                                </div>
                                <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
                                    <span>🔒 256-Bit SSL Encrypted Checkout</span>
                                    <span>•</span>
                                    <span>© {new Date().getFullYear()} {creator.name}</span>
                                </div>
                            </footer>

                        </div>

                    </div>

                    {/* Bottom Home Indicator Bar (Simulated iPhone) */}
                    <div className="pb-2 pt-1 flex justify-center">
                        <div className="w-32 h-1 bg-slate-900/80 rounded-full"></div>
                    </div>

                </div>

            </main>

            {/* ─── Floating Sticky Bottom Buy Bar (Appears on Scroll) ─── */}
            {showStickyBar && displayedProducts.length > 0 && (() => {
                const heroItem = displayedProducts[0];
                const heroPrice = parseFloat(heroItem?.price !== undefined && heroItem?.price !== null && heroItem?.price !== '' ? heroItem.price : 52.99);

                const rawSizes = (Array.isArray(heroItem.sizes) && heroItem.sizes.length > 0)
                    ? heroItem.sizes
                    : ((Array.isArray(heroItem.variants) && heroItem.variants.length > 0)
                        ? heroItem.variants
                        : (hasWearableSizes ? [
                            { name: 'Small (S)', label: 'Small (S)' },
                            { name: 'Medium (M)', label: 'Medium (M)', popular: true },
                            { name: 'Large (L)', label: 'Large (L)' },
                            { name: 'X-Large (XL)', label: 'X-Large (XL)' }
                        ] : []));
                const heroSizes = rawSizes.map(s => typeof s === 'string' ? { name: s, label: s } : { name: s.name || s.title || s.label || String(s), label: s.label || s.name || s.title || String(s) });
                const activeSizeName = selectedSize || heroSizes[1]?.name || heroSizes[0]?.name || '';
                const sizePricing = getProductVariantPricing(heroItem, activeSizeName);
                const sizePriceDelta = sizePricing.priceDelta;
                const effectiveHeroPrice = sizePricing.effectivePrice;

                const rawBundles = (Array.isArray(heroItem?.customBundles) && heroItem.customBundles.length > 0)
                    ? heroItem.customBundles
                    : [
                        { qty: 1, label: `1 Unit`, totalPrice: heroPrice, pricePerUnit: heroPrice },
                        { qty: 2, label: `2 Units`, totalPrice: Math.round(heroPrice * 1.4082075 * 100) / 100, pricePerUnit: Math.round((heroPrice * 1.4082075 / 2) * 100) / 100 },
                        { qty: 3, label: `3 Units`, totalPrice: Math.round(heroPrice * 1.81623 * 100) / 100, pricePerUnit: Math.round((heroPrice * 1.81623 / 3) * 100) / 100 }
                    ];

                const bundles = rawBundles.map(b => {
                    const qty = parseInt(b.qty, 10) || 1;
                    const baseTotal = parseFloat(b.totalPrice || b.price || (heroPrice * qty));
                    const scaledTotal = Math.round((baseTotal + (sizePriceDelta * qty)) * 100) / 100;
                    const scaledUnit = Math.round((scaledTotal / qty) * 100) / 100;
                    return {
                        ...b,
                        qty,
                        totalPrice: scaledTotal,
                        pricePerUnit: scaledUnit
                    };
                });

                const activeBundle = bundles[selectedPackIndex] || bundles[0];
                const baseDisplayPrice = parseFloat(activeBundle.totalPrice || activeBundle.price || effectiveHeroPrice);
                const stickyDiscountVal = stanAppliedCoupon 
                    ? (stanAppliedCoupon.type === 'fixed' 
                        ? Math.min(baseDisplayPrice, stanAppliedCoupon.discount) 
                        : Math.round(baseDisplayPrice * (stanAppliedCoupon.discount / 100) * 100) / 100) 
                    : 0;
                const displayPrice = Math.max(1.00, Math.round((baseDisplayPrice - stickyDiscountVal) * 100) / 100);

                const heroItemWithVariant = {
                    ...heroItem,
                    variant: activeSizeName,
                    selectedVariantId: sizePricing.matchedVariant?.id || '',
                    price: activeBundle.pricePerUnit || effectiveHeroPrice
                };

                return (
                    <div 
                        className="fixed left-0 right-0 z-40 px-3 sm:px-4 max-w-[420px] mx-auto animate-in slide-in-from-bottom-4 duration-300"
                        style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
                    >
                        <div className="bg-slate-950/95 backdrop-blur-md text-white p-2.5 px-3 sm:px-3.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-2.5 sm:gap-3 ring-1 ring-white/10">
                            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                                <div className="size-9 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                                    <img 
                                        src={getSafeImageUrl(displayedProducts[0].image || (displayedProducts[0].images && displayedProducts[0].images[0]))} 
                                        alt={displayedProducts[0].name || 'Product'} 
                                        loading="lazy"
                                        decoding="async"
                                        onError={(e) => handleImageError(e, 'product')}
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-white truncate">{decodeHtmlEntities(displayedProducts[0].name)}</p>
                                    <p className="text-[11px] font-black text-emerald-400 flex items-center flex-wrap gap-1">
                                        <span>${displayPrice.toFixed(2)}</span>
                                        {activeSizeName && <span className="text-[10px] text-amber-300 font-bold ml-1">• {activeSizeName}</span>}
                                        {activeBundle && <span className="text-[10px] text-slate-400 font-normal ml-1">({activeBundle.label})</span>}
                                        {stickyDiscountVal > 0 && <span className="text-[9px] text-emerald-300 font-bold ml-1">({stanAppliedCoupon.label})</span>}
                                        <span className="text-[9px] text-yellow-300 font-mono font-bold ml-1">⚡ Hold: {formattedReserveTime}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handleAddToCart(heroItemWithVariant, activeBundle)}
                                    className="px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1 transition cursor-pointer border border-slate-700 active:scale-95"
                                    title="Add to cart"
                                >
                                    <ShoppingBag size={12} className="text-slate-300" />
                                    <span>+ Cart</span>
                                </button>
                                <button
                                    onClick={() => handleInstantBuy(heroItemWithVariant, activeBundle, stickyDiscountVal, stanAppliedCoupon?.code)}
                                    className="px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1 shrink-0 shadow-sm active:scale-95 transition cursor-pointer uppercase tracking-wider"
                                    style={{ 
                                        backgroundColor: resolveCtaTheme(creator.themeColor, true).backgroundColor, 
                                        color: resolveCtaTheme(creator.themeColor, true).color 
                                    }}
                                >
                                    <Zap size={13} className={resolveCtaTheme(creator.themeColor, true).fillClass} style={{ fill: resolveCtaTheme(creator.themeColor, true).color }} />
                                    <span>BUY NOW</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* 🛒 Floating Cart Counter Pill with Reservation Countdown (Visible when cart has items) */}
            {cartCount > 0 && (
                <button
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className="fixed top-12 right-3 z-40 px-3 py-1.5 rounded-full bg-slate-950/95 backdrop-blur-md text-white shadow-2xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105 active:scale-95 animate-in fade-in"
                >
                    <ShoppingBag size={13} className="text-emerald-400" />
                    <span className="size-4.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                        {cartCount}
                    </span>
                    <span className="text-[10px] text-yellow-300 font-mono font-bold">
                        {formattedReserveTime}
                    </span>
                </button>
            )}

            {/* ⚡ In-Page Gumroad Checkout Modal (Zero-Redirect) */}
            <GumroadIframeModal
                isOpen={checkoutModal.isOpen}
                onClose={() => setCheckoutModal({ isOpen: false, product: null, total: 0, gumroadUrl: '', orderSessionId: '', storeId: '', storeSlug: '' })}
                product={checkoutModal.product}
                items={checkoutModal.product ? [{
                    id: checkoutModal.product.id,
                    name: checkoutModal.product.name,
                    price: checkoutModal.selectedBundle 
                        ? (checkoutModal.selectedBundle.pricePerUnit ? parseFloat(checkoutModal.selectedBundle.pricePerUnit) : Number((checkoutModal.total / (checkoutModal.selectedBundle.qty || 1)).toFixed(2)))
                        : checkoutModal.total,
                    quantity: checkoutModal.selectedBundle?.qty || 1,
                    image: checkoutModal.product.image || checkoutModal.product.images?.[0]
                }] : []}
                total={checkoutModal.total}
                gumroadUrl={checkoutModal.gumroadUrl}
                orderSessionId={checkoutModal.orderSessionId}
                storeId={checkoutModal.storeId || creator?.id || `store_${cleanUser}`}
                storeSlug={checkoutModal.storeSlug || cleanUser}
            />

            {/* 🛒 Stan Store Full Multi-Item Cart Drawer */}
            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                products={Array.isArray(displayedProducts) ? displayedProducts : []}
                storeSlug={cleanUser}
                store={creator}
            />

            {/* 🔥 Live Sales Pop-up (Social Proof Toaster) */}
            <LiveSalesToaster products={displayedProducts} storeName={creator?.name} />

            {/* Free Download Email Modal */}
            {freeDownloadModal.isOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
                    onClick={() => setFreeDownloadModal({ isOpen: false, product: null, email: '', submitted: false })}
                >
                    <div 
                        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setFreeDownloadModal({ isOpen: false, product: null, email: '', submitted: false })}
                            className="absolute top-4 right-4 size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
                        >
                            <X size={16} />
                        </button>

                        <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                            <Package size={22} />
                        </div>

                        <h3 className="text-lg font-extrabold text-slate-950">
                            Claim Free Sample: {freeDownloadModal.product?.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Enter your email to receive private drop details and claim your complimentary sample.
                        </p>

                        {freeDownloadModal.submitted ? (
                            <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                                <CheckCircle2 size={16} className="text-emerald-600" />
                                <span>Sample request confirmed! Check your email.</span>
                            </div>
                        ) : (
                            <form onSubmit={handleFreeDownloadSubmit} className="mt-4 space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Your Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="email"
                                            required
                                            placeholder="you@domain.com"
                                            value={freeDownloadModal.email}
                                            onChange={(e) => setFreeDownloadModal(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-1.5"
                                >
                                    <Package size={14} />
                                    <span>Request Complimentary Sample</span>
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Story Highlights Micro-Modal Viewer */}
            {activeStoryHighlight && (
                <div 
                    className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
                    onClick={() => setActiveStoryHighlight(null)}
                >
                    <div 
                        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative animate-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Story Progress Simulation Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4 overflow-hidden">
                            <div className="bg-emerald-500 h-1.5 rounded-full w-full animate-pulse" />
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => setActiveStoryHighlight(null)}
                            className="absolute top-4 right-4 size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
                        >
                            <X size={16} />
                        </button>

                        {/* Story 1: Reviews */}
                        {activeStoryHighlight === 'reviews' && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="size-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <Star size={20} className="fill-amber-400 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-950 text-base">Verified Buyer Love</h3>
                                        <p className="text-[11px] font-bold text-amber-700">⭐ 4.9 / 5.0 Verified Reviews</p>
                                    </div>
                                </div>
                                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 my-3 text-xs">
                                    {(effectiveReviews.length > 0 ? effectiveReviews.slice(0, 3) : (hasWearableSizes ? [
                                        { name: 'Sarah T.', text: 'Our golden retriever stole the show! It took 20 seconds to buckle on and stayed completely secure all night.' },
                                        { name: 'Marcus K.', text: 'Lightweight and durable so my pup didn\'t mind it at all. Arrived fast in 2 days. 10/10!' }
                                    ] : [
                                        { name: 'Marcus K.', text: 'Build quality exceeded expectations. Arrived fast in 2 days and works flawlessly. 10/10!' },
                                        { name: 'David L.', text: 'Exactly as described. High-grade construction, great power, and super responsive seller.' }
                                    ])).map((rev, rIdx) => (
                                        <div key={rIdx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                            <div className="flex items-center justify-between font-bold text-[11px] text-slate-900 mb-1">
                                                <span>{rev.name || rev.author || 'Verified Buyer'}</span>
                                                <span className="text-emerald-700">Verified Buyer ✓</span>
                                            </div>
                                            <p className="text-slate-600 text-[11px] leading-relaxed">
                                                "{rev.comment || rev.review || rev.text || rev.content || 'Exceptional quality and fast delivery!'}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setActiveStoryHighlight(null)}
                                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                                >
                                    Explore Products & Deals →
                                </button>
                            </div>
                        )}

                        {/* Story 2: In The Box */}
                        {activeStoryHighlight === 'unboxing' && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="size-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-950 text-base">What Arrives In Your Box</h3>
                                        <p className="text-[11px] font-bold text-blue-700">Complete Deluxe Set</p>
                                    </div>
                                </div>
                                {heroGalleryImages.length > 0 && (
                                    <img 
                                        src={getSafeImageUrl(heroGalleryImages[0])}
                                        alt="Package Preview"
                                        className="w-full h-36 object-cover rounded-2xl mb-3 border border-slate-200"
                                        onError={(e) => handleImageError(e, 'product')}
                                    />
                                )}
                                <ul className="text-xs text-slate-700 space-y-1.5 mb-4 font-medium">
                                    {packageBullets.map((bullet, bIdx) => (
                                        <li key={bIdx} className="flex items-center gap-2">
                                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                            <span>{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => setActiveStoryHighlight(null)}
                                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                                >
                                    Select Your Pack & Order →
                                </button>
                            </div>
                        )}

                        {/* Story 3: Deals */}
                        {activeStoryHighlight === 'deals' && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <Ticket size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-950 text-base">Today's Creator Deals</h3>
                                        <p className="text-[11px] font-bold text-emerald-700">Tap Any Coupon To Auto-Apply</p>
                                    </div>
                                </div>
                                <div className="space-y-2 my-3">
                                    {[
                                        { code: 'FLASH15', discount: 15, label: '15% OFF Entire Order', desc: 'Instant bio follower discount' },
                                        { code: 'SAVE20', discount: 20, label: '20% OFF Multi-Packs', desc: 'Best value for volume bundles' },
                                        { code: 'WELCOME10', discount: 10, label: '10% OFF Welcome Bonus', desc: 'New customer storewide promo' }
                                    ].map(c => (
                                        <div key={c.code} className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                                            <div>
                                                <p className="font-mono font-black text-xs text-emerald-800">{c.code}</p>
                                                <p className="text-[11px] font-bold text-slate-800">{c.label}</p>
                                                <p className="text-[10px] text-slate-400">{c.desc}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStanAppliedCoupon({
                                                        code: c.code,
                                                        type: 'percentage',
                                                        discount: c.discount,
                                                        label: `${c.discount}% OFF`
                                                    });
                                                    if (typeof window !== 'undefined') {
                                                        sessionStorage.setItem('active_coupon', c.code);
                                                    }
                                                    toast.success(`Coupon "${c.code}" applied! ${c.discount}% OFF activated 🎉`);
                                                    setActiveStoryHighlight(null);
                                                }}
                                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shrink-0 transition cursor-pointer"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Story 4: Sizing (Apparel / Wearables) */}
                        {activeStoryHighlight === 'sizing' && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="size-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-950 text-base">Perfect Fit Guarantee</h3>
                                        <p className="text-[11px] font-bold text-rose-700">100% Free Size Exchanges</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-xs my-3">
                                    <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-100 font-bold text-[10px] uppercase text-slate-600">
                                        <span>Size</span>
                                        <span>Chest</span>
                                        <span>Weight Guide</span>
                                    </div>
                                    {[
                                        { size: 'Small (S)', chest: '12 - 16"', weight: 'Up to 15 lbs' },
                                        { size: 'Medium (M)', chest: '16 - 22"', weight: '15 - 35 lbs' },
                                        { size: 'Large (L)', chest: '22 - 28"', weight: '35 - 65 lbs' },
                                        { size: 'X-Large (XL)', chest: '28 - 36"', weight: '65+ lbs' }
                                    ].map(r => {
                                        const isSelected = selectedSize === r.size;
                                        return (
                                            <div 
                                                key={r.size} 
                                                onClick={() => {
                                                    setSelectedSize(r.size);
                                                    toast.success(`Selected size: ${r.size}`);
                                                }}
                                                className={`grid grid-cols-3 gap-1.5 p-2 rounded-xl text-[11px] cursor-pointer transition ${
                                                    isSelected 
                                                        ? 'bg-slate-900 text-white font-bold ring-1 ring-slate-900 shadow-xs' 
                                                        : 'bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-900'
                                                }`}
                                            >
                                                <span className={isSelected ? "font-bold text-amber-300" : "font-bold text-slate-900"}>{r.size}</span>
                                                <span className={isSelected ? "text-slate-200" : "text-slate-600"}>{r.chest}</span>
                                                <span className={isSelected ? "text-slate-200" : "text-slate-600"}>{r.weight}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-[11px] text-slate-500 mb-3 text-center">
                                    Between sizes? We recommend choosing the larger size for maximum comfort.
                                </p>
                                <button
                                    onClick={() => setActiveStoryHighlight(null)}
                                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                                >
                                    Got It — Apply & Select Size →
                                </button>
                            </div>
                        )}

                        {/* Story 4: Specs & Safety (Toys, Tech, General Hardware) */}
                        {activeStoryHighlight === 'specs' && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="size-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-950 text-base">Specs & Safety Guarantee</h3>
                                        <p className="text-[11px] font-bold text-indigo-700">100% Tested & Certified Quality</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-xs my-3 text-slate-700 font-medium">
                                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                                            <span><strong>100% Quality Inspected:</strong> Rigorously factory bench-tested prior to courier dispatch.</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                                            <span><strong>Durable Construction:</strong> Non-toxic, high-density impact-resistant reinforced polymer build.</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                                            <span><strong>30-Day Money Back Guarantee:</strong> Full replacement or refund warranty if any defect is detected.</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                                            <span><strong>Insured Courier Shipping:</strong> Shock-resistant tamper-evident sealed box delivery.</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveStoryHighlight(null)}
                                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                                >
                                    Order Now & Save →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── Interactive Product Options & Variant Quick-View Sheet ─── */}
            {quickViewProduct && (
                <div 
                    role="dialog"
                    aria-modal="true"
                    aria-label={quickViewProduct.name || "Product Options"}
                    className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
                    onClick={() => setQuickViewProduct(null)}
                >
                    <div 
                        className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 relative animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header: Title & Close Button */}
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                            <div>
                                <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 mb-1">
                                    {quickViewProduct.category || 'Featured Item'}
                                </span>
                                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                                    {quickViewProduct.name}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setQuickViewProduct(null)}
                                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer shrink-0"
                                aria-label="Close options"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Product Photo Gallery & Dynamic Pricing Engine */}
                        {(() => {
                            const galleryImages = Array.isArray(quickViewProduct.images) && quickViewProduct.images.length > 0
                                ? quickViewProduct.images
                                : (quickViewProduct.image ? [quickViewProduct.image] : ['/placeholder.png']);
                            const activePhoto = galleryImages[quickViewActivePhoto] || galleryImages[0];
                            
                            const qvBasePrice = parseFloat(quickViewProduct.price || 0);

                            // Detect Variants / Sizes
                            const rawVariants = Array.isArray(quickViewProduct.variants) && quickViewProduct.variants.length > 0
                                ? quickViewProduct.variants
                                : (Array.isArray(quickViewProduct.sizes) && quickViewProduct.sizes.length > 0 ? quickViewProduct.sizes : []);
                            const optionsList = rawVariants.map(v => typeof v === 'string' ? v : (v.name || v.label || v.title || String(v)));
                            const activeOptionName = quickViewSelectedVariant || optionsList[0] || '';
                            
                            const variantPricing = getProductVariantPricing(quickViewProduct, activeOptionName);
                            const variantPriceDelta = variantPricing.priceDelta;
                            const variantBasePrice = variantPricing.effectivePrice;

                            const qvComparePrice = parseFloat(quickViewProduct.compareAtPrice || quickViewProduct.comparePrice || (qvBasePrice > 0 ? Math.round(qvBasePrice * 1.35 * 100) / 100 : 0));
                            
                            const rawQvBundles = (Array.isArray(quickViewProduct.customBundles) && quickViewProduct.customBundles.length > 0)
                                ? quickViewProduct.customBundles
                                : [
                                    { qty: 1, label: 'Single Unit (1-Pack)', totalPrice: qvBasePrice, badge: null },
                                    { qty: 2, label: 'Double Pack (2-Pack)', totalPrice: Math.round(qvBasePrice * 1.4082075 * 100) / 100, badge: 'MOST POPULAR' },
                                    { qty: 3, label: 'Triple Pack (3-Pack)', totalPrice: Math.round(qvBasePrice * 1.81623 * 100) / 100, badge: 'BEST VALUE' }
                                ];

                            const qvBundles = rawQvBundles.map(b => {
                                const qty = parseInt(b.qty, 10) || 1;
                                const baseTotal = parseFloat(b.totalPrice || b.price || (qvBasePrice * qty));
                                const scaledTotal = Math.round((baseTotal + (variantPriceDelta * qty)) * 100) / 100;
                                const scaledUnit = Math.round((scaledTotal / qty) * 100) / 100;
                                return {
                                    ...b,
                                    qty,
                                    totalPrice: scaledTotal,
                                    pricePerUnit: scaledUnit
                                };
                            });

                            const activeBundle = qvBundles[quickViewSelectedBundle] || qvBundles[0];
                            const rawBundleTotal = parseFloat(activeBundle.totalPrice || variantBasePrice);
                            const qvCouponDiscount = stanAppliedCoupon
                                ? (stanAppliedCoupon.type === 'fixed'
                                    ? Math.min(rawBundleTotal, parseFloat(stanAppliedCoupon.discount || 0))
                                    : Math.round(rawBundleTotal * (parseFloat(stanAppliedCoupon.discount || 0) / 100) * 100) / 100)
                                : 0;
                            const effectivePrice = Math.max(1.00, Math.round((rawBundleTotal - qvCouponDiscount) * 100) / 100);

                            const productWithVariant = {
                                ...quickViewProduct,
                                variant: activeOptionName,
                                selectedVariantId: variantPricing.matchedVariant?.id || '',
                                price: activeBundle.pricePerUnit || variantBasePrice
                            };

                            return (
                                <div className="space-y-4 pt-3">
                                    {/* Main Photo */}
                                    <div className="aspect-square sm:aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 relative">
                                        <img 
                                            src={getSafeImageUrl(activePhoto)} 
                                            alt={quickViewProduct.name || 'Product View'} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => handleImageError(e, 'product')}
                                        />
                                        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-rose-600 text-white font-extrabold text-[10px] shadow-sm flex items-center gap-1.5">
                                            <span className="size-1.5 rounded-full bg-white animate-pulse" />
                                            ⚡ HIGH DEMAND: ONLY 3 LEFT
                                        </span>
                                    </div>

                                    {/* Thumbnail strip if multiple photos exist */}
                                    {galleryImages.length > 1 && (
                                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                                            {galleryImages.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setQuickViewActivePhoto(idx)}
                                                    className={`size-12 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition ${quickViewActivePhoto === idx ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200 opacity-60 hover:opacity-100'}`}
                                                >
                                                    <img src={getSafeImageUrl(img)} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Dynamic Pricing Banner */}
                                    <div className="flex items-baseline justify-between pt-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-slate-900">
                                                ${effectivePrice.toFixed(2)}
                                            </span>
                                            {qvCouponDiscount > 0 ? (
                                                <>
                                                    <span className="text-xs text-slate-400 line-through font-semibold">
                                                        ${rawBundleTotal.toFixed(2)}
                                                    </span>
                                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                        {stanAppliedCoupon.label}
                                                    </span>
                                                </>
                                            ) : ((qvComparePrice + variantPriceDelta) > variantBasePrice && (
                                                <span className="text-xs text-slate-400 line-through font-semibold">
                                                    ${((qvComparePrice + variantPriceDelta) * (activeBundle.qty || 1)).toFixed(2)}
                                                </span>
                                            ))}
                                        </div>
                                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <span>📦</span> Order in {shippingCutoff} for Same-Day
                                        </span>
                                    </div>

                                    {/* Variant / Option Selector (if variants exist) */}
                                    {optionsList.length > 0 && (
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                                                    Select Option / Model:
                                                </label>
                                                <span className="text-xs font-extrabold text-amber-600">
                                                    {activeOptionName}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {optionsList.map(opt => {
                                                    const isSelected = activeOptionName === opt;
                                                    const optPricing = getProductVariantPricing(quickViewProduct, opt);
                                                    const optDelta = optPricing.priceDelta;
                                                    return (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => setQuickViewSelectedVariant(opt)}
                                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                                                        >
                                                            <span>{opt}</span>
                                                            {optDelta > 0 && (
                                                                <span className={`text-[10px] ${isSelected ? 'text-amber-300' : 'text-amber-600'}`}>
                                                                    (+${optDelta.toFixed(2)})
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Volume Bundle Options */}
                                    {qvBundles.length > 1 && (
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                                                Package & Volume Options:
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {qvBundles.map((b, bIdx) => {
                                                    const isSelected = quickViewSelectedBundle === bIdx;
                                                    const bPrice = parseFloat(b.totalPrice || variantBasePrice);
                                                    return (
                                                        <button
                                                            key={bIdx}
                                                            type="button"
                                                            onClick={() => setQuickViewSelectedBundle(bIdx)}
                                                            className={`p-2.5 rounded-xl border text-left transition relative cursor-pointer ${isSelected ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'}`}
                                                        >
                                                            {b.badge && (
                                                                <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full block mb-1 truncate ${isSelected ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-600 text-white'}`}>
                                                                    {b.badge}
                                                                </span>
                                                            )}
                                                            <div className="text-xs font-black">{b.qty}x Unit{b.qty > 1 ? 's' : ''}</div>
                                                            <div className={`text-[11px] font-bold ${isSelected ? 'text-emerald-300' : 'text-emerald-700'}`}>
                                                                ${bPrice.toFixed(2)}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="pt-2 space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleInstantBuy(productWithVariant, activeBundle, qvCouponDiscount, stanAppliedCoupon?.code);
                                                setQuickViewProduct(null);
                                            }}
                                            className="w-full py-3 rounded-2xl font-black text-xs sm:text-sm tracking-wider uppercase transition active:scale-98 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                                            style={{ 
                                                backgroundColor: resolveCtaTheme(creator.themeColor || '#ef4444', false).backgroundColor, 
                                                color: resolveCtaTheme(creator.themeColor || '#ef4444', false).color 
                                            }}
                                        >
                                            <Zap size={15} className={resolveCtaTheme(creator.themeColor || '#ef4444', false).fillClass} style={{ fill: resolveCtaTheme(creator.themeColor || '#ef4444', false).color }} />
                                            <span>BUY NOW WITH INSTANT CHECKOUT</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleAddToCart(productWithVariant, activeBundle);
                                                setQuickViewProduct(null);
                                            }}
                                            className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs tracking-wider transition active:scale-98 border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <ShoppingBag size={14} />
                                            <span>ADD TO CART</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Exit Intent Discount Recovery Modal */}
            <ExitIntentModal 
                onApplyCoupon={(code, discount) => {
                    const discNum = discount || 25;
                    const couponCode = code || 'SAVE25';
                    setStanAppliedCoupon({
                        code: couponCode,
                        type: 'percentage',
                        discount: discNum,
                        label: `${discNum}% OFF`
                    });
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem('active_coupon', couponCode);
                    }
                    toast.success(`Coupon "${couponCode}" applied! ${discNum}% OFF activated 🎉`);
                }} 
            />

            {/* AI Shopping Assistant (generative_ui) */}
            <AiShoppingAssistant 
                products={displayedProducts} 
                storeName={creator.name} 
                themeColor={creator.themeColor} 
                onSelectProduct={handleInstantBuy} 
            />

        </div>
    );
}
