'use client'
import { useState, useEffect } from 'react';

const WISHLIST_KEY = 'gumshop_wishlist';

export function getWishlist() {
    if (typeof window === 'undefined') return [];
    try {
        const item = localStorage.getItem(WISHLIST_KEY);
        return item ? JSON.parse(item) : [];
    } catch {
        return [];
    }
}

export function toggleWishlist(product) {
    if (typeof window === 'undefined' || !product) return false;
    try {
        const current = getWishlist();
        const exists = current.some(p => p.id === product.id);
        let updated;
        if (exists) {
            updated = current.filter(p => p.id !== product.id);
        } else {
            updated = [...current, product];
        }
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('wishlist_updated'));
        return !exists;
    } catch {
        return false;
    }
}

export function useWishlist() {
    const [wishlist, setWishlist] = useState([]);

    useEffect(() => {
        setWishlist(getWishlist());
        const handleUpdate = () => setWishlist(getWishlist());
        window.addEventListener('wishlist_updated', handleUpdate);
        return () => window.removeEventListener('wishlist_updated', handleUpdate);
    }, []);

    const toggle = (product) => toggleWishlist(product);
    const has = (productId) => wishlist.some(p => p.id === productId);

    return { wishlist, toggle, has, count: wishlist.length };
}
