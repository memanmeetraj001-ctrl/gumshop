'use client'
import { assets } from "@/assets/assets"
import Image from "next/image"
import { useState, useEffect, Suspense } from "react"
import { toast } from "react-hot-toast"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/AuthContext"
import { getStoreByUserId, createProduct, getProduct, updateProduct, getAllStores } from "@/lib/firebaseDb"
import { getActiveStore, getActiveStoreSync, getAllLocalStores, setActiveStoreSlug } from "@/lib/activeStore"
import Loading from "@/components/Loading"
import { 
    Plus, 
    Trash2, 
    Palette, 
    Layers, 
    Tag, 
    TrendingUp, 
    CheckCircle2, 
    ShieldCheck, 
    Sparkles, 
    Box, 
    DollarSign,
    ExternalLink,
    Store
} from "lucide-react"

function AddProductContent() {
    const { user } = useAuth()
    const searchParams = useSearchParams()
    const productId = searchParams.get('id')
    const router = useRouter()

    const [availableStores, setAvailableStores] = useState([])
    const [selectedStore, setSelectedStore] = useState(null)

    const categories = [
        'Electronics', 
        'RC & Hobby', 
        'Wearables', 
        'Audio & Sound', 
        'Home & Kitchen', 
        'Beauty & Health', 
        'Toys & Games', 
        'Sports & Outdoors', 
        'Accessories', 
        'Others'
    ]

    const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null })
    const [productInfo, setProductInfo] = useState({
        name: "",
        description: "",
        mrp: 0,
        price: 0,
        supplierCost: 0,
        category: "RC & Hobby",
        sku: "",
        stockQuantity: 50,
        inStock: true,
        badge: "🔥 Bestseller",
        gumroadUrl: "",
    })

    // Dynamic Color Variants
    const [colorVariants, setColorVariants] = useState([
        { name: "Black", hex: "#111827" },
        { name: "Red", hex: "#E11D48" },
    ])
    const [newColorName, setNewColorName] = useState("")
    const [newColorHex, setNewColorHex] = useState("#10B981")

    // Dynamic Size/Model Variants
    const [sizeVariants, setSizeVariants] = useState([
        { name: "Standard Pack", priceDelta: 0 },
        { name: "Pro Dual Battery Kit", priceDelta: 15 },
    ])
    const [newSizeName, setNewSizeName] = useState("")
    const [newSizeDelta, setNewSizeDelta] = useState(0)

    // Key Feature Highlights
    const [features, setFeatures] = useState([
        "High-performance precision motor",
        "Includes rechargeable battery & controller"
    ])
    const [newFeatureText, setNewFeatureText] = useState("")

    const [loading, setLoading] = useState(false)

    // Load available stores and target store
    useEffect(() => {
        const loadStores = async () => {
            let stores = getAllLocalStores();
            try {
                const remote = await getAllStores();
                if (Array.isArray(remote)) {
                    const seen = new Set(stores.map(s => s.username));
                    remote.forEach(r => {
                        const slug = (r.username || r.name || r.id || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                        if (slug && !seen.has(slug)) {
                            seen.add(slug);
                            stores.push({ id: r.id || `store_${slug}`, name: r.name || slug, username: slug, ...r });
                        }
                    });
                }
            } catch {}

            setAvailableStores(stores);

            const urlStoreSlug = searchParams.get('store');
            if (urlStoreSlug) {
                const match = stores.find(s => s.username === urlStoreSlug.toLowerCase() || s.id === urlStoreSlug);
                if (match) {
                    setSelectedStore(match);
                    return;
                }
            }

            const active = getActiveStoreSync();
            if (active) {
                setSelectedStore(active);
            } else if (stores.length > 0) {
                setSelectedStore(stores[0]);
            }
        };
        loadStores();
    }, [searchParams]);

    useEffect(() => {
        const fetchProduct = async () => {
            if (productId) {
                const product = await getProduct(productId)
                if (product) {
                    setProductInfo({
                        name: product.name || "",
                        description: product.description || "",
                        mrp: product.mrp || product.compareAtPrice || Math.round((product.price || 0) * 1.35 * 100) / 100,
                        price: product.price || 0,
                        supplierCost: product.supplierCost || Math.round((product.price || 0) * 0.40 * 100) / 100,
                        category: product.category || "RC & Hobby",
                        sku: product.sku || `SKU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                        stockQuantity: product.stockQuantity || 50,
                        inStock: product.inStock !== false,
                        badge: product.badge || "🔥 Bestseller",
                        gumroadUrl: product.gumroadUrl || "",
                    })

                    if (Array.isArray(product.colors) && product.colors.length > 0) {
                        setColorVariants(product.colors)
                    }
                    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
                        setSizeVariants(product.sizes)
                    }
                    if (Array.isArray(product.features) && product.features.length > 0) {
                        setFeatures(product.features)
                    }

                    const loadedImages = { 1: null, 2: null, 3: null, 4: null }
                    const imgList = Array.isArray(product.images) && product.images.length > 0
                        ? product.images
                        : (product.image ? [product.image] : [])
                    imgList.forEach((img, index) => {
                        if (index < 4) loadedImages[index + 1] = img
                    })
                    setImages(loadedImages)
                }
            }
        }
        fetchProduct()
    }, [productId])

    const onChangeHandler = (e) => {
        const { name, value, type, checked } = e.target
        setProductInfo({ 
            ...productInfo, 
            [name]: type === 'checkbox' ? checked : value 
        })
    }

    // Color Variant Actions
    const handleAddColor = () => {
        if (!newColorName.trim()) return
        setColorVariants(prev => [...prev, { name: newColorName.trim(), hex: newColorHex }])
        setNewColorName("")
        setNewColorHex("#10B981")
    }

    const handleRemoveColor = (idx) => {
        setColorVariants(prev => prev.filter((_, i) => i !== idx))
    }

    // Size / Model Variant Actions
    const handleAddSize = () => {
        if (!newSizeName.trim()) return
        setSizeVariants(prev => [...prev, { name: newSizeName.trim(), priceDelta: parseFloat(newSizeDelta) || 0 }])
        setNewSizeName("")
        setNewSizeDelta(0)
    }

    const handleRemoveSize = (idx) => {
        setSizeVariants(prev => prev.filter((_, i) => i !== idx))
    }

    // Features Highlights Actions
    const handleAddFeature = () => {
        if (!newFeatureText.trim()) return
        setFeatures(prev => [...prev, newFeatureText.trim()])
        setNewFeatureText("")
    }

    const handleRemoveFeature = (idx) => {
        setFeatures(prev => prev.filter((_, i) => i !== idx))
    }

    // Live Margin Calculation
    const offerPrice = parseFloat(productInfo.price) || 0
    const supplierCost = parseFloat(productInfo.supplierCost) || 0
    const netProfit = Math.max(0, offerPrice - supplierCost)
    const profitMargin = offerPrice > 0 ? Math.round((netProfit / offerPrice) * 100) : 0

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            let store = selectedStore || getActiveStoreSync();
            if (!store) {
                toast.error("Please create or select an active store before adding products");
                setLoading(false);
                return;
            }

            const imageFiles = Object.values(images).filter(img => img !== null)

            if (imageFiles.length === 0) {
                toast.error("Please add at least one product image")
                setLoading(false)
                return
            }

            const convertToBase64 = (file) => new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    if (typeof window === 'undefined') return resolve(reader.result);
                    const img = document.createElement('img');
                    img.src = reader.result;
                    img.onload = () => {
                        const maxDim = 1200;
                        let { width, height } = img;
                        if (width > maxDim || height > maxDim) {
                            if (width > height) {
                                height = Math.round((height * maxDim) / width);
                                width = maxDim;
                            } else {
                                width = Math.round((width * maxDim) / height);
                                height = maxDim;
                            }
                            const canvas = document.createElement('canvas');
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                                ctx.drawImage(img, 0, 0, width, height);
                                return resolve(canvas.toDataURL('image/jpeg', 0.85));
                            }
                        }
                        resolve(reader.result);
                    };
                    img.onerror = () => resolve(reader.result);
                };
                reader.onerror = () => resolve('');
            });

            const imageUrls = await Promise.all(
                imageFiles.map(file => typeof file === 'string' ? Promise.resolve(file) : convertToBase64(file))
            );

            const payload = {
                ...productInfo,
                price: Number(productInfo.price),
                mrp: Number(productInfo.mrp),
                compareAtPrice: Number(productInfo.mrp),
                supplierCost: Number(productInfo.supplierCost),
                stockQuantity: Number(productInfo.stockQuantity),
                images: imageUrls.length > 0 ? imageUrls : ['/placeholder.svg'],
                image: imageUrls[0] || '/placeholder.svg',
                storeId: store.id,
                colors: colorVariants,
                sizes: sizeVariants,
                features: features,
                updatedAt: new Date().toISOString(),
            }

            if (productId) {
                await updateProduct(productId, payload)
                toast.success("Product and variants updated successfully! 🎉")
            } else {
                await createProduct({
                    ...payload,
                    rating: [],
                    createdAt: new Date().toISOString(),
                })
                toast.success(`Product published to "${store.name}"! 🎉`)
            }
            setActiveStoreSlug(store);
            router.push('/store/manage-product');
        } catch (error) {
            console.error("Error creating/updating product:", error)
            toast.error(error.message || "Failed to save product")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmitHandler} className="text-slate-700 max-w-4xl pb-28">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                        {productId ? 'Edit' : 'Add Dynamic'} <span className="text-emerald-600">Product</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Configure product details, color swatches, size variants, profit margins, and badges.
                    </p>
                </div>
                <button 
                    type="submit"
                    disabled={loading} 
                    className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-50 text-xs"
                >
                    <CheckCircle2 size={16} />
                    <span>{loading ? 'Saving Product...' : productId ? 'Update Product' : 'Publish Product'}</span>
                </button>
            </div>

            {/* Target Store Banner & Selector */}
            <div className="mt-6 bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-500/30">
                        <Store size={20} />
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Publish Destination Store</div>
                        <div className="text-sm font-extrabold text-white flex items-center gap-2 mt-0.5">
                            <span>{selectedStore?.name || 'No Store Selected'}</span>
                            {selectedStore?.username && (
                                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    /shop/{selectedStore.username}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {availableStores.length > 1 && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Switch store:</span>
                        <select
                            value={selectedStore?.username || ''}
                            onChange={(e) => {
                                const found = availableStores.find(s => s.username === e.target.value);
                                if (found) {
                                    setSelectedStore(found);
                                    setActiveStoreSlug(found);
                                }
                            }}
                            className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-emerald-500 cursor-pointer"
                        >
                            {availableStores.map(st => (
                                <option key={st.id || st.username} value={st.username}>
                                    {st.name} ({st.username})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Main Sections Grid */}
            <div className="mt-8 space-y-8">
                
                {/* 1. Images Upload Section */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                        <Box size={16} className="text-emerald-600" />
                        <span>Product Photos (Up to 4)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">First image will be the primary storefront cover photo.</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((num) => (
                            <label 
                                key={num} 
                                htmlFor={`image${num}`} 
                                className="cursor-pointer border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl aspect-square flex flex-col items-center justify-center p-2 bg-slate-50 hover:bg-emerald-50/30 transition overflow-hidden relative group"
                            >
                                {images[num] ? (
                                    <>
                                        <img 
                                            src={typeof images[num] === 'string' ? images[num] : URL.createObjectURL(images[num])} 
                                            alt="" 
                                            className="w-full h-full object-contain rounded-xl"
                                        />
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold transition rounded-xl">
                                            Change Photo
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-2 text-slate-400">
                                        <Plus size={24} className="mx-auto mb-1 text-slate-300" />
                                        <span className="text-[11px] font-bold block">Photo {num}</span>
                                        <span className="text-[10px] text-slate-400">{num === 1 ? 'Primary' : 'Gallery'}</span>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    id={`image${num}`} 
                                    hidden 
                                    accept="image/*"
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            setImages({ ...images, [num]: e.target.files[0] })
                                        }
                                    }} 
                                />
                            </label>
                        ))}
                    </div>
                </div>

                {/* 2. Basic Information */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                        <Tag size={16} className="text-emerald-600" />
                        <span>Basic Product Details</span>
                    </h3>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Product Title</label>
                        <input 
                            type="text" 
                            name="name" 
                            onChange={onChangeHandler} 
                            value={productInfo.name} 
                            placeholder="e.g. HGT 1:43 Mini 4WD Off-Road RC Crawler" 
                            className="w-full p-2.5 px-4 outline-none border border-slate-200 rounded-xl focus:border-emerald-500 text-xs font-semibold" 
                            required 
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                            <select 
                                onChange={e => setProductInfo({ ...productInfo, category: e.target.value })} 
                                value={productInfo.category} 
                                className="w-full p-2.5 px-4 outline-none border border-slate-200 rounded-xl focus:border-emerald-500 text-xs bg-white font-semibold"
                            >
                                {categories.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Promotional Badge</label>
                            <select 
                                name="badge"
                                value={productInfo.badge} 
                                onChange={onChangeHandler}
                                className="w-full p-2.5 px-4 outline-none border border-slate-200 rounded-xl focus:border-emerald-500 text-xs bg-white font-semibold"
                            >
                                <option value="🔥 Bestseller">🔥 Bestseller</option>
                                <option value="⚡ Limited Stock">⚡ Limited Stock</option>
                                <option value="✨ New Arrival">✨ New Arrival</option>
                                <option value="🏷️ Flash Deal 40% Off">🏷️ Flash Deal 40% Off</option>
                                <option value="⭐ Top Rated Winner">⭐ Top Rated Winner</option>
                                <option value="">None</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description</label>
                        <textarea 
                            name="description" 
                            onChange={onChangeHandler} 
                            value={productInfo.description} 
                            placeholder="Describe high-converting benefits, technical specifications, and key features..." 
                            rows={4} 
                            className="w-full p-3 px-4 outline-none border border-slate-200 rounded-xl focus:border-emerald-500 text-xs leading-relaxed" 
                            required 
                        />
                    </div>
                </div>

                {/* 3. Pricing & Profit Margin Calculator */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                        <TrendingUp size={16} className="text-emerald-600" />
                        <span>Pricing & Live Profit Calculator</span>
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">See your actual net profits per sale in real time.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Offer / Selling Price ($)</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                name="price" 
                                onChange={onChangeHandler} 
                                value={productInfo.price} 
                                placeholder="49.99" 
                                className="w-full p-2.5 px-4 outline-none border border-slate-200 rounded-xl focus:border-emerald-500 text-xs font-bold text-emerald-700" 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Compare-at / Strike Price ($)</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                name="mrp" 
                                onChange={onChangeHandler} 
                                value={productInfo.mrp} 
                                placeholder="79.99" 
                                className="w-full p-2.5 px-4 outline-none border border-slate-200 rounded-xl focus:border-emerald-500 text-xs font-semibold text-slate-400" 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Base Cost ($)</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                name="supplierCost" 
                                onChange={onChangeHandler} 
                                value={productInfo.supplierCost} 
                                placeholder="18.50" 
                                className="w-full p-2.5 px-4 outline-none border border-slate-200 rounded-xl focus:border-emerald-500 text-xs font-semibold text-slate-600" 
                            />
                        </div>
                    </div>

                    {/* Live Margin Banner */}
                    <div className="mt-4 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                                %
                            </div>
                            <div>
                                <p className="text-xs font-bold text-emerald-950">Estimated Net Profit Per Unit</p>
                                <p className="text-[11px] text-emerald-700">Calculated after supplier product cost deduction</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-emerald-600">Net Profit</p>
                                <p className="text-lg font-black text-emerald-900">+${netProfit.toFixed(2)}</p>
                            </div>
                            <div className="border-l border-emerald-300 pl-4">
                                <p className="text-[10px] uppercase font-bold text-emerald-600">Profit Margin</p>
                                <p className="text-lg font-black text-emerald-900">{profitMargin}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Dynamic Color Variants */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Palette size={16} className="text-emerald-600" />
                            <span>Color Variants</span>
                        </h3>
                        <span className="text-xs text-slate-400 font-semibold">{colorVariants.length} Colors</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">Add visual color swatches for buyers on product detail pages.</p>

                    {/* Existing Color Swatches List */}
                    <div className="flex flex-wrap gap-2.5 mb-4">
                        {colorVariants.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                                <span className="size-4 rounded-full border border-slate-300 shrink-0" style={{ backgroundColor: c.hex }} />
                                <span>{c.name}</span>
                                <button type="button" onClick={() => handleRemoveColor(idx)} className="text-slate-400 hover:text-rose-600 ml-1">
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add Color Form */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                        <input 
                            type="text" 
                            placeholder="Color name (e.g. Matte Black)" 
                            value={newColorName} 
                            onChange={(e) => setNewColorName(e.target.value)} 
                            className="px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 w-48 font-semibold"
                        />
                        <div className="flex items-center gap-1.5 px-2 py-1.5 border border-slate-200 rounded-xl bg-slate-50">
                            <input 
                                type="color" 
                                value={newColorHex} 
                                onChange={(e) => setNewColorHex(e.target.value)} 
                                className="size-6 rounded-lg cursor-pointer border-0 bg-transparent"
                            />
                            <span className="text-[11px] font-mono text-slate-500 uppercase">{newColorHex}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={handleAddColor} 
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                        >
                            <Plus size={14} />
                            <span>Add Color</span>
                        </button>
                    </div>
                </div>

                {/* 5. Dynamic Size / Model Variants */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Layers size={16} className="text-emerald-600" />
                            <span>Size / Model / Bundle Variants</span>
                        </h3>
                        <span className="text-xs text-slate-400 font-semibold">{sizeVariants.length} Variants</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">Offer 1-Pack, 2-Pack, or Pro Kits with optional price adjustments.</p>

                    {/* Existing Size Variants */}
                    <div className="space-y-2 mb-4">
                        {sizeVariants.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs">
                                <span className="font-bold text-slate-800">{s.name}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-emerald-700 font-extrabold">
                                        {s.priceDelta > 0 ? `+$${s.priceDelta.toFixed(2)}` : 'Base Price'}
                                    </span>
                                    <button type="button" onClick={() => handleRemoveSize(idx)} className="text-slate-400 hover:text-rose-600 transition">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Size Form */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                        <input 
                            type="text" 
                            placeholder="Variant name (e.g. 3-Battery Pro Kit)" 
                            value={newSizeName} 
                            onChange={(e) => setNewSizeName(e.target.value)} 
                            className="px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 w-56 font-semibold"
                        />
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400 font-bold">Price delta ($):</span>
                            <input 
                                type="number" 
                                step="0.01" 
                                placeholder="0" 
                                value={newSizeDelta} 
                                onChange={(e) => setNewSizeDelta(e.target.value)} 
                                className="px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 w-24 font-bold text-emerald-600"
                            />
                        </div>
                        <button 
                            type="button" 
                            onClick={handleAddSize} 
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                        >
                            <Plus size={14} />
                            <span>Add Variant</span>
                        </button>
                    </div>
                </div>

                {/* 6. Inventory & SKU Management */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                        <Box size={16} className="text-emerald-600" />
                        <span>Inventory & Stock Controls</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">SKU / Barcode</label>
                            <input 
                                type="text" 
                                name="sku" 
                                onChange={onChangeHandler} 
                                value={productInfo.sku} 
                                placeholder="RC-RUBICON-01" 
                                className="w-full p-2.5 px-4 outline-none border border-slate-200 rounded-xl focus:border-emerald-500 text-xs font-mono" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Stock Quantity</label>
                            <input 
                                type="number" 
                                name="stockQuantity" 
                                onChange={onChangeHandler} 
                                value={productInfo.stockQuantity} 
                                placeholder="50" 
                                className="w-full p-2.5 px-4 outline-none border border-slate-200 rounded-xl focus:border-emerald-500 text-xs font-bold" 
                            />
                        </div>
                        <div className="flex flex-col justify-end">
                            <label className="flex items-center gap-2.5 cursor-pointer p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                <input 
                                    type="checkbox" 
                                    name="inStock" 
                                    checked={productInfo.inStock} 
                                    onChange={onChangeHandler} 
                                    className="accent-emerald-600 size-4 rounded"
                                />
                                <span className="text-xs font-bold text-slate-800">Available In Stock</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* 7. Feature Highlights / Bullets */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                        <Sparkles size={16} className="text-emerald-600" />
                        <span>Key Product Highlights (Bullet Points)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Displayed right below the price to boost customer conversion.</p>

                    <ul className="space-y-2 mb-4">
                        {features.map((f, idx) => (
                            <li key={idx} className="flex items-center justify-between p-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                                <div className="flex items-center gap-2 text-slate-700 font-medium">
                                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                    <span>{f}</span>
                                </div>
                                <button type="button" onClick={() => handleRemoveFeature(idx)} className="text-slate-400 hover:text-rose-600">
                                    <Trash2 size={13} />
                                </button>
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <input 
                            type="text" 
                            placeholder="Add bullet highlight (e.g. 45-minute battery life)" 
                            value={newFeatureText} 
                            onChange={(e) => setNewFeatureText(e.target.value)} 
                            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-semibold"
                        />
                        <button 
                            type="button" 
                            onClick={handleAddFeature} 
                            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                        >
                            <Plus size={14} />
                            <span>Add</span>
                        </button>
                    </div>
                </div>

            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
                <button 
                    type="button" 
                    onClick={() => router.push('/store/manage-product')} 
                    className="px-6 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-50 text-xs"
                >
                    <CheckCircle2 size={16} />
                    <span>{loading ? 'Saving...' : productId ? 'Save Changes' : 'Publish Product'}</span>
                </button>
            </div>
        </form>
    )
}

export default function AddProduct() {
    return (
        <Suspense fallback={<Loading />}>
            <AddProductContent />
        </Suspense>
    )
}