'use client'
import { useEffect, useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import Loading from "@/components/Loading";
import { useAuth } from "@/lib/AuthContext";
import { getStoreByUserId, getProductsByStore, updateProduct, deleteProduct, createProduct, isProductDeleted, isJunkProductName } from "@/lib/firebaseDb";
import { getActiveStore, getActiveStoreSync } from "@/lib/activeStore";
import { useRouter } from "next/navigation";
import { 
    Calculator, 
    Trash2, 
    Edit3, 
    ExternalLink, 
    Sparkles, 
    Plus, 
    TrendingUp, 
    X, 
    Save, 
    CheckCircle2, 
    Search, 
    Copy, 
    Eye, 
    CheckSquare, 
    Square, 
    ArrowUpDown, 
    SlidersHorizontal,
    Percent,
    Tag
} from "lucide-react";
import Link from "next/link";

export default function StoreManageProducts() {
    const currency = '$';
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [activeStore, setActiveStore] = useState(null);

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

    const fetchProducts = async () => {
        try {
            let store = await Promise.race([
                getActiveStore(user),
                new Promise(resolve => setTimeout(() => resolve(getActiveStoreSync()), 1200))
            ]);
            if (!store) store = getActiveStoreSync();
            setActiveStore(store);

            if (store) {
                const storeSlug = (store.username || store.name || 'shop').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                const storeId = store.id || `store_${storeSlug}`;

                // 1. Query products strictly scoped to this store
                let data = [];
                try {
                    data = await Promise.race([
                        getProductsByStore(storeId),
                        new Promise(resolve => setTimeout(() => resolve([]), 1500))
                    ]);
                } catch (e) {
                    console.warn("Products query fallback:", e);
                }

                // 2. If empty, check embedded products[] in this store object
                if ((!data || data.length === 0) && Array.isArray(store.products) && store.products.length > 0) {
                    data = store.products
                        .filter(p => p && !isProductDeleted(p.id))
                        .map(p => ({ ...p, storeId }));
                }

                // 3. Scan sessionStorage ONLY for this specific store (cloned_store_${storeSlug})
                if ((!data || data.length === 0) && typeof window !== 'undefined') {
                    try {
                        const cached = JSON.parse(sessionStorage.getItem(`cloned_store_${storeSlug}`) || 'null');
                        if (cached && Array.isArray(cached.products) && cached.products.length > 0) {
                            data = cached.products
                                .filter(p => p && !isProductDeleted(p.id))
                                .map(p => ({ ...p, storeId }));
                        }
                    } catch {}
                }

                // Filter out any tombstoned deleted products and dummy/placeholder items (Partial Payment, etc.)
                const sanitized = (data || []).filter(p => p && p.id && !isProductDeleted(p.id) && !isJunkProductName(p.name || p.title) && (p.price === undefined || parseFloat(p.price) > 0));
                setProducts(sanitized);
            }
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
        await updateProduct(productId, { price: p });
        setProducts(prev => prev.map(item => item.id === productId ? { ...item, price: p } : item));
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

    // Bulk Price Markup (e.g. +10%, +20%)
    const handleBulkMarkup = async (percentMultiplier) => {
        if (selectedIds.length === 0) return;
        setIsBulkActing(true);
        try {
            const updates = selectedIds.map(async (id) => {
                const p = products.find(prod => prod.id === id);
                if (!p) return;
                const newPrice = Math.round((parseFloat(p.price || 0) * (1 + percentMultiplier)) * 100) / 100;
                const currentCompare = parseFloat(p.compareAtPrice || p.mrp || 0);
                const updatedCompare = currentCompare > newPrice ? currentCompare : Math.round(newPrice * 1.3 * 100) / 100;
                await updateProduct(id, { price: newPrice, compareAtPrice: updatedCompare, mrp: updatedCompare });
                return { id, newPrice, compareAtPrice: updatedCompare };
            });
            const results = await Promise.all(updates);
            setProducts(prev => prev.map(p => {
                const match = results.find(r => r?.id === p.id);
                return match ? { ...p, price: match.newPrice, compareAtPrice: match.compareAtPrice, mrp: match.compareAtPrice } : p;
            }));
            toast.success(`Applied +${Math.round(percentMultiplier * 100)}% markup to ${selectedIds.length} products! 🚀`);
            setSelectedIds([]);
        } catch (err) {
            toast.error("Bulk price markup failed");
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
        const compareAt = parseFloat(product.compareAtPrice || product.mrp || Math.round(retail * 1.35 * 100) / 100);
        const img = product.image || (product.images && product.images[0]) || '';

        setEditingProduct(product);
        setEditForm({
            name: product.name || '',
            price: retail,
            compareAtPrice: compareAt,
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
            const updatedData = {
                name: editForm.name,
                price: parseFloat(editForm.price) || 0,
                compareAtPrice: parseFloat(editForm.compareAtPrice) || 0,
                mrp: parseFloat(editForm.compareAtPrice) || 0,
                supplierCost: parseFloat(editForm.supplierCost) || 0,
                category: editForm.category,
                image: editForm.image,
                images: editForm.image ? [editForm.image] : (editingProduct.images || []),
                description: editForm.description,
                inStock: editForm.inStock,
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
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1200);

        if (!authLoading) {
            fetchProducts();
        }

        return () => clearTimeout(timer);
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
                        href="/store/cloner"
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
                            <button
                                onClick={() => handleBulkStock(true)}
                                disabled={isBulkActing}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 transition"
                            >
                                In Stock
                            </button>
                            <button
                                onClick={() => handleBulkStock(false)}
                                disabled={isBulkActing}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 transition"
                            >
                                Out of Stock
                            </button>
                            <button
                                onClick={() => handleBulkMarkup(0.10)}
                                disabled={isBulkActing}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-sky-400 transition"
                            >
                                +10% Price
                            </button>
                            <button
                                onClick={() => handleBulkMarkup(0.20)}
                                disabled={isBulkActing}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-sky-400 transition"
                            >
                                +20% Price
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={isBulkActing}
                                className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600 text-xs font-bold text-rose-300 hover:text-white transition flex items-center gap-1"
                            >
                                <Trash2 size={13} />
                                <span>Delete ({selectedIds.length})</span>
                            </button>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white"
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
                                                <Link href="/store/cloner" className="text-emerald-600 font-bold hover:underline mt-2 inline-block">
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
                                                        className="w-20 px-2 py-1 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-extrabold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
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
                                                        className="w-20 px-2 py-1 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white transition"
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
                                                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                                                        title="View Live on Storefront"
                                                    >
                                                        <Eye size={15} />
                                                    </Link>

                                                    {/* 1-Click Duplicate Product */}
                                                    <button
                                                        onClick={() => handleDuplicateProduct(product)}
                                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                                                        title="Duplicate Product (1-Click Copy)"
                                                    >
                                                        <Copy size={15} />
                                                    </button>

                                                    {/* Edit Modal */}
                                                    <button
                                                        onClick={() => handleOpenEditModal(product)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-xl transition"
                                                        title="Full Quick Edit"
                                                    >
                                                        <Edit3 size={13} className="text-emerald-600" />
                                                        <span>Edit</span>
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
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
        </div>
    );
}