'use client'
import React from 'react';
import { useWishlist } from '@/lib/wishlist';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/lib/features/cart/cartSlice';
import { X, Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function WishlistDrawer({ isOpen, onClose, onOpenCart }) {
    const dispatch = useDispatch();
    const { wishlist, toggle } = useWishlist();

    if (!isOpen) return null;

    const handleMoveToCart = (product) => {
        dispatch(addToCart({ productId: product.id, product }));
        toggle(product); // Remove from wishlist once added
        toast.success(`Moved "${product.name}" to cart! 🛍️`);
        if (onOpenCart) {
            onClose();
            onOpenCart();
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="size-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                                <Heart size={18} className="fill-rose-600" />
                            </div>
                            <h2 className="text-lg font-extrabold text-slate-900">Your Wishlist ({wishlist.length})</h2>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {wishlist.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                                    <Heart size={30} />
                                </div>
                                <h3 className="text-base font-bold text-slate-800">Your wishlist is empty</h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                                    Click the heart icon on any product to save it here for later.
                                </p>
                            </div>
                        ) : (
                            wishlist.map(product => (
                                <div key={product.id} className="flex gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                    <img 
                                        src={product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'} 
                                        alt="" 
                                        className="size-18 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                                    />
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{product.name}</h4>
                                            <button 
                                                onClick={() => toggle(product)}
                                                className="text-slate-400 hover:text-rose-600 p-1 transition"
                                                title="Remove"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-sm font-extrabold text-slate-900">
                                                ${parseFloat(product.price || 0).toFixed(2)}
                                            </span>
                                            <button
                                                onClick={() => handleMoveToCart(product)}
                                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                                            >
                                                <ShoppingBag size={12} />
                                                <span>Add to Cart</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-200 bg-slate-50">
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
