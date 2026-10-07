'use client'
import { useEffect, useState } from "react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import { DeleteIcon } from "lucide-react"
import { getAllCoupons, createCoupon as dbCreateCoupon, deleteCoupon as dbDeleteCoupon, getProductsByStore } from "@/lib/firebaseDb"
import { getActiveStore, getActiveStoreSync } from "@/lib/activeStore"
import { useAuth } from "@/lib/AuthContext"

export default function StoreCoupons() {

    const { user, loading: authLoading } = useAuth()
    const [store, setStore] = useState(() => getActiveStoreSync())
    const [products, setProducts] = useState([])
    const [coupons, setCoupons] = useState([])
    const [loading, setLoading] = useState(false)

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        description: '',
        discount: '',
        productId: 'ALL',
        expiresAt: new Date()
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
            setProducts(storeProducts)

            const data = await getAllCoupons()
            // Filter coupons to show those belonging to this store or global promos
            setCoupons(data.filter(c => !c.storeId || c.storeId === currentStore.id))
        } catch (err) {
            console.error("Error fetching data:", err)
        }
        setLoading(false)
    }

    const handleAddCoupon = async (e) => {
        e.preventDefault()
        let currentStore = store || await getActiveStore(user) || getActiveStoreSync();
        if (!currentStore) {
            toast.error("No active store found");
            return;
        }
        setStore(currentStore);
        try {
            await dbCreateCoupon({
                ...newCoupon,
                code: newCoupon.code.trim().toUpperCase(),
                storeId: currentStore.id,
                productId: newCoupon.productId === 'ALL' ? null : newCoupon.productId,
                discount: Number(newCoupon.discount),
                expiresAt: new Date(newCoupon.expiresAt).toISOString(),
                forNewUser: false,
                forMember: false,
                isPublic: true,
            })
            toast.success("Coupon added successfully! 🎉")
            setNewCoupon({
                code: '', description: '', discount: '', productId: 'ALL', expiresAt: new Date()
            })
            fetchData()
        } catch (err) {
            console.error(err)
            toast.error("Failed to add coupon")
        }
    }

    const handleChange = (e) => {
        setNewCoupon({ ...newCoupon, [e.target.name]: e.target.value })
    }

    const handleDeleteCoupon = async (code) => {
        await dbDeleteCoupon(code)
        setCoupons(prev => prev.filter(c => c.code !== code))
        toast.success("Coupon deleted!")
    }

    useEffect(() => {
        fetchData()
    }, [user, authLoading])

    if (!store && loading) return <div className="p-8 text-center text-slate-400">Loading coupons...</div>

    if (!store) return <div className="text-slate-500">You do not have a store yet.</div>

    return (
        <div className="text-slate-500 mb-40">

            {/* Add Coupon */}
            <form onSubmit={(e) => toast.promise(handleAddCoupon(e), { loading: "Adding coupon..." })} className="max-w-sm text-sm">
                <h2 className="text-2xl">Store <span className="text-slate-800 font-medium">Coupons</span></h2>
                <div className="flex gap-2 max-sm:flex-col mt-2">
                    <input type="text" placeholder="Coupon Code" className="w-full mt-2 p-2 border border-slate-200 outline-slate-400 rounded-md"
                        name="code" value={newCoupon.code} onChange={handleChange} required
                    />
                    <input type="number" placeholder="Discount (%)" min={1} max={100} className="w-full mt-2 p-2 border border-slate-200 outline-slate-400 rounded-md"
                        name="discount" value={newCoupon.discount} onChange={handleChange} required
                    />
                </div>
                <input type="text" placeholder="Coupon Description" className="w-full mt-2 p-2 border border-slate-200 outline-slate-400 rounded-md"
                    name="description" value={newCoupon.description} onChange={handleChange} required
                />
                
                <label>
                    <p className="mt-3">Apply To</p>
                    <select name="productId" value={newCoupon.productId} onChange={handleChange} className="w-full mt-1 p-2 border border-slate-200 outline-slate-400 rounded-md">
                        <option value="ALL">All Store Products</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </label>

                <label>
                    <p className="mt-3">Coupon Expiry Date</p>
                    <input type="date" placeholder="Coupon Expires At" className="w-full mt-1 p-2 border border-slate-200 outline-slate-400 rounded-md"
                        name="expiresAt" value={newCoupon.expiresAt ? (newCoupon.expiresAt instanceof Date ? format(newCoupon.expiresAt, 'yyyy-MM-dd') : String(newCoupon.expiresAt).slice(0, 10)) : ''} onChange={handleChange}
                    />
                </label>

                <button className="mt-4 p-2 px-10 rounded bg-slate-700 text-white active:scale-95 transition">Add Coupon</button>
            </form>

            {/* List Coupons */}
            <div className="mt-14">
                <h2 className="text-2xl">List <span className="text-slate-800 font-medium">Coupons</span></h2>
                <div className="overflow-x-auto mt-4 rounded-lg border border-slate-200 max-w-4xl">
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Code</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Description</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Discount</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Applies To</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Expires At</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {coupons.map((coupon) => (
                                <tr key={coupon.code} className="hover:bg-slate-50">
                                    <td className="py-3 px-4 font-medium text-slate-800">{coupon.code}</td>
                                    <td className="py-3 px-4 text-slate-800">{coupon.description}</td>
                                    <td className="py-3 px-4 text-slate-800">{coupon.discount}%</td>
                                    <td className="py-3 px-4 text-slate-800">{coupon.productId ? products.find(p => p.id === coupon.productId)?.name || 'Specific Product' : 'All Products'}</td>
                                    <td className="py-3 px-4 text-slate-800">{coupon.expiresAt ? format(new Date(coupon.expiresAt), 'yyyy-MM-dd') : 'N/A'}</td>
                                    <td className="py-3 px-4 text-slate-800">
                                        <DeleteIcon onClick={() => toast.promise(handleDeleteCoupon(coupon.code), { loading: "Deleting coupon..." })} className="w-5 h-5 text-red-500 hover:text-red-800 cursor-pointer" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
