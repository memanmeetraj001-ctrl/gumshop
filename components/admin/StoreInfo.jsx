'use client'
import { MapPin, Mail, Phone, Store, User } from "lucide-react"
import { getSafeImageUrl, handleImageError } from "@/lib/imageUtils"

const StoreInfo = ({store}) => {
    const storeDp = store?.logo || store?.avatar || store?.logo_url || store?.bioProfile?.avatar || (Array.isArray(store?.products) && store?.products[0]?.image);
    return (
        <div className="flex-1 space-y-2 text-sm">
            {storeDp ? (
                <img 
                    src={getSafeImageUrl(storeDp)} 
                    alt={store.name || "Store"} 
                    className="max-w-20 max-h-20 object-contain shadow rounded-full max-sm:mx-auto" 
                    onError={(e) => handleImageError(e, 'avatar')}
                />
            ) : (
                <div className="w-20 h-20 shadow rounded-full max-sm:mx-auto bg-slate-100 flex items-center justify-center text-slate-400">
                    <Store size={32} />
                </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
                <h3 className="text-xl font-semibold text-slate-800"> {store.name} </h3>
                <span className="text-sm">@{store.username}</span>

                {/* Status Badge */}
                <span
                    className={`text-xs font-semibold px-4 py-1 rounded-full ${store.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : store.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                        }`}
                >
                    {store.status}
                </span>
            </div>

            <p className="text-slate-600 my-5 max-w-2xl">{store.description}</p>
            <p className="flex items-center gap-2"> <MapPin size={16} /> {store.address}</p>
            <p className="flex items-center gap-2"><Phone size={16} /> {store.contact}</p>
            <p className="flex items-center gap-2"><Mail size={16} />  {store.email}</p>
            <p className="text-slate-700 mt-5">Applied  on <span className="text-xs">{store.createdAt ? new Date(store.createdAt).toLocaleDateString() : 'N/A'}</span> by</p>
            <div className="flex items-center gap-2 text-sm ">
                {store.user?.image ? (
                    <img 
                        src={getSafeImageUrl(store.user.image)} 
                        alt={store.user.name || "User"} 
                        className="w-9 h-9 rounded-full object-cover" 
                        onError={(e) => handleImageError(e, 'avatar')}
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <User size={20} />
                    </div>
                )}
                <div>
                    <p className="text-slate-600 font-medium">{store.user?.name}</p>
                    <p className="text-slate-400">{store.user?.email}</p>
                </div>
            </div>
        </div>
    )
}

export default StoreInfo