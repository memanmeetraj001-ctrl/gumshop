'use client'
import { useEffect, useState, useRef, useCallback } from "react"
import Loading from "../Loading"
import SellerNavbar from "./StoreNavbar"
import SellerSidebar from "./StoreSidebar"
import { useAuth } from "@/lib/AuthContext"
import { getActiveStore, getActiveStoreSync, getAllLocalStores, setActiveStoreSlug } from "@/lib/activeStore"

const StoreLayout = ({ children }) => {
    const { user, loading: authLoading } = useAuth()
    const [storeInfo, setStoreInfo] = useState(() => getActiveStoreSync())
    const [loading, setLoading] = useState(false)
    const lastInitSlugRef = useRef('')

    const initStoreAccess = useCallback(async () => {
        try {
            let targetSlug = '';
            if (typeof window !== 'undefined') {
                const sp = new URLSearchParams(window.location.search);
                targetSlug = (sp.get('store') || '').toLowerCase().trim().replace(/^store_/, '');
            }

            // Deduplicate: Don't re-run if already initialized for this targetSlug
            if (lastInitSlugRef.current === targetSlug && storeInfo) {
                return;
            }
            lastInitSlugRef.current = targetSlug;

            let store = null;
            if (targetSlug) {
                const localStores = getAllLocalStores();
                const found = localStores.find(s => (s.username || s.slug || s.id || '').toLowerCase().replace(/^store_/, '') === targetSlug);
                if (found) {
                    store = found;
                } else {
                    try {
                        const res = await fetch(`/api/store/data?slug=${encodeURIComponent(targetSlug)}`, { cache: 'no-store' });
                        if (res.ok) {
                            const data = await res.json();
                            if (data.success && data.store) {
                                store = data.store;
                            }
                        }
                    } catch {}
                }
                if (store) {
                    setActiveStoreSlug(store);
                }
            }

            if (!store) {
                store = await getActiveStore(user) || getActiveStoreSync();
            }
            if (store) setStoreInfo(store);
        } catch (err) {
            console.warn('Store layout access notice:', err);
        } finally {
            setLoading(false);
        }
    }, [user, storeInfo]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);

        if (!authLoading) {
            initStoreAccess();
        }

        // When active store changes externally, simply update local state — DO NOT re-invoke initStoreAccess!
        const handleStoreChange = () => {
            const active = getActiveStoreSync();
            if (active) setStoreInfo(active);
        };

        window.addEventListener('active_store_changed', handleStoreChange);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('active_store_changed', handleStoreChange);
        };
    }, [authLoading, initStoreAccess]);

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