'use client'
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    ArrowLeft, 
    Save, 
    Trash2, 
    ExternalLink, 
    Sparkles, 
    DollarSign, 
    Package, 
    Image as ImageIcon, 
    TrendingUp,
    CheckCircle2,
    Palette,
    Layers,
    Plus,
    X,
    Barcode
} from 'lucide-react';
import { getProduct, updateProduct, deleteProduct } from '@/lib/firebaseDb';
import Loading from '@/components/Loading';
import toast from 'react-hot-toast';

export default function EditProductPage() {
    const { id: productId } = useParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        compareAtPrice: '',
        supplierCost: '',
        category: 'Electronics',
        image: '',
        images: [''],
        description: '',
        inStock: true
    });

    // Variants and Inventory
    const [sku, setSku] = useState('');
    const [stockQuantity, setStockQuantity] = useState(50);
    const [colorVariants, setColorVariants] = useState([]);
    const [newColorName, setNewColorName] = useState('');
    const [newColorHex, setNewColorHex] = useState('#10B981');
    const [sizeVariants, setSizeVariants] = useState([]);
    const [newSizeName, setNewSizeName] = useState('');
    const [newSizeDelta, setNewSizeDelta] = useState(0);

    useEffect(() => {
        const loadProduct = async () => {
            setLoading(true);
            try {
                let prod = await getProduct(productId);

                if (!prod && typeof window !== 'undefined') {
                    // Check local edge storage
                    const raw = localStorage.getItem(`gumshop_db_products/${productId}`);
                    if (raw) prod = JSON.parse(raw);

                    if (!prod) {
                        for (let i = 0; i < localStorage.length; i++) {
                            const k = localStorage.key(i);
                            if (k && (k.startsWith('cloned_store_') || k.startsWith('store_'))) {
                                try {
                                    const store = JSON.parse(localStorage.getItem(k) || '{}');
                                    const match = (store.products || []).find(p => p.id === productId);
                                    if (match) { prod = match; break; }
                                } catch {}
                            }
                        }
                    }
                }

                if (prod) {
                    const retail = parseFloat(prod.price || 0);
                    const compareAt = parseFloat(prod.compareAtPrice || Math.round(retail * 1.35 * 100) / 100);
                    const supplier = parseFloat(prod.supplierCost || Math.round(retail * 0.35 * 100) / 100);
                    const mainImg = prod.image || (prod.images && prod.images[0]) || '';
                    const allImgs = prod.images && prod.images.length > 0 ? prod.images : [mainImg];

                    setFormData({
                        name: prod.name || '',
                        price: retail,
                        compareAtPrice: compareAt,
                        supplierCost: supplier,
                        category: prod.category || 'Featured',
                        image: mainImg,
                        images: allImgs,
                        description: prod.description || '',
                        inStock: prod.inStock !== false
                    });

                    setSku(prod.sku || `SKU-${prod.id?.substring(0, 6)?.toUpperCase() || 'PROD'}`);
                    setStockQuantity(prod.stockQuantity !== undefined ? prod.stockQuantity : 50);
                    setColorVariants(Array.isArray(prod.colors) ? prod.colors : []);
                    setSizeVariants(Array.isArray(prod.sizes) ? prod.sizes : []);
                } else {
                    toast.error('Product not found');
                }
            } catch (err) {
                console.error('Error loading product:', err);
            } finally {
                setLoading(false);
            }
        };

        if (productId) loadProduct();
    }, [productId]);

    // Color Variant Actions
    const handleAddColor = () => {
        if (!newColorName.trim()) return;
        setColorVariants(prev => [...prev, { name: newColorName.trim(), hex: newColorHex }]);
        setNewColorName('');
        setNewColorHex('#10B981');
    };

    const handleRemoveColor = (idx) => {
        setColorVariants(prev => prev.filter((_, i) => i !== idx));
    };

    // Size Variant Actions
    const handleAddSize = () => {
        if (!newSizeName.trim()) return;
        setSizeVariants(prev => [...prev, { name: newSizeName.trim(), priceDelta: parseFloat(newSizeDelta) || 0 }]);
        setNewSizeName('');
        setNewSizeDelta(0);
    };

    const handleRemoveSize = (idx) => {
        setSizeVariants(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.error('Please enter a product name');
        setIsSaving(true);

        try {
            const retail = parseFloat(formData.price) || 0;
            const compareAt = parseFloat(formData.compareAtPrice) || Math.round(retail * 1.35 * 100) / 100;
            const supplier = parseFloat(formData.supplierCost) || 0;
            const cleanedImages = (formData.images || []).filter(img => typeof img === 'string' && img.trim());

            const updatedData = {
                name: formData.name.trim(),
                price: retail,
                compareAtPrice: compareAt,
                mrp: compareAt,
                supplierCost: supplier,
                category: formData.category,
                image: formData.image || cleanedImages[0] || '',
                images: cleanedImages.length > 0 ? cleanedImages : (formData.image ? [formData.image] : []),
                description: formData.description.trim(),
                inStock: formData.inStock,
                sku: sku.trim(),
                stockQuantity: Number(stockQuantity) || 0,
                colors: colorVariants,
                sizes: sizeVariants,
                updatedAt: new Date().toISOString()
            };

            await updateProduct(productId, updatedData);
            toast.success(`"${formData.name}" saved successfully! 🚀`);
            router.push('/store/manage-product');
        } catch (err) {
            console.error('Save product error:', err);
            toast.error(err.message || 'Failed to save product changes');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to permanently delete "${formData.name}"?`)) return;
        setIsDeleting(true);
        try {
            await deleteProduct(productId);
            toast.success('Product removed from catalog');
            router.push('/store/manage-product');
        } catch (err) {
            toast.error('Failed to delete product');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <Loading />;

    const retailPrice = parseFloat(formData.price) || 0;
    const supplierCost = parseFloat(formData.supplierCost) || 0;
    const netProfit = Math.max(0, retailPrice - supplierCost);
    const marginPercent = retailPrice > 0 ? Math.round((netProfit / retailPrice) * 100) : 0;

    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto mb-20 font-sans">
            {/* Top Navigation */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200">
                <Link
                    href="/store/manage-product"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Products</span>
                </Link>

                <div className="flex items-center gap-2">
                    <Link
                        href={`/product/${productId}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                    >
                        <span>View Live</span>
                        <ExternalLink size={12} />
                    </Link>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                    >
                        <Trash2 size={13} />
                        <span>Delete</span>
                    </button>
                </div>
            </div>

            {/* Form */}
            <div className="mt-8">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Product & Variants</h1>
                            <p className="text-xs text-slate-500 mt-0.5">Customize pricing, stock, colors, sizes, and attributes</p>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                        >
                            <Save size={16} />
                            <span>{isSaving ? 'Saving Changes...' : 'Save Product'}</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Info */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Title & Description */}
                            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        Product Title
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                                        placeholder="e.g. HGT 1:43 Mini 4WD Off-Road RC Crawler"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        Description & Features
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition"
                                        placeholder="Write an engaging product description with key specs and highlights..."
                                    />
                                </div>
                            </div>

                            {/* Dynamic Color Variants */}
                            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Palette size={16} className="text-emerald-600" />
                                        Color Variants ({colorVariants.length})
                                    </h3>
                                    <span className="text-[11px] text-slate-400">Buyers select swatch on product page</span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {colorVariants.map((c, idx) => (
                                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
                                            <span className="size-3.5 rounded-full border border-slate-300 shadow-xs" style={{ backgroundColor: c.hex }} />
                                            <span>{c.name}</span>
                                            <button type="button" onClick={() => handleRemoveColor(idx)} className="text-slate-400 hover:text-rose-600 ml-1">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {colorVariants.length === 0 && (
                                        <span className="text-xs text-slate-400 italic">No color variants added yet.</span>
                                    )}
                                </div>

                                <div className="pt-2 flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Color name (e.g. Matte Black)"
                                        value={newColorName}
                                        onChange={e => setNewColorName(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white"
                                    />
                                    <input
                                        type="color"
                                        value={newColorHex}
                                        onChange={e => setNewColorHex(e.target.value)}
                                        className="size-9 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddColor}
                                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                                    >
                                        <Plus size={14} />
                                        <span>Add Color</span>
                                    </button>
                                </div>
                            </div>

                            {/* Size & Edition Variants */}
                            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Layers size={16} className="text-emerald-600" />
                                        Size & Package Editions ({sizeVariants.length})
                                    </h3>
                                    <span className="text-[11px] text-slate-400">Custom pricing delta per size</span>
                                </div>

                                <div className="space-y-2">
                                    {sizeVariants.map((s, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
                                            <span>{s.name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-emerald-700 font-bold">
                                                    {s.priceDelta > 0 ? `+$${s.priceDelta.toFixed(2)}` : 'Standard Price'}
                                                </span>
                                                <button type="button" onClick={() => handleRemoveSize(idx)} className="text-slate-400 hover:text-rose-600">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {sizeVariants.length === 0 && (
                                        <span className="text-xs text-slate-400 italic">No package size variants added yet.</span>
                                    )}
                                </div>

                                <div className="pt-2 flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Edition name (e.g. Pro Bundle + Battery)"
                                        value={newSizeName}
                                        onChange={e => setNewSizeName(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white"
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Price +$ (e.g. 15.00)"
                                        value={newSizeDelta}
                                        onChange={e => setNewSizeDelta(e.target.value)}
                                        className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddSize}
                                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                                    >
                                        <Plus size={14} />
                                        <span>Add Size</span>
                                    </button>
                                </div>
                            </div>

                            {/* Pricing & Margins */}
                            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <DollarSign size={16} className="text-emerald-600" />
                                    Pricing & Profit Economics
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Retail Price ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Original MSRP ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.compareAtPrice}
                                            onChange={e => setFormData({ ...formData, compareAtPrice: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Supplier Cost ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.supplierCost}
                                            onChange={e => setFormData({ ...formData, supplierCost: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="p-3.5 bg-emerald-50 border border-emerald-200/60 rounded-2xl flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={16} className="text-emerald-600" />
                                        <span className="font-semibold text-slate-700">Estimated Net Profit / Sale:</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-emerald-700 text-sm">+${netProfit.toFixed(2)}</span>
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                                            {marginPercent}% Margin
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-6">
                            {/* Inventory & Status */}
                            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Barcode size={16} className="text-emerald-600" />
                                    Inventory & Tracking
                                </h3>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Product SKU</label>
                                    <input
                                        type="text"
                                        value={sku}
                                        onChange={e => setSku(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                                        placeholder="e.g. SKU-HGT-RC43"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Stock Quantity (Units)</label>
                                    <input
                                        type="number"
                                        value={stockQuantity}
                                        onChange={e => setStockQuantity(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                                        placeholder="e.g. 50"
                                        min="0"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <span className="text-xs font-semibold text-slate-700">In Stock for Delivery</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.inStock}
                                            onChange={e => setFormData({ ...formData, inStock: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>

                                <div className="pt-2 border-t border-slate-100">
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                                    >
                                        <option value="RC & Hobby">RC & Hobby</option>
                                        <option value="Wearables">Wearables</option>
                                        <option value="Audio">Audio</option>
                                        <option value="Accessories">Accessories</option>
                                        <option value="Home & Decor">Home & Decor</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Featured">Featured</option>
                                    </select>
                                </div>
                            </div>

                            {/* Image Preview & URL */}
                            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <ImageIcon size={16} className="text-slate-500" />
                                    Product Visuals
                                </h3>

                                <div className="aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
                                    {formData.image ? (
                                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Package size={32} className="text-slate-400" />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Image URL</label>
                                    <input
                                        type="url"
                                        value={formData.image}
                                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white font-mono"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
