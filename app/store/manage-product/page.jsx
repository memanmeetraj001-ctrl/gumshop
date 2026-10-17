'use client'
import { useEffect, useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import Loading from "@/components/Loading";
import { useAuth } from "@/lib/AuthContext";
import { getProductsByStore, updateProduct, updateProductsBatch, deleteProduct, createProduct, isProductDeleted, isJunkProductName } from "@/lib/firebaseDb";
import { getActiveStore, getActiveStoreSync } from "@/lib/activeStore";
import { generateContextualBundles, roundPriceStrategy } from "@/lib/importer/productEnhancer";
import { useRouter } from "next/navigation";
import { 
    Trash2, 
    Edit3, 
    ExternalLink, 
    Sparkles, 
    Plus, 
    TrendingUp, 
    TrendingDown,
    X, 
    Save, 
    Search, 
    Copy, 
    Eye, 
    SlidersHorizontal,
    Tag,
    Zap,
    Percent,
    DollarSign,
    Layers,
    ArrowRight,
    RefreshCw,
    Check,
    Minus
} from "lucide-react";
import Link from "next/link";

export default function StoreManageProducts() {
    const currency = '$';
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [activeStore, setActiveStore] = useState(() => {
        if (typeof window !== 'undefined') {
            const sp = new URLSearchParams(window.location.search);
            const targetSlug = sp.get('store');
            if (targetSlug) {
                const clean = targetSlug.toLowerCase().replace(/^store_/, '');
                const curr = getActiveStoreSync();
                if (curr && (curr.username || curr.slug || '').toLowerCase().replace(/^store_/, '') === clean) {
                    return curr;
                }
            }
        }
        return getActiveStoreSync();
    });

    const [products, setProducts] = useState(() => {
        const init = (typeof window !== 'undefined') ? getActiveStoreSync() : null;
        if (Array.isArray(init?.products) && init.products.length > 0) {
            return init.products.filter(p => p && p.id && !isProductDeleted(p.id) && !isJunkProductName(p.name || p.title));
        }
        return [];
    });

    const [loading, setLoading] = useState(false);

    // Filters and Search State (Pic 4)
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [stockFilter, setStockFilter] = useState('ALL');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkActing, setIsBulkActing] = useState(false);

    // Quick Edit Product Modal State
    const [editingProduct, setEditingProduct] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        price: 0,
        compareAtPrice: 0,
        supplierCost: 0,
        category: 'Electronics',
        image: '',
        description: '',
        inStock: true
    });
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Bulk Price & Margin Studio Modal State
    const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
    const [bulkPriceConfig, setBulkPriceConfig] = useState({
        scope: 'selected', // 'selected' | 'filtered' | 'all'
        mode: 'percent', // 'percent' | 'dollar' | 'flat' | 'margin' | 'msrp'
        percentType: 'markup', // 'markup' | 'discount'
        percentValue: 15,
        dollarType: 'add', // 'add' | 'subtract'
        dollarValue: 5,
        flatPrice: 39.99,
        targetMargin: 65,
        charmRounding: 'charm99', // 'charm99' | 'charm95' | 'whole' | 'none'
        msrpStrategy: 'auto35', // 'auto35' | 'auto30' | 'auto50' | 'custom' | 'preserve'
        customMsrpPercent: 35
    });
    const [isApplyingBulkPrice, setIsApplyingBulkPrice] = useState(false);

    const fetchProducts = async () => {
        try {
            let targetSlug = '';
            if (typeof window !== 'undefined') {
                const sp = new URLSearchParams(window.location.search);
                targetSlug = sp.get('store') || '';
            }

            let store = null;
            let preloadedProducts = [];
            if (targetSlug) {
                try {
                    const cleanSlug = targetSlug.toLowerCase().replace(/^store_/, '');
                    const res = await fetch(`/api/store/data?slug=${encodeURIComponent(cleanSlug)}`, { cache: 'no-store' });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.store) {
                            store = data.store;
                            if (Array.isArray(data.products)) preloadedProducts = data.products;
                        }
                    }
                } catch {}
            }

            if (!store) {
                store = await getActiveStore(user) || getActiveStoreSync();
            }
            if (!store) {
                setLoading(false);
                return;
            }
            setActiveStore(store);

            const storeSlug = (store.username || store.name || 'shop').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
            const storeId = store.id || `store_${storeSlug}`;

            // 1. Query products strictly scoped to this store
            let data = preloadedProducts;
            if (data.length === 0 && Array.isArray(store.products) && store.products.length > 0) {
                data = store.products;
            }
            if (data.length === 0) {
                try {
                    data = await getProductsByStore(storeId);
                } catch (e) {
                    console.warn("Products query fallback:", e);
                }
            }

            // Filter out any tombstoned deleted products and dummy/placeholder items (Partial Payment, etc.)
            const sanitized = (data || []).filter(p => p && p.id && !isProductDeleted(p.id) && !isJunkProductName(p.name || p.title) && (p.price === undefined || parseFloat(p.price) > 0));
            setProducts(sanitized);
        } catch (err) {
            console.error("Error fetching products:", err);
        } finally {
            setLoading(false);
        }
    };

    // Toggle In/Out of Stock
    const toggleStock = async (productId) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        const newStatus = !product.inStock;
        await updateProduct(productId, { inStock: newStatus });
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, inStock: newStatus } : p));
        toast.success(newStatus ? "Product marked in stock!" : "Product marked out of stock");
    };

    // Update Retail Price Inline
    const handleUpdateRetailPrice = async (productId, newPrice) => {
        const p = parseFloat(newPrice) || 0;
        if (p <= 0) return;
        const target = products.find(prod => prod.id === productId);
        const currentCompare = parseFloat(target?.compareAtPrice || target?.mrp || 0);
        const updatedCompare = currentCompare > p ? currentCompare : Math.round(p * 1.35 * 100) / 100;
        const customBundles = generateContextualBundles(target?.name || 'Product', p, 'exact');
        const updatePayload = {
            price: p,
            compareAtPrice: updatedCompare,
            mrp: updatedCompare,
            customBundles
        };
        await updateProduct(productId, updatePayload);
        setProducts(prev => prev.map(item => item.id === productId ? { ...item, ...updatePayload } : item));
        toast.success("Retail price updated!");
    };

    // Update Supplier Cost Inline
    const handleUpdateSupplierCost = async (productId, supplierCost) => {
        const cost = parseFloat(supplierCost) || 0;
        const target = products.find(p => p.id === productId);
        const retail = parseFloat(target?.price || 0);
        const marginPct = retail > 0 ? Math.round(((retail - cost) / retail) * 100) : 0;
        const profit = retail > cost ? Math.round((retail - cost) * 100) / 100 : 0;
        await updateProduct(productId, { supplierCost: cost, margin: marginPct, estimatedProfit: profit });
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, supplierCost: cost, margin: marginPct, estimatedProfit: profit } : p));
        toast.success("Supplier cost & margin updated!");
    };

    // 1-Click Duplicate Product (Pic 4)
    const handleDuplicateProduct = async (product) => {
        try {
            const storeId = activeStore?.id || product.storeId || 'store_default';
            const cloneId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const clonedProduct = {
                ...product,
                id: cloneId,
                name: `${product.name} (Copy)`,
                storeId,
                createdAt: new Date().toISOString()
            };

            await createProduct(clonedProduct);
            setProducts(prev => [clonedProduct, ...prev]);
            toast.success(`Cloned "${product.name}" as duplicate! 📋`);
        } catch (error) {
            console.error("Duplicate product error:", error);
            toast.error("Failed to duplicate product");
        }
    };

    // Delete single product
    const handleDelete = async (productId) => {
        if (!window.confirm("Are you sure you want to remove this product from your store?")) return;
        try {
            await deleteProduct(productId);
            setProducts(prev => prev.filter(p => p.id !== productId));
            setSelectedIds(prev => prev.filter(id => id !== productId));
            toast.success("Product removed from catalog!");
        } catch (error) {
            toast.error("Failed to delete product");
        }
    };

    // Bulk Selection Handlers (Pic 4)
    const handleSelectAll = () => {
        if (selectedIds.length === filteredProducts.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredProducts.map(p => p.id));
        }
    };

    const handleToggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Bulk Stock Update
    const handleBulkStock = async (newStockStatus) => {
        if (selectedIds.length === 0) return;
        setIsBulkActing(true);
        try {
            await Promise.all(selectedIds.map(id => updateProduct(id, { inStock: newStockStatus })));
            setProducts(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, inStock: newStockStatus } : p));
            toast.success(`Updated ${selectedIds.length} products to ${newStockStatus ? 'In Stock' : 'Out of Stock'}!`);
            setSelectedIds([]);
        } catch (err) {
            toast.error("Bulk stock update failed");
        } finally {
            setIsBulkActing(false);
        }
    };

    // Pure calculation engine for bulk pricing, charm rounding, and profit margins
    const calculateBulkItemPrice = (product, config) => {
        if (!product) return null;
        const currentPrice = parseFloat(product.price !== undefined && product.price !== null ? product.price : 52.99);
        const supplierCost = parseFloat(product.supplierCost || (currentPrice * 0.35).toFixed(2));
        
        let rawPrice = currentPrice;
        
        if (config.mode === 'percent') {
            const pct = Math.max(0, parseFloat(config.percentValue) || 0);
            rawPrice = config.percentType === 'markup' 
                ? currentPrice * (1 + pct / 100)
                : currentPrice * (1 - pct / 100);
        } else if (config.mode === 'dollar') {
            const amt = Math.max(0, parseFloat(config.dollarValue) || 0);
            rawPrice = config.dollarType === 'add'
                ? currentPrice + amt
                : currentPrice - amt;
        } else if (config.mode === 'flat') {
            rawPrice = Math.max(1, parseFloat(config.flatPrice) || 29.99);
        } else if (config.mode === 'margin') {
            const targetMargin = Math.min(95, Math.max(5, parseFloat(config.targetMargin) || 60));
            rawPrice = supplierCost / (1 - (targetMargin / 100));
        } else if (config.mode === 'msrp') {
            rawPrice = currentPrice;
        }
        
        // Safety price floor ($1.00 minimum)
        rawPrice = Math.max(1.00, rawPrice);
        
        // Apply Charm Rounding
        let finalPrice = rawPrice;
        if (config.charmRounding === 'charm99') {
            finalPrice = Math.floor(rawPrice) + 0.99;
        } else if (config.charmRounding === 'charm95') {
            finalPrice = Math.floor(rawPrice) + 0.95;
        } else if (config.charmRounding === 'whole') {
            finalPrice = Math.round(rawPrice);
        } else {
            finalPrice = Math.round(rawPrice * 100) / 100;
        }
        finalPrice = Math.round(finalPrice * 100) / 100;
        
        // Compare-At MSRP Anchor
        let compareAtPrice = parseFloat(product.compareAtPrice || product.mrp || 0);
        if (config.msrpStrategy === 'auto35') {
            compareAtPrice = Math.round(finalPrice * 1.35 * 100) / 100;
        } else if (config.msrpStrategy === 'auto30') {
            compareAtPrice = Math.round(finalPrice * 1.30 * 100) / 100;
        } else if (config.msrpStrategy === 'auto50') {
            compareAtPrice = Math.round(finalPrice * 1.50 * 100) / 100;
        } else if (config.msrpStrategy === 'custom') {
            const msrpPct = Math.max(0, parseFloat(config.customMsrpPercent) || 35);
            compareAtPrice = Math.round(finalPrice * (1 + msrpPct / 100) * 100) / 100;
        } else if (config.msrpStrategy === 'preserve') {
            compareAtPrice = Math.max(compareAtPrice, Math.round(finalPrice * 1.25 * 100) / 100);
        }
        
        // Guarantee compareAtPrice > finalPrice for authentic discount badges
        if (compareAtPrice <= finalPrice) {
            compareAtPrice = Math.round(finalPrice * 1.35 * 100) / 100;
        }

        const currentMargin = currentPrice > 0 ? Math.round(((currentPrice - supplierCost) / currentPrice) * 100) : 0;
        const newMargin = finalPrice > 0 ? Math.round(((finalPrice - supplierCost) / finalPrice) * 100) : 0;
        const newProfit = Math.max(0, Math.round((finalPrice - supplierCost) * 100) / 100);

        const customBundles = generateContextualBundles(
            product.name || product.title || 'Product', 
            finalPrice, 
            config.charmRounding === 'charm99' ? 'charm99' : 'exact'
        );

        return {
            id: product.id,
            name: product.name || product.title || 'Product',
            category: typeof product.category === 'string' ? product.category : (product.category?.name || 'Featured'),
            currentPrice,
            finalPrice,
            compareAtPrice,
            supplierCost,
            currentMargin,
            newMargin,
            newProfit,
            customBundles
        };
    };

    // Bulk Price Studio Full Execution
    const handleApplyBulkPricing = async () => {
        if (targetBulkProducts.length === 0) return;
        setIsApplyingBulkPrice(true);
        try {
            const activeStoreSlug = activeStore?.username || storeSlug || '';
            const activeStoreId = activeStore?.id || (activeStoreSlug ? `store_${activeStoreSlug}` : '');

            const updatesList = targetBulkProducts.map(p => {
                const calc = calculateBulkItemPrice(p, bulkPriceConfig);
                return {
                    id: p.id,
                    storeSlug: activeStoreSlug,
                    storeId: activeStoreId,
                    price: calc.finalPrice,
                    compareAtPrice: calc.compareAtPrice,
                    mrp: calc.compareAtPrice,
                    margin: calc.newMargin,
                    estimatedProfit: calc.newProfit,
                    customBundles: calc.customBundles
                };
            });

            await updateProductsBatch(updatesList);

            setProducts(prev => prev.map(p => {
                const match = updatesList.find(u => u.id === p.id);
                return match ? { ...p, ...match } : p;
            }));

            toast.success(`Successfully updated ${updatesList.length} products! 🚀`);
            setShowBulkPriceModal(false);
            setSelectedIds([]);
        } catch (err) {
            console.error("Bulk price update error:", err);
            toast.error("Failed to update products in bulk");
        } finally {
            setIsApplyingBulkPrice(false);
        }
    };

    // Quick 1-Click Markup (+10%, +20%)
    const handleBulkMarkup = async (percentMultiplier) => {
        const targets = selectedIds.length > 0 ? products.filter(p => selectedIds.includes(p.id)) : filteredProducts;
        if (targets.length === 0) return;
        setIsBulkActing(true);
        try {
            const activeStoreSlug = activeStore?.username || storeSlug || '';
            const activeStoreId = activeStore?.id || (activeStoreSlug ? `store_${activeStoreSlug}` : '');
            const config = {
                mode: 'percent',
                percentType: 'markup',
                percentValue: Math.round(percentMultiplier * 100),
                charmRounding: 'charm99',
                msrpStrategy: 'auto35'
            };
            const updatesList = targets.map(p => {
                const calc = calculateBulkItemPrice(p, config);
                return {
                    id: p.id,
                    storeSlug: activeStoreSlug,
                    storeId: activeStoreId,
                    price: calc.finalPrice,
                    compareAtPrice: calc.compareAtPrice,
                    mrp: calc.compareAtPrice,
                    margin: calc.newMargin,
                    estimatedProfit: calc.newProfit,
                    customBundles: calc.customBundles
                };
            });
            await updateProductsBatch(updatesList);
            setProducts(prev => prev.map(p => {
                const match = updatesList.find(u => u.id === p.id);
                return match ? { ...p, ...match } : p;
            }));
            toast.success(`Applied +${Math.round(percentMultiplier * 100)}% markup (.99) to ${updatesList.length} products! 🚀`);
            setSelectedIds([]);
        } catch (err) {
            toast.error("Bulk price markup failed");
        } finally {
            setIsBulkActing(false);
        }
    };

    // Quick 1-Click Flash Discount (-15%)
    const handleBulkDiscount = async (discountPercent) => {
        const targets = selectedIds.length > 0 ? products.filter(p => selectedIds.includes(p.id)) : filteredProducts;
        if (targets.length === 0) return;
        setIsBulkActing(true);
        try {
            const activeStoreSlug = activeStore?.username || storeSlug || '';
            const activeStoreId = activeStore?.id || (activeStoreSlug ? `store_${activeStoreSlug}` : '');
            const config = {
                mode: 'percent',
                percentType: 'discount',
                percentValue: discountPercent,
                charmRounding: 'charm99',
                msrpStrategy: 'preserve'
            };
            const updatesList = targets.map(p => {
                const calc = calculateBulkItemPrice(p, config);
                return {
                    id: p.id,
                    storeSlug: activeStoreSlug,
                    storeId: activeStoreId,
                    price: calc.finalPrice,
                    compareAtPrice: calc.compareAtPrice,
                    mrp: calc.compareAtPrice,
                    margin: calc.newMargin,
                    estimatedProfit: calc.newProfit,
                    customBundles: calc.customBundles
                };
            });
            await updateProductsBatch(updatesList);
            setProducts(prev => prev.map(p => {
                const match = updatesList.find(u => u.id === p.id);
                return match ? { ...p, ...match } : p;
            }));
            toast.success(`Applied -${discountPercent}% flash discount to ${updatesList.length} products! ⚡`);
            setSelectedIds([]);
        } catch (err) {
            toast.error("Bulk discount failed");
        } finally {
            setIsBulkActing(false);
        }
    };

    // Quick 1-Click End in .99
    const handleBulkCharm99 = async () => {
        const targets = selectedIds.length > 0 ? products.filter(p => selectedIds.includes(p.id)) : filteredProducts;
        if (targets.length === 0) return;
        setIsBulkActing(true);
        try {
            const activeStoreSlug = activeStore?.username || storeSlug || '';
            const activeStoreId = activeStore?.id || (activeStoreSlug ? `store_${activeStoreSlug}` : '');
            const config = {
                mode: 'percent',
                percentType: 'markup',
                percentValue: 0,
                charmRounding: 'charm99',
                msrpStrategy: 'auto35'
            };
            const updatesList = targets.map(p => {
                const calc = calculateBulkItemPrice(p, config);
                return {
                    id: p.id,
                    storeSlug: activeStoreSlug,
                    storeId: activeStoreId,
                    price: calc.finalPrice,
                    compareAtPrice: calc.compareAtPrice,
                    mrp: calc.compareAtPrice,
                    margin: calc.newMargin,
                    estimatedProfit: calc.newProfit,
                    customBundles: calc.customBundles
                };
            });
            await updateProductsBatch(updatesList);
            setProducts(prev => prev.map(p => {
                const match = updatesList.find(u => u.id === p.id);
                return match ? { ...p, ...match } : p;
            }));
            toast.success(`Formatted ${updatesList.length} prices to end cleanly in .99! ✨`);
            setSelectedIds([]);
        } catch (err) {
            toast.error("Bulk charm rounding failed");
        } finally {
            setIsBulkActing(false);
        }
    };

    // Bulk Delete
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} selected products?`)) return;
        setIsBulkActing(true);
        try {
            await Promise.all(selectedIds.map(id => deleteProduct(id)));
            setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
            toast.success(`Deleted ${selectedIds.length} products!`);
            setSelectedIds([]);
        } catch (err) {
            toast.error("Bulk delete failed");
        } finally {
            setIsBulkActing(false);
        }
    };

    // Edit Modal Open & Save
    const handleOpenEditModal = (product) => {
        const retail = parseFloat(product.price || 0);
        const supplier = parseFloat(product.supplierCost || Math.round(retail * 0.35 * 100) / 100);
        const compareAtPrice = parseFloat(product.compareAtPrice || product.mrp || Math.round(retail * 1.35 * 100) / 100);
        const img = product.image || (product.images && product.images[0]) || '';

        setEditingProduct(product);
        setEditForm({
            name: product.name || '',
            price: retail,
            compareAtPrice: compareAtPrice,
            supplierCost: supplier,
            category: product.category || 'Featured',
            image: img,
            description: product.description || '',
            inStock: product.inStock !== false
        });
    };

    const handleSaveEditModal = async (e) => {
        e.preventDefault();
        if (!editingProduct) return;
        setIsSavingEdit(true);

        try {
            const newPrice = parseFloat(editForm.price) || 0;
            const updatedBundles = generateContextualBundles(editForm.name, newPrice, 'exact');
            const updatedData = {
                name: editForm.name,
                price: newPrice,
                compareAtPrice: parseFloat(editForm.compareAtPrice) || 0,
                mrp: parseFloat(editForm.compareAtPrice) || 0,
                supplierCost: parseFloat(editForm.supplierCost) || 0,
                category: editForm.category,
                image: editForm.image,
                images: editForm.image ? [editForm.image] : (editingProduct.images || []),
                description: editForm.description,
                inStock: editForm.inStock,
                customBundles: updatedBundles,
            };

            await updateProduct(editingProduct.id, updatedData);
            setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...updatedData } : p));
            toast.success(`"${editForm.name}" updated successfully! 🚀`);
            setEditingProduct(null);
        } catch (error) {
            console.error("Error updating product:", error);
            toast.error(error.message || "Failed to update product");
        } finally {
            setIsSavingEdit(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchProducts();
        }
    }, [user, authLoading]);

    // Unique Categories for Filter Dropdown
    const categories = useMemo(() => {
        const set = new Set();
        products.forEach(p => {
            if (p.category) set.add(p.category);
        });
        return Array.from(set);
    }, [products]);

    // Filtered Products (Search + Category + Stock)
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const q = searchTerm.toLowerCase().trim();
            const matchesSearch = !q || 
                (p.name && p.name.toLowerCase().includes(q)) ||
                (p.id && p.id.toLowerCase().includes(q)) ||
                (p.category && p.category.toLowerCase().includes(q));

            const matchesCategory = categoryFilter === 'ALL' || (p.category || 'Featured') === categoryFilter;

            const matchesStock = stockFilter === 'ALL' ||
                (stockFilter === 'IN_STOCK' && p.inStock !== false) ||
                (stockFilter === 'OUT_OF_STOCK' && p.inStock === false);

            return matchesSearch && matchesCategory && matchesStock;
        });
    }, [products, searchTerm, categoryFilter, stockFilter]);

    // Bulk Studio Target Products & Preview Items
    const targetBulkProducts = useMemo(() => {
        if (bulkPriceConfig.scope === 'selected' && selectedIds.length > 0) {
            return products.filter(p => selectedIds.includes(p.id));
        }
        if (bulkPriceConfig.scope === 'filtered') {
            return filteredProducts;
        }
        return products;
    }, [bulkPriceConfig.scope, selectedIds, filteredProducts, products]);

    const bulkPreviewItems = useMemo(() => {
        return targetBulkProducts.slice(0, 5).map(prod => {
            const calc = calculateBulkItemPrice(prod, bulkPriceConfig);
            return {
                product: prod,
                calc
            };
        });
    }, [targetBulkProducts, bulkPriceConfig]);

    if (loading) return <Loading />;

    const storeSlug = activeStore?.username || activeStore?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '';

    return (
        <div className="p-4 sm:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
                        <span>Product Catalog & Profit Margins</span>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                            {products.length} Products
                        </span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage your products, live stock status, inline pricing, and real-time net profit margins.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href={`/shop/${storeSlug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
                    >
                        <Eye size={15} className="text-slate-600" />
                        <span>View Storefront</span>
                    </Link>
                    <Link
                        href="/store/import"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 transition"
                    >
                        <Sparkles size={15} className="text-emerald-600" />
                        <span>Clone Catalog</span>
                    </Link>
                    <Link
                        href="/store/add-product"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm shadow-emerald-600/30 transition"
                    >
                        <Plus size={16} />
                        <span>Add Product</span>
                    </Link>
                </div>
            </div>

            {/* Profit Margin Info Box */}
            <div className="mt-6 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-500/20 flex items-center justify-between gap-4 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <TrendingUp size={16} />
                    </div>
                    <div>
                        <strong className="text-slate-900 font-bold">Live Net Profit Estimator:</strong> Enter your supplier product cost to calculate real profit margins per sale.
                    </div>
                </div>
                <span className="hidden sm:inline text-emerald-800 font-semibold text-[11px] bg-emerald-100/80 px-2.5 py-1 rounded-full">
                    Target: &gt; 45% Net Margin
                </span>
            </div>

            {/* Smart Search, Filter & Bulk Toolbar (Pic 4) */}
            <div className="mt-6 space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl flex-1 max-w-md shadow-xs">
                        <Search size={16} className="text-slate-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search products by title, SKU, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent outline-none text-xs font-medium text-slate-800 placeholder:text-slate-400"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Category Filter */}
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs">
                            <Tag size={13} className="text-slate-400" />
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="bg-transparent outline-none cursor-pointer pr-2"
                            >
                                <option value="ALL">All Categories</option>
                                {categories.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Stock Filter */}
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs">
                            <SlidersHorizontal size={13} className="text-slate-400" />
                            <select
                                value={stockFilter}
                                onChange={(e) => setStockFilter(e.target.value)}
                                className="bg-transparent outline-none cursor-pointer pr-2"
                            >
                                <option value="ALL">All Stock Status</option>
                                <option value="IN_STOCK">In Stock Only</option>
                                <option value="OUT_OF_STOCK">Out of Stock Only</option>
                            </select>
                        </div>

                        {/* Standalone Bulk Price Studio Trigger */}
                        <button
                            type="button"
                            onClick={() => {
                                setBulkPriceConfig(prev => ({ 
                                    ...prev, 
                                    scope: selectedIds.length > 0 ? 'selected' : (filteredProducts.length < products.length ? 'filtered' : 'all') 
                                }));
                                setShowBulkPriceModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-sm hover:shadow transition active:scale-95 cursor-pointer shrink-0"
                            title="Open Bulk Price & Margin Studio"
                        >
                            <Zap size={14} className="fill-white" />
                            <span>Bulk Price Studio</span>
                        </button>
                    </div>
                </div>

                {/* Bulk Actions Bar (Active when items selected) */}
                {selectedIds.length > 0 && (
                    <div className="p-3 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2 text-xs font-bold pl-2">
                            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Primary Bulk Price Studio Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    setBulkPriceConfig(prev => ({ ...prev, scope: 'selected' }));
                                    setShowBulkPriceModal(true);
                                }}
                                disabled={isBulkActing}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center gap-1 shadow-sm shadow-emerald-500/20 cursor-pointer active:scale-95"
                            >
                                <Zap size={13} className="fill-slate-950" />
                                <span>Bulk Price Studio</span>
                            </button>

                            {/* Quick 1-Click Markup Pills */}
                            <button
                                type="button"
                                onClick={() => handleBulkMarkup(0.10)}
                                disabled={isBulkActing}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-sky-400 hover:text-sky-300 transition cursor-pointer"
                                title="Mark up selected products by 10% (.99)"
                            >
                                +10%
                            </button>
                            <button
                                type="button"
                                onClick={() => handleBulkMarkup(0.20)}
                                disabled={isBulkActing}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-sky-400 hover:text-sky-300 transition cursor-pointer"
                                title="Mark up selected products by 20% (.99)"
                            >
                                +20%
                            </button>
                            <button
                                type="button"
                                onClick={() => handleBulkDiscount(15)}
                                disabled={isBulkActing}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer"
                                title="Discount selected products by 15% for promotion"
                            >
                                -15% Sale
                            </button>
                            <button
                                type="button"
                                onClick={handleBulkCharm99}
                                disabled={isBulkActing}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-purple-400 hover:text-purple-300 transition cursor-pointer"
                                title="Round all prices to end in .99"
                            >
                                .99 Charm
                            </button>

                            <span className="h-4 w-px bg-slate-700 mx-0.5" />

                            <button
                                type="button"
                                onClick={() => handleBulkStock(true)}
                                disabled={isBulkActing}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 transition cursor-pointer"
                            >
                                In Stock
                            </button>
                            <button
                                type="button"
                                onClick={() => handleBulkStock(false)}
                                disabled={isBulkActing}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 transition cursor-pointer"
                            >
                                Out of Stock
                            </button>

                            <span className="h-4 w-px bg-slate-700 mx-0.5" />

                            <button
                                type="button"
                                onClick={handleBulkDelete}
                                disabled={isBulkActing}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600 text-xs font-bold text-rose-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                            >
                                <Trash2 size={13} />
                                <span>Delete ({selectedIds.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Products Table */}
            <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                                <th className="py-4 px-4 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                                        onChange={handleSelectAll}
                                        className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                        title="Select All"
                                    />
                                </th>
                                <th className="py-4 px-4">Product</th>
                                <th className="py-4 px-4">Retail Price ($)</th>
                                <th className="py-4 px-4">Supplier Cost ($)</th>
                                <th className="py-4 px-4 text-emerald-700">Net Profit & Margin</th>
                                <th className="py-4 px-4 text-center">In Stock</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                                        {products.length === 0 ? (
                                            <>
                                                No products found in this store yet. <br />
                                                <Link href="/store/import" className="text-emerald-600 font-bold hover:underline mt-2 inline-block">
                                                    Paste a URL to clone a catalog in 60s →
                                                </Link>
                                            </>
                                        ) : (
                                            <>
                                                No products match your search or filter criteria. <br />
                                                <button 
                                                    onClick={() => { setSearchTerm(''); setCategoryFilter('ALL'); setStockFilter('ALL'); }}
                                                    className="text-emerald-600 font-bold hover:underline mt-2 inline-block"
                                                >
                                                    Clear filters
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => {
                                    const retail = parseFloat(product.price || 0);
                                    const supplier = parseFloat(product.supplierCost || Math.round(retail * 0.35 * 100) / 100);
                                    const netProfit = Math.max(0, retail - supplier);
                                    const marginPercent = retail > 0 ? Math.round((netProfit / retail) * 100) : 0;
                                    const img = product.image || (product.images && product.images[0]) || '';
                                    const isSelected = selectedIds.includes(product.id);

                                    return (
                                        <tr key={product.id} className={`hover:bg-slate-50/60 transition ${isSelected ? 'bg-emerald-50/30' : ''}`}>
                                            {/* Row Checkbox */}
                                            <td className="py-4 px-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelect(product.id)}
                                                    className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                />
                                            </td>

                                            {/* Product Info */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    {img ? (
                                                        <img src={img} alt="" className="size-12 rounded-xl object-cover border border-slate-200 shrink-0" />
                                                    ) : (
                                                        <div className="size-12 rounded-xl bg-slate-100 border border-slate-200 shrink-0" />
                                                    )}
                                                    <div className="max-w-xs">
                                                        <p className="font-bold text-slate-900 truncate">{typeof product.name === 'string' ? product.name : String(product.name || 'Product')}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full capitalize">
                                                                {typeof product.category === 'string' ? product.category : (product.category?.name || 'Featured')}
                                                            </span>
                                                            {product.sku && (
                                                                <span className="text-[10px] font-mono text-slate-400">
                                                                    SKU: {product.sku}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Inline Retail Price Editor */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-slate-400 text-xs font-bold">$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        defaultValue={retail}
                                                        onBlur={(e) => handleUpdateRetailPrice(product.id, e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleUpdateRetailPrice(product.id, e.target.value);
                                                                e.target.blur();
                                                            }
                                                        }}
                                                        className="w-20 px-2.5 py-1 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-extrabold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition"
                                                        title="Click to edit retail price, press Enter or click away to save"
                                                    />
                                                </div>
                                            </td>

                                            {/* Inline Supplier Cost Editor */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-slate-400 text-xs">$</span>
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        defaultValue={supplier}
                                                        onBlur={(e) => handleUpdateSupplierCost(product.id, e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleUpdateSupplierCost(product.id, e.target.value);
                                                                e.target.blur();
                                                            }
                                                        }}
                                                        className="w-20 px-2.5 py-1 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition"
                                                        title="Click to edit supplier cost"
                                                    />
                                                </div>
                                            </td>

                                            {/* Net Profit & Margin */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-emerald-600 text-xs">
                                                        +${netProfit.toFixed(2)}
                                                    </span>
                                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                                        marginPercent >= 45 
                                                            ? 'bg-emerald-100 text-emerald-800' 
                                                            : marginPercent >= 25 
                                                                ? 'bg-amber-100 text-amber-800' 
                                                                : 'bg-rose-100 text-rose-800'
                                                    }`}>
                                                        {marginPercent}% Margin
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Stock Toggle */}
                                            <td className="py-4 px-4 text-center">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={product.inStock !== false}
                                                        onChange={() => toggleStock(product.id)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                                </label>
                                            </td>

                                            {/* Row Actions (Pic 4) */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* View on Storefront Link */}
                                                    <Link
                                                        href={`/product/${product.id}`}
                                                        target="_blank"
                                                        className="min-w-[32px] min-h-[32px] flex items-center justify-center p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                                                        title="View Live on Storefront"
                                                    >
                                                        <Eye size={15} />
                                                    </Link>

                                                    {/* 1-Click Duplicate Product */}
                                                    <button
                                                        onClick={() => handleDuplicateProduct(product)}
                                                        className="min-w-[32px] min-h-[32px] flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                                        title="Duplicate Product (1-Click Copy)"
                                                    >
                                                        <Copy size={15} />
                                                    </button>

                                                    {/* Edit Modal */}
                                                    <button
                                                        onClick={() => handleOpenEditModal(product)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[32px] text-xs font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                                                        title="Full Quick Edit"
                                                    >
                                                        <Edit3 size={13} className="text-emerald-600" />
                                                        <span>Edit</span>
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="min-w-[32px] min-h-[32px] flex items-center justify-center p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Edit Product Modal */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in" onClick={() => setEditingProduct(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-6 sm:p-8 relative border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                    <Edit3 size={18} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Edit Product</h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs text-slate-400 font-mono">ID: {editingProduct.id}</p>
                                        <span className="text-slate-300">•</span>
                                        <Link 
                                            href={`/store/add-product?id=${editingProduct.id}`}
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline"
                                        >
                                            <span>Dynamic Variants & Badges Editor</span>
                                            <ExternalLink size={11} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditingProduct(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSaveEditModal} className="mt-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Product Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Retail Price ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={editForm.price}
                                        onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Compare At ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.compareAtPrice}
                                        onChange={(e) => setEditForm({ ...editForm, compareAtPrice: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Supplier Cost ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.supplierCost}
                                        onChange={(e) => setEditForm({ ...editForm, supplierCost: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Category
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.category}
                                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                        placeholder="Electronics, Toys, Lifestyle..."
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Stock Status
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setEditForm({ ...editForm, inStock: !editForm.inStock })}
                                        className={`w-full px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                                            editForm.inStock
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                : 'bg-rose-50 text-rose-800 border-rose-300'
                                        }`}
                                    >
                                        <span className={`size-2 rounded-full ${editForm.inStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        <span>{editForm.inStock ? 'In Stock (Available)' : 'Out of Stock'}</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Product Image URL
                                </label>
                                <div className="flex gap-3 items-center">
                                    {editForm.image && (
                                        <img src={editForm.image} alt="" className="size-12 rounded-xl object-cover border border-slate-200 shrink-0" />
                                    )}
                                    <input
                                        type="url"
                                        value={editForm.image}
                                        onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                                        placeholder="https://images.unsplash.com/..."
                                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>

                            {/* Modal Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <Link
                                    href={`/store/add-product?id=${editingProduct.id}`}
                                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                                >
                                    Open Full Product Customizer →
                                </Link>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingProduct(null)}
                                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingEdit}
                                        className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                                    >
                                        <Save size={14} />
                                        <span>{isSavingEdit ? "Saving..." : "Save Changes"}</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Price & Margin Studio Modal */}
            {showBulkPriceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                                    <Zap size={20} className="fill-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                        <span>Bulk Price & Margin Studio</span>
                                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                            Pro Suite
                                        </span>
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Apply bulk percentage adjustments, target profit margins, and format charm endings.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowBulkPriceModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                            {/* 1. Scope Selector */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    1. Apply To (Target Scope)
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        disabled={selectedIds.length === 0}
                                        onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, scope: 'selected' })}
                                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                                            bulkPriceConfig.scope === 'selected'
                                                ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 ring-2 ring-emerald-500/20'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                        } ${selectedIds.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span>Selected</span>
                                            <span className="font-mono text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                                {selectedIds.length}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Checked products</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, scope: 'filtered' })}
                                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                                            bulkPriceConfig.scope === 'filtered'
                                                ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 ring-2 ring-emerald-500/20'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span>Filtered</span>
                                            <span className="font-mono text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                                {filteredProducts.length}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Current search/filter</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, scope: 'all' })}
                                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                                            bulkPriceConfig.scope === 'all'
                                                ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 ring-2 ring-emerald-500/20'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span>Entire Store</span>
                                            <span className="font-mono text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                                {products.length}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">All catalog items</p>
                                    </button>
                                </div>
                            </div>

                            {/* 2. Adjustment Mode Tabs */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    2. Price Adjustment Mode
                                </label>
                                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto text-xs font-bold text-slate-600">
                                    <button
                                        type="button"
                                        onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, mode: 'percent' })}
                                        className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                            bulkPriceConfig.mode === 'percent' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                                        }`}
                                    >
                                        <Percent size={13} />
                                        <span>Percentage (+ / - %)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, mode: 'dollar' })}
                                        className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                            bulkPriceConfig.mode === 'dollar' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                                        }`}
                                    >
                                        <DollarSign size={13} />
                                        <span>Fixed Dollar ($)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, mode: 'flat' })}
                                        className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                            bulkPriceConfig.mode === 'flat' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                                        }`}
                                    >
                                        <Tag size={13} />
                                        <span>Flat Price</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, mode: 'margin' })}
                                        className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                            bulkPriceConfig.mode === 'margin' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                                        }`}
                                    >
                                        <TrendingUp size={13} />
                                        <span>Target Margin %</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, mode: 'msrp' })}
                                        className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                            bulkPriceConfig.mode === 'msrp' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                                        }`}
                                    >
                                        <Layers size={13} />
                                        <span>MSRP Anchor</span>
                                    </button>
                                </div>
                            </div>

                            {/* 3. Parameter Controls Based on Mode */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                                {/* PERCENT MODE */}
                                {bulkPriceConfig.mode === 'percent' && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, percentType: 'markup' })}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                                                        bulkPriceConfig.percentType === 'markup'
                                                            ? 'bg-emerald-600 text-white shadow-xs'
                                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <TrendingUp size={13} />
                                                    <span>Increase (Markup)</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, percentType: 'discount' })}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                                                        bulkPriceConfig.percentType === 'discount'
                                                            ? 'bg-rose-600 text-white shadow-xs'
                                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <TrendingDown size={13} />
                                                    <span>Discount / Sale</span>
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="500"
                                                    value={bulkPriceConfig.percentValue}
                                                    onChange={(e) => setBulkPriceConfig({ ...bulkPriceConfig, percentValue: Math.max(0, parseFloat(e.target.value) || 0) })}
                                                    className="w-20 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 text-right outline-none focus:border-emerald-500"
                                                />
                                                <span className="text-xs font-bold text-slate-500">%</span>
                                            </div>
                                        </div>

                                        {/* Quick Percent Presets */}
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-[11px] font-bold text-slate-400 mr-1">Presets:</span>
                                            {[5, 10, 15, 20, 25, 30, 50].map(val => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, percentValue: val })}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                                        bulkPriceConfig.percentValue === val
                                                            ? 'bg-slate-900 text-white'
                                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {bulkPriceConfig.percentType === 'markup' ? `+${val}%` : `-${val}%`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* DOLLAR MODE */}
                                {bulkPriceConfig.mode === 'dollar' && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, dollarType: 'add' })}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                                                        bulkPriceConfig.dollarType === 'add'
                                                            ? 'bg-emerald-600 text-white shadow-xs'
                                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <Plus size={13} />
                                                    <span>Add Dollars (+$)</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, dollarType: 'subtract' })}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                                                        bulkPriceConfig.dollarType === 'subtract'
                                                            ? 'bg-rose-600 text-white shadow-xs'
                                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <Minus size={13} />
                                                    <span>Subtract Dollars (-$)</span>
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-slate-500">$</span>
                                                <input
                                                    type="number"
                                                    step="0.50"
                                                    min="0.50"
                                                    value={bulkPriceConfig.dollarValue}
                                                    onChange={(e) => setBulkPriceConfig({ ...bulkPriceConfig, dollarValue: Math.max(0, parseFloat(e.target.value) || 0) })}
                                                    className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 text-right outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-[11px] font-bold text-slate-400 mr-1">Presets:</span>
                                            {[2, 3, 5, 10, 15, 20].map(val => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, dollarValue: val })}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                                        bulkPriceConfig.dollarValue === val
                                                            ? 'bg-slate-900 text-white'
                                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {bulkPriceConfig.dollarType === 'add' ? `+$${val}` : `-$${val}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* FLAT PRICE MODE */}
                                {bulkPriceConfig.mode === 'flat' && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">Set Uniform Retail Price</p>
                                                <p className="text-[11px] text-slate-500">Every targeted product will be set to this exact price.</p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-slate-500">$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="1.00"
                                                    value={bulkPriceConfig.flatPrice}
                                                    onChange={(e) => setBulkPriceConfig({ ...bulkPriceConfig, flatPrice: Math.max(1, parseFloat(e.target.value) || 1) })}
                                                    className="w-28 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 text-right outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-[11px] font-bold text-slate-400 mr-1">Quick Values:</span>
                                            {[14.99, 19.99, 24.99, 29.99, 39.99, 44.99, 49.99, 69.99].map(val => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, flatPrice: val })}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                                        bulkPriceConfig.flatPrice === val
                                                            ? 'bg-slate-900 text-white'
                                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    ${val.toFixed(2)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* TARGET PROFIT MARGIN MODE */}
                                {bulkPriceConfig.mode === 'margin' && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">Cost-Plus Target Profit Margin</p>
                                                <p className="text-[11px] text-slate-500">
                                                    Formula: <code className="text-emerald-700 font-mono font-bold">Price = SupplierCost / (1 - Margin%)</code>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <input
                                                    type="number"
                                                    min="10"
                                                    max="90"
                                                    value={bulkPriceConfig.targetMargin}
                                                    onChange={(e) => setBulkPriceConfig({ ...bulkPriceConfig, targetMargin: Math.min(90, Math.max(10, parseFloat(e.target.value) || 50)) })}
                                                    className="w-20 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 text-right outline-none focus:border-emerald-500"
                                                />
                                                <span className="text-xs font-bold text-slate-500">%</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                            <span className="text-[11px] font-bold text-slate-400 mr-1">Margin Targets:</span>
                                            {[45, 50, 55, 60, 65, 70, 75, 80].map(val => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, targetMargin: val })}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                                        bulkPriceConfig.targetMargin === val
                                                            ? 'bg-emerald-600 text-white shadow-xs'
                                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {val}% Net Margin
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* COMPARE-AT MSRP ANCHOR MODE */}
                                {bulkPriceConfig.mode === 'msrp' && (
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 mb-1">MSRP Anchor Strikethrough Strategy</p>
                                        <p className="text-[11px] text-slate-500 mb-3">
                                            Keeps retail prices unchanged while recalculating compareAtPrice to display high-converting discount badges.
                                        </p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {[
                                                { id: 'auto35', label: '+35% MSRP', desc: 'Standard 26% discount' },
                                                { id: 'auto30', label: '+30% MSRP', desc: 'Subtle anchor' },
                                                { id: 'auto50', label: '+50% MSRP', desc: 'Heavy 33% discount' },
                                                { id: 'preserve', label: 'Preserve', desc: 'Keep existing MSRP' },
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, msrpStrategy: opt.id })}
                                                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                                        bulkPriceConfig.msrpStrategy === opt.id
                                                            ? 'border-emerald-500 bg-emerald-50 text-slate-900 ring-2 ring-emerald-500/20'
                                                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                                                    }`}
                                                >
                                                    <p className="text-xs font-bold">{opt.label}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 4. Psychological Charm Rounding Formatter */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    3. Psychological Charm Price Ending
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: 'charm99', label: '.99 Endings', example: '$44.99' },
                                        { id: 'charm95', label: '.95 Endings', example: '$44.95' },
                                        { id: 'whole', label: '.00 Whole', example: '$45.00' },
                                        { id: 'none', label: 'Exact Cents', example: '$44.42' }
                                    ].map(charm => (
                                        <button
                                            key={charm.id}
                                            type="button"
                                            onClick={() => setBulkPriceConfig({ ...bulkPriceConfig, charmRounding: charm.id })}
                                            className={`p-2.5 rounded-2xl border text-center transition cursor-pointer ${
                                                bulkPriceConfig.charmRounding === charm.id
                                                    ? 'border-emerald-500 bg-emerald-50 text-slate-900 font-bold ring-2 ring-emerald-500/20'
                                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                            }`}
                                        >
                                            <p className="text-xs">{charm.label}</p>
                                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{charm.example}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 5. Live Interactive Preview Table */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        4. Live Preview (First 5 of {targetBulkProducts.length} items)
                                    </label>
                                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        Updating {targetBulkProducts.length} items in {activeStore?.name || 'Store'}
                                    </span>
                                </div>

                                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                <th className="py-2.5 px-3">Product</th>
                                                <th className="py-2.5 px-3">Current</th>
                                                <th className="py-2.5 px-3">New Price</th>
                                                <th className="py-2.5 px-3">Compare MSRP</th>
                                                <th className="py-2.5 px-3 text-right">Margin Change</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {bulkPreviewItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-6 text-center text-slate-400">
                                                        No products found in target scope.
                                                    </td>
                                                </tr>
                                            ) : (
                                                bulkPreviewItems.map(({ product, calc }) => (
                                                    <tr key={product.id} className="hover:bg-slate-50/50">
                                                        <td className="py-2.5 px-3 font-semibold text-slate-800 max-w-[180px] truncate">
                                                            {product.name}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-slate-500 font-mono">
                                                            ${calc.currentPrice.toFixed(2)}
                                                        </td>
                                                        <td className="py-2.5 px-3 font-mono font-black text-emerald-600 bg-emerald-50/50">
                                                            ${calc.finalPrice.toFixed(2)}
                                                        </td>
                                                        <td className="py-2.5 px-3 font-mono text-slate-400 line-through">
                                                            ${calc.compareAtPrice.toFixed(2)}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right font-semibold">
                                                            <span className="text-slate-400 text-[11px]">{calc.currentMargin}%</span>
                                                            <span className="text-slate-400 mx-1">➔</span>
                                                            <span className={`font-bold ${calc.newMargin >= 50 ? 'text-emerald-600' : 'text-slate-800'}`}>
                                                                {calc.newMargin}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setShowBulkPriceModal(false)}
                                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleApplyBulkPricing}
                                disabled={isApplyingBulkPrice || targetBulkProducts.length === 0}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 cursor-pointer"
                            >
                                {isApplyingBulkPrice ? (
                                    <>
                                        <RefreshCw size={14} className="animate-spin" />
                                        <span>Applying to {targetBulkProducts.length} Items...</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap size={14} className="fill-white" />
                                        <span>Apply & Save {targetBulkProducts.length} Products</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}