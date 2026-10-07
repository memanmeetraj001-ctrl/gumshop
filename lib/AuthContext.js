'use client';
import { createContext, useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setCart, clearCart } from "@/lib/features/cart/cartSlice";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();

    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                const storedUser = localStorage.getItem('gumshop_auth_user');
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    setUser(parsed);
                } else {
                    // Default merchant user for instant personal use
                    const defaultUser = {
                        uid: "merchant_owner_01",
                        name: "Store Owner",
                        email: "me.manmeetraj001@gmail.com",
                        image: "",
                        role: "storeOwner"
                    };
                    setUser(defaultUser);
                    localStorage.setItem('gumshop_auth_user', JSON.stringify(defaultUser));
                }
            }
        } catch (e) {
            console.warn("Auth initialization notice:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Sign up
    const signUp = async (email, password, name) => {
        const newUser = {
            uid: `user_${Date.now()}`,
            name: name || "Merchant",
            email,
            image: "",
            role: "storeOwner"
        };
        setUser(newUser);
        if (typeof window !== 'undefined') {
            localStorage.setItem('gumshop_auth_user', JSON.stringify(newUser));
        }
        return newUser;
    };

    // Sign in
    const signIn = async (email, password) => {
        const existing = {
            uid: `user_${Date.now()}`,
            name: email.split('@')[0],
            email,
            image: "",
            role: "storeOwner"
        };
        setUser(existing);
        if (typeof window !== 'undefined') {
            localStorage.setItem('gumshop_auth_user', JSON.stringify(existing));
        }
        return existing;
    };

    // Google Sign in
    const signInWithGoogle = async () => {
        const googleUser = {
            uid: "google_owner_01",
            name: "Manmeet Raj",
            email: "me.manmeetraj001@gmail.com",
            image: "",
            role: "storeOwner"
        };
        setUser(googleUser);
        if (typeof window !== 'undefined') {
            localStorage.setItem('gumshop_auth_user', JSON.stringify(googleUser));
        }
        return googleUser;
    };

    // Sign out
    const logout = async () => {
        setUser(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('gumshop_auth_user');
        }
        dispatch(clearCart());
    };

    return (
        <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
