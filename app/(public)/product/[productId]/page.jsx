'use client'
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import Loading from "@/components/Loading";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchProducts } from "@/lib/features/product/productSlice";
import Link from "next/link";
import { ArrowLeft, PackageX, Edit3 } from "lucide-react";

export default function Product() {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const products = useSelector(state => state.product.list);
    const productsRef = useRef(products);
    const dispatch = useDispatch();

    useEffect(() => {
        productsRef.current = products;
    }, [products]);

    useEffect(() => {
        const storedToken = typeof window !== 'undefined' 
            ? (localStorage.getItem('gumshop_admin_token') || sessionStorage.getItem('gumshop_admin_token')) 
            : null;
        if (storedToken && storedToken.startsWith('gumshop_')) {
            setIsOwner(true);
        }
        const headers = storedToken ? { 'Authorization': `Bearer ${storedToken}` } : {};
        fetch('/api/admin/auth', { headers })
            .then(r => r.json())
            .then(d => { if (d.authenticated) setIsOwner(true); })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!products || products.length === 0) {
            dispatch(fetchProducts());
        }
    }, [dispatch, products]);

    useEffect(() => {
        let isMounted = true;
        const fetchProductData = async () => {
            setLoading(true);
            try {
                let foundProduct = null;

                // 1. Authoritative: query Supabase via /api/products (always fresh, never stale)
                try {
                    const apiRes = await fetch('/api/products');
                    if (apiRes.ok) {
                        const apiData = await apiRes.json();
                        if (apiData.success && Array.isArray(apiData.products)) {
                            foundProduct = apiData.products.find(
                                p => p.id === productId || p.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '-') === productId
                            );
                        }
                    }
                } catch {}

                // 2. Fallback to Redux store (already Supabase-sourced if loaded)
                if (!foundProduct) {
                    foundProduct = productsRef.current?.find(p => p.id === productId);
                }

                // 3. Fallback: scan localStorage for cached store data (offline / new session)
                if (!foundProduct && typeof window !== 'undefined') {
                    const storagePool = [localStorage, sessionStorage];
                    for (const storage of storagePool) {
                        for (let i = 0; i < storage.length; i++) {
                            const key = storage.key(i);
                            if (key && (key.startsWith('cloned_store_') || key.startsWith('store_'))) {
                                try {
                                    const storeData = JSON.parse(storage.getItem(key) || '{}');
                                    const match = (storeData.products || []).find(p => p.id === productId || p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === productId);
                                    if (match) { foundProduct = match; break; }
                                } catch {}
                            }
                        }
                        if (foundProduct) break;
                    }
                }

                // NOTE: storePresets intentionally NOT used here — they contain hardcoded prices
                //       that conflict with live DB data. If DB returns nothing, show "not found".

                if (isMounted) {
                    setProduct(foundProduct || null);
                }
            } catch (err) {
                console.error("Error loading product:", err);
                if (isMounted) setProduct(null);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchProductData();
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
        }

        return () => {
            isMounted = false;
        };
    }, [productId]);

    if (loading) {
        return <Loading />;
    }

    if (!product) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                    <PackageX size={28} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Product Not Found</h2>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                    This item may have sold out or is no longer listed in this store catalog.
                </p>
                <Link href="/" className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-600 text-white font-semibold text-xs shadow-md hover:bg-emerald-500 transition">
                    <ArrowLeft size={16} />
                    <span>Return to Store</span>
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-4 sm:mx-6 pb-20">
            <div className="max-w-7xl mx-auto">
                {/* Merchant Live Controls */}
                {isOwner && (
                    <div className="mt-4 p-3 rounded-2xl bg-slate-900 text-white flex items-center justify-between text-xs border border-slate-800 shadow-md">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="font-bold text-slate-200">Merchant Controls:</span>
                            <span className="text-slate-400 hidden sm:inline">You are viewing this product live on your storefront.</span>
                        </div>
                        <Link
                            href={`/store/edit-product/${product.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition shadow-sm"
                        >
                            <Edit3 size={13} />
                            <span>Edit Product</span>
                        </Link>
                    </div>
                )}

                {/* Breadcrumbs */}
                <div className="text-slate-500 text-xs sm:text-sm mt-4 mb-6 flex items-center gap-1.5 font-medium">
                    <Link href="/" className="hover:text-emerald-600 transition">Home</Link>
                    <span>/</span>
                    <Link href="/shop" className="hover:text-emerald-600 transition">Products</Link>
                    <span>/</span>
                    <span className="text-slate-800">{product.category || 'Featured'}</span>
                </div>

                {/* Product Details Component */}
                <ProductDetails product={product} />

                {/* Description & Customer Reviews */}
                <div className="mt-12">
                    <ProductDescription product={product} />
                </div>

                {/* Schema.org Product Structured Data for SEO Rich Snippets */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org/',
                            '@type': 'Product',
                            name: product.name || 'Store Product',
                            image: Array.isArray(product.images) && product.images.length > 0 
                                ? product.images 
                                : [product.image || 'https://gumshop.online/images/og-default.jpg'],
                            description: product.description || `Buy ${product.name} at GumShop with instant tracking and secure checkout.`,
                            brand: {
                                '@type': 'Brand',
                                name: 'GumShop'
                            },
                            offers: {
                                '@type': 'Offer',
                                url: typeof window !== 'undefined' ? window.location.href : `https://gumshop.online/product/${product.id}`,
                                priceCurrency: 'USD',
                                price: parseFloat(product.price || 0).toFixed(2),
                                availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                                itemCondition: 'https://schema.org/NewCondition'
                            }
                        })
                    }}
                />
            </div>
        </div>
    );
}