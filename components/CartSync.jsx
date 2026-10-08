'use client'
import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "@/lib/AuthContext";
import { updateUserCart, getUserCart } from "@/lib/firebaseDb";
import { setCart } from "@/lib/features/cart/cartSlice";

export default function CartSync() {
    const { user, loading } = useAuth();
    const cart = useSelector(state => state.cart);
    const dispatch = useDispatch();
    const isFirstRender = useRef(true);
    const hasHydrated = useRef(false);

    // 1. Initial hydration on mount from LocalStorage or Firebase
    useEffect(() => {
        const hydrateCart = async () => {
            try {
                if (user && !loading) {
                    const remoteCart = await getUserCart(user.uid);
                    if (remoteCart && remoteCart.cartItems && Object.keys(remoteCart.cartItems).length > 0) {
                        dispatch(setCart(remoteCart));
                        hasHydrated.current = true;
                        return;
                    }
                }

                if (typeof window !== 'undefined') {
                    const localCart = localStorage.getItem('gumshop_cart') || localStorage.getItem('gumshop_guest_cart');
                    if (localCart) {
                        const parsed = JSON.parse(localCart);
                        if (parsed && parsed.cartItems && Object.keys(parsed.cartItems).length > 0) {
                            dispatch(setCart(parsed));
                        }
                    }
                }
            } catch (e) {
                console.warn("Cart hydration notice:", e);
            } finally {
                hasHydrated.current = true;
            }
        };

        hydrateCart();
    }, [user, loading, dispatch]);

    // 2. Persist cart updates to LocalStorage (for guests) and Firebase (for authenticated users)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (!hasHydrated.current) return;

        try {
            if (typeof window !== 'undefined') {
                const serialized = JSON.stringify({
                    total: cart.total,
                    cartItems: cart.cartItems,
                    cartProducts: cart.cartProducts
                });
                localStorage.setItem('gumshop_cart', serialized);
                localStorage.setItem('gumshop_guest_cart', serialized);
            }
        } catch {}

        if (user && !loading) {
            updateUserCart(user.uid, cart).catch(err => {
                console.warn("Firebase cart sync notice:", err);
            });
        }
    }, [cart, user, loading]);

    return null;
}
