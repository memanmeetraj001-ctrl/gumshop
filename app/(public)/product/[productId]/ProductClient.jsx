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

export default function ProductClient({ initialProduct, productId: propProductId }) {
    const params = useParams();
    const productId = propProductId || params?.productId;
    const [product, setProduct] = useState(initialProduct || null);
    const [loading, setLoading] = useState(!initialProduct);
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
            if (product && (product.id === productId || product.slug === productId)) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                let foundProduct = null;

                // 1. Authoritative: query Supabase via /api/products
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

                // 2. Fallback to Redux store
                if (!foundProduct) {
                    foundProduct = productsRef.current?.find(p => p.id === productId);
                }

                if (isMounted) {
                    setProduct(foundProduct || initialProduct || null);
                }
            } catch (err) {
                console.error("Error loading product:", err);
                if (isMounted) setProduct(initialProduct || null);
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
    }, [productId, initialProduct]);

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

    const storeSlug = product.storeSlug || product.storeId || 'store';
    const storeName = product.storeName || 'Store Catalog';

    return (
        <div className="mx-3 sm:mx-6 pb-28 sm:pb-20 overflow-x-hidden max-w-full">
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
                    <Link href={`/shop/${storeSlug}`} className="hover:text-emerald-600 transition">{storeName}</Link>
                    <span>/</span>
                    <span className="text-slate-800 line-clamp-1">{product.name}</span>
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
