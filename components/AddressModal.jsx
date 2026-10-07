'use client'
import { XIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { useDispatch } from "react-redux"
import { addAddress } from "@/lib/features/address/addressSlice"
import { createAddress } from "@/lib/firebaseDb"
import { useAuth } from "@/lib/AuthContext"

const AddressModal = ({ setShowAddressModal }) => {

    const dispatch = useDispatch()
    const { user } = useAuth()

    const [address, setAddress] = useState({
        name: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: ''
    })

    const handleAddressChange = (e) => {
        setAddress({
            ...address,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const userId = user?.uid || (typeof window !== 'undefined' ? localStorage.getItem('gumshop_guest_uid') || `guest_${Date.now()}` : 'guest_user');
            if (typeof window !== 'undefined' && !localStorage.getItem('gumshop_guest_uid')) {
                localStorage.setItem('gumshop_guest_uid', userId);
            }
            const addressData = { ...address, userId }
            let addressId = `addr_${Date.now()}`;
            try {
                addressId = await createAddress(addressData) || addressId;
            } catch (err) {}

            dispatch(addAddress({ id: addressId, ...addressData }))
            toast.success("Delivery address saved! 📦")
            setShowAddressModal(false)
        } catch (error) {
            console.error("Error saving address:", error)
            toast.error("Failed to save address")
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 relative animate-in zoom-in-95">
                <button 
                    type="button" 
                    onClick={() => setShowAddressModal(false)}
                    className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full transition"
                >
                    <XIcon size={20} />
                </button>

                <h2 className="text-2xl font-black text-slate-900 mb-1">Shipping <span className="text-emerald-600">Address</span></h2>
                <p className="text-xs text-slate-500 mb-5">Enter your delivery details for express tracking.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-slate-700 text-sm">
                    <input name="name" onChange={handleAddressChange} value={address.name} className="p-2.5 px-3.5 outline-none border border-slate-200 focus:border-emerald-500 rounded-xl w-full text-xs" type="text" placeholder="Full Name" required />
                    <input name="email" onChange={handleAddressChange} value={address.email} className="p-2.5 px-3.5 outline-none border border-slate-200 focus:border-emerald-500 rounded-xl w-full text-xs" type="email" placeholder="Email Address for tracking" required />
                    <input name="street" onChange={handleAddressChange} value={address.street} className="p-2.5 px-3.5 outline-none border border-slate-200 focus:border-emerald-500 rounded-xl w-full text-xs" type="text" placeholder="Street Address (e.g. 123 Main St)" required />
                    <div className="grid grid-cols-2 gap-2.5">
                        <input name="city" onChange={handleAddressChange} value={address.city} className="p-2.5 px-3.5 outline-none border border-slate-200 focus:border-emerald-500 rounded-xl w-full text-xs" type="text" placeholder="City" required />
                        <input name="state" onChange={handleAddressChange} value={address.state} className="p-2.5 px-3.5 outline-none border border-slate-200 focus:border-emerald-500 rounded-xl w-full text-xs" type="text" placeholder="State / Province" required />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                        <input name="zip" onChange={handleAddressChange} value={address.zip} className="p-2.5 px-3.5 outline-none border border-slate-200 focus:border-emerald-500 rounded-xl w-full text-xs" type="text" placeholder="Postal / Zip Code" required />
                        <input name="country" onChange={handleAddressChange} value={address.country} className="p-2.5 px-3.5 outline-none border border-slate-200 focus:border-emerald-500 rounded-xl w-full text-xs" type="text" placeholder="Country (e.g. US)" required />
                    </div>
                    <input name="phone" onChange={handleAddressChange} value={address.phone} className="p-2.5 px-3.5 outline-none border border-slate-200 focus:border-emerald-500 rounded-xl w-full text-xs" type="tel" placeholder="Phone Number (for courier updates)" required />
                    <button type="submit" className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/20 active:scale-98 transition">
                        Save Address & Continue
                    </button>
                </form>
            </div>
        </div>
    )
}

export default AddressModal