'use client'
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import Loading from "@/components/Loading";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getProduct } from "@/lib/firebaseDb";
import { fetchProducts } from "@/lib/features/product/productSlice";
import Link from "next/link";
import { ArrowLeft, PackageX, Edit3 } from "lucide-react";

export default function Product() {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const products = useSelector(state => state.product.list);
    const dispatch = useDispatch();

    useEffect(() => {
        fetch('/api/admin/auth')
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
        const fetchProductData = async () => {
            setLoading(true);
            try {
                // 1. Fetch fresh from database to reflect price updates immediately
                let foundProduct = await getProduct(productId).catch(() => null);

                // 2. Fallback to Redux store
                if (!foundProduct) {
                    foundProduct = products?.find((p) => p.id === productId);
                }

                // 3. Fallback: check localStorage & sessionStorage cached stores
                if (!foundProduct && typeof window !== 'undefined') {
                    const storagePool = [localStorage, sessionStorage];
                    for (const storage of storagePool) {
                        for (let i = 0; i < storage.length; i++) {
                            const key = storage.key(i);
                            if (key && (key.startsWith('cloned_store_') || key.startsWith('store_'))) {
                                try {
                                    const storeData = JSON.parse(storage.getItem(key) || '{}');
                                    const match = (storeData.products || []).find(p => p.id === productId || p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === productId);
                                    if (match) {
                                        foundProduct = match;
                                        break;
                                    }
                                } catch (e) {}
                            }
                        }
                        if (foundProduct) break;
                    }
                }

                // 4. Fallback: check server API /api/products
                if (!foundProduct) {
                    try {
                        const apiRes = await fetch('/api/products');
                        if (apiRes.ok) {
                            const apiData = await apiRes.json();
                            if (apiData.success && Array.isArray(apiData.products)) {
                                foundProduct = apiData.products.find(p => p.id === productId || p.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '-') === productId);
                            }
                        }
                    } catch {}
                }

                // 5. Fallback: check store presets
                if (!foundProduct) {
                    try {
                        const { HIGHGEARTOYS_PRODUCTS, DEFAULT_STORE_STARTER_PRODUCTS, DEFAULT_DEMO_CREATOR } = await import('@/lib/storePresets');
                        const allPresets = [...(HIGHGEARTOYS_PRODUCTS || []), ...(DEFAULT_STORE_STARTER_PRODUCTS || []), ...(DEFAULT_DEMO_CREATOR?.products || [])];
                        foundProduct = allPresets.find(p => p.id === productId || p.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '-') === productId);
                    } catch {}
                }

                if (foundProduct) {
                    setProduct(foundProduct);
                } else {
                    setProduct(null);
                }
            } catch (err) {
                console.error("Error loading product:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
        }
    }, [productId, products]);

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
            </div>
        </div>
    );
}