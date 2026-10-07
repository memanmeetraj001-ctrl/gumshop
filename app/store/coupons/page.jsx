'use client'
import React, { useEffect, useState, useMemo } from "react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import { 
    TicketPercent, 
    Trash2, 
    Copy, 
    Check, 
    Plus, 
    Sparkles, 
    Clock, 
    DollarSign, 
    Percent, 
    Truck, 
    Tag, 
    ShoppingBag, 
    Calendar,
    AlertCircle
} from "lucide-react"
import { getAllCoupons, createCoupon as dbCreateCoupon, deleteCoupon as dbDeleteCoupon, getProductsByStore } from "@/lib/firebaseDb"
import { getActiveStore, getActiveStoreSync } from "@/lib/activeStore"
import { useAuth } from "@/lib/AuthContext"
import Loading from "@/components/Loading"

export default function StoreCoupons() {
    const { user, loading: authLoading } = useAuth()
    const [store, setStore] = useState(() => getActiveStoreSync())
    const [products, setProducts] = useState([])
    const [coupons, setCoupons] = useState([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [copiedCode, setCopiedCode] = useState(null)

    // Coupon Builder State
    const [couponType, setCouponType] = useState('percentage') // 'percentage' | 'fixed' | 'shipping'
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        description: '',
        discount: 15,
        minSpend: 0,
        usageLimit: 0, // 0 = unlimited
        productId: 'ALL',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
    })

    const fetchData = async () => {
        try {
            let currentStore = await getActiveStore(user) || getActiveStoreSync();
            if (!currentStore) {
                setLoading(false);
                return;
            }
            setStore(currentStore);

            const storeProducts = await getProductsByStore(currentStore.id)
            setProducts(storeProducts || [])

            const data = await getAllCoupons()
            setCoupons((data || []).filter(c => !c.storeId || c.storeId === currentStore.id))
        } catch (err) {
            console.error("Error fetching coupons:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [user, authLoading])

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast.success(`Copied "${code}" to clipboard! 📋`);
        setTimeout(() => setCopiedCode(null), 2000);
    }

    const handleAddCoupon = async (e) => {
        e.preventDefault()
        let currentStore = store || await getActiveStore(user) || getActiveStoreSync();
        if (!currentStore) {
            toast.error("No active store found");
            return;
        }

        if (!newCoupon.code.trim()) {
            toast.error("Please enter a valid coupon code");
            return;
        }

        setIsSubmitting(true);
        try {
            const cleanCode = newCoupon.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
            const discountValue = couponType === 'shipping' ? 100 : Number(newCoupon.discount);

            await dbCreateCoupon({
                ...newCoupon,
                code: cleanCode,
                storeId: currentStore.id,
                type: couponType,
                discount: discountValue,
                minSpend: Number(newCoupon.minSpend) || 0,
                usageLimit: Number(newCoupon.usageLimit) || 0,
                productId: newCoupon.productId === 'ALL' ? null : newCoupon.productId,
                expiresAt: new Date(newCoupon.expiresAt).toISOString(),
                forNewUser: false,
                forMember: false,
                isPublic: true,
                createdAt: new Date().toISOString()
            });

            toast.success(`Coupon ${cleanCode} created successfully! 🎉`);
            setNewCoupon({
                code: '',
                description: '',
                discount: couponType === 'percentage' ? 15 : 10,
                minSpend: 0,
                usageLimit: 0,
                productId: 'ALL',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error("Failed to create coupon code");
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleDeleteCoupon = async (code) => {
        if (!confirm(`Delete coupon "${code}"?`)) return;
        try {
            await dbDeleteCoupon(code);
            setCoupons(prev => prev.filter(c => c.code !== code));
            toast.success("Coupon removed!");
        } catch {
            toast.error("Failed to delete coupon");
        }
    }

    if (loading) return <Loading />

    if (!store) {
        return (
            <div className="p-8 text-center text-slate-500">
                <AlertCircle className="mx-auto size-8 text-amber-500 mb-2" />
                <p className="font-bold">No active store found</p>
                <p className="text-xs text-slate-400 mt-1">Please create or select a store in your Master Dashboard first.</p>
            </div>
        )
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                            <TicketPercent size={20} />
                        </span>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Discounts & Promotions Engine</h1>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Create high-converting discount codes, flash sale coupons, and minimum spend rules for {store.name}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {coupons.length} Active Promotions
                    </span>
                </div>
            </div>

            {/* Main Layout: Create Form (Left) & Coupons List (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Form Column */}
                <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Create New Promotion</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Configure discounts that apply automatically at checkout</p>
                    </div>

                    {/* Promotion Type Selector */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                            Discount Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'percentage', label: 'Percentage', icon: Percent },
                                { id: 'fixed', label: 'Fixed Amount', icon: DollarSign },
                                { id: 'shipping', label: 'Free Shipping', icon: Truck },
                            ].map(t => {
                                const Icon = t.icon;
                                const isSelected = couponType === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setCouponType(t.id)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition gap-1.5 ${
                                            isSelected 
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs' 
                                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Icon size={16} className={isSelected ? 'text-emerald-600' : 'text-slate-400'} />
                                        <span>{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <form onSubmit={handleAddCoupon} className="space-y-4">
                        {/* Coupon Code Input */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Coupon Code
                            </label>
                            <input 
                                type="text"
                                placeholder="e.g. FLASH20, SUMMER50, FREESHIP"
                                value={newCoupon.code}
                                onChange={e => setNewCoupon(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                required
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-wider uppercase outline-none focus:border-emerald-500 focus:bg-white transition"
                            />
                        </div>

                        {/* Value Input (Percentage or Fixed) */}
                        {couponType !== 'shipping' && (
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    {couponType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount ($)'}
                                </label>
                                <div className="relative">
                                    <input 
                                        type="number"
                                        min="1"
                                        max={couponType === 'percentage' ? 100 : 10000}
                                        value={newCoupon.discount}
                                        onChange={e => setNewCoupon(prev => ({ ...prev, discount: e.target.value }))}
                                        required
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition pr-10"
                                    />
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                        {couponType === 'percentage' ? '%' : '$'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Customer Description
                            </label>
                            <input 
                                type="text"
                                placeholder="e.g. 20% off all summer collection orders"
                                value={newCoupon.description}
                                onChange={e => setNewCoupon(prev => ({ ...prev, description: e.target.value }))}
                                required
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                            />
                        </div>

                        {/* Minimum Spend & Usage Limit */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Min Spend ($)
                                </label>
                                <input 
                                    type="number"
                                    min="0"
                                    placeholder="0 = No min"
                                    value={newCoupon.minSpend || ''}
                                    onChange={e => setNewCoupon(prev => ({ ...prev, minSpend: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Usage Limit
                                </label>
                                <input 
                                    type="number"
                                    min="0"
                                    placeholder="0 = Unlimited"
                                    value={newCoupon.usageLimit || ''}
                                    onChange={e => setNewCoupon(prev => ({ ...prev, usageLimit: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>
                        </div>

                        {/* Applies To Product */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Applies To
                            </label>
                            <select
                                value={newCoupon.productId}
                                onChange={e => setNewCoupon(prev => ({ ...prev, productId: e.target.value }))}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white transition"
                            >
                                <option value="ALL">Entire Store Inventory</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Expiry Date */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Expiration Date
                            </label>
                            <input 
                                type="date"
                                value={newCoupon.expiresAt instanceof Date ? format(newCoupon.expiresAt, 'yyyy-MM-dd') : String(newCoupon.expiresAt).slice(0, 10)}
                                onChange={e => setNewCoupon(prev => ({ ...prev, expiresAt: new Date(e.target.value) }))}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            <Plus size={15} />
                            <span>{isSubmitting ? "Generating Promotion..." : "Create Coupon Code"}</span>
                        </button>
                    </form>
                </div>

                {/* Coupons List Column */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-900">Active Coupons ({coupons.length})</h3>
                        <span className="text-xs text-slate-400">Buyers apply these codes in cart</span>
                    </div>

                    {coupons.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
                            <TicketPercent size={32} className="mx-auto text-slate-300 mb-2" />
                            <p className="font-bold text-slate-700">No active promotions yet</p>
                            <p className="text-xs text-slate-400 mt-1">Create your first coupon on the left to boost conversion rates.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {coupons.map((c) => {
                                const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                                const isCopied = copiedCode === c.code;

                                return (
                                    <div 
                                        key={c.code}
                                        className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2.5">
                                                <span className="font-mono font-extrabold text-sm text-slate-900 tracking-wider bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                                                    {c.code}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(c.code)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition"
                                                    title="Copy coupon code"
                                                >
                                                    {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                                </button>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                    isExpired ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                                                }`}>
                                                    {isExpired ? 'Expired' : 'Active'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 font-medium">{c.description}</p>
                                            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                                                <span>
                                                    {c.type === 'shipping' ? 'Free Shipping' : `${c.discount}${c.type === 'fixed' ? '$' : '%'} OFF`}
                                                </span>
                                                {c.minSpend > 0 && <span>• Min spend: ${c.minSpend}</span>}
                                                {c.expiresAt && <span>• Expires: {format(new Date(c.expiresAt), 'MMM dd, yyyy')}</span>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCoupon(c.code)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                                                title="Delete Coupon"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
