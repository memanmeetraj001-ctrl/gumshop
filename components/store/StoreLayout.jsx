'use client'
import { useEffect, useState } from "react"
import Loading from "../Loading"
import SellerNavbar from "./StoreNavbar"
import SellerSidebar from "./StoreSidebar"
import { useAuth } from "@/lib/AuthContext"
import { getActiveStore, getActiveStoreSync } from "@/lib/activeStore"

const StoreLayout = ({ children }) => {
    const { user, loading: authLoading } = useAuth()
    const [storeInfo, setStoreInfo] = useState(() => getActiveStoreSync())
    const [loading, setLoading] = useState(false)

    const initStoreAccess = async () => {
        try {
            const store = await getActiveStore(user);
            if (store) setStoreInfo(store);
        } catch (err) {
            console.warn('Store layout access notice:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 800);

        if (!authLoading) {
            initStoreAccess();
        }

        const handleStoreChange = () => initStoreAccess();
        window.addEventListener('active_store_changed', handleStoreChange);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('active_store_changed', handleStoreChange);
        };
    }, [user, authLoading])

    if (loading) {
        return <Loading />
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            <SellerNavbar storeInfo={storeInfo} />

            <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                <SellerSidebar storeInfo={storeInfo} />
                <div className="flex-1 h-full p-5 lg:pl-10 lg:pt-8 overflow-y-scroll">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default StoreLayout