'use client'
import Counter from "@/components/Counter";
import OrderSummary from "@/components/OrderSummary";
import PageTitle from "@/components/PageTitle";
import { deleteItemFromCart } from "@/lib/features/cart/cartSlice";
import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function Cart() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
    
    const { cartItems, cartProducts = {} } = useSelector(state => state.cart);
    const products = useSelector(state => state.product.list);

    const dispatch = useDispatch();

    const [cartArray, setCartArray] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);

    // Ensure products catalog is fetched if visited directly
    useEffect(() => {
        if (!products || products.length === 0) {
            import('@/lib/features/product/productSlice').then(({ fetchProducts }) => {
                dispatch(fetchProducts());
            });
        }
    }, [dispatch, products]);

    const createCartArray = () => {
        setTotalPrice(0);
        const resolved = [];
        let calculatedTotal = 0;

        for (const [key, value] of Object.entries(cartItems)) {
            if (!value || value <= 0) continue;

            // 1. Check cartProducts stored during addToCart
            let product = cartProducts[key] || (products || []).find(p => p.id === key);

            // 2. Check localStorage cached stores (for newly cloned or merchant products)
            if (!product && typeof window !== 'undefined') {
                for (let i = 0; i < localStorage.length; i++) {
                    const lsKey = localStorage.key(i);
                    if (lsKey && (lsKey.startsWith('cloned_store_') || lsKey.startsWith('store_'))) {
                        try {
                            const storeData = JSON.parse(localStorage.getItem(lsKey) || '{}');
                            const match = (storeData.products || []).find(p => p.id === key || p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === key);
                            if (match) {
                                product = match;
                                break;
                            }
                        } catch (e) {}
                    }
                }
            }

            // 3. Fallback placeholder if product was deleted but still in cart
            if (!product) {
                product = {
                    id: key,
                    name: "Purchased Store Item",
                    price: 29.99,
                    category: "Featured",
                    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"
                };
            }

            const itemPrice = parseFloat(product.price || 29.99);
            resolved.push({
                ...product,
                price: itemPrice,
                quantity: value,
            });
            calculatedTotal += itemPrice * value;
        }

        setTotalPrice(calculatedTotal);
        setCartArray(resolved);
    };

    const handleDeleteItemFromCart = (productId) => {
        dispatch(deleteItemFromCart({ productId }));
    };

    useEffect(() => {
        createCartArray();
    }, [cartItems, cartProducts, products]);

    return cartArray.length > 0 ? (
        <div className="min-h-screen mx-6 text-slate-800">

            <div className="max-w-7xl mx-auto ">
                {/* Title */}
                <PageTitle heading="My Cart" text="items in your cart" linkText="Add more" />

                <div className="flex items-start justify-between gap-5 max-lg:flex-col">

                    <table className="w-full max-w-4xl text-slate-600 table-auto">
                        <thead>
                            <tr className="max-sm:text-sm">
                                <th className="text-left">Product</th>
                                <th>Quantity</th>
                                <th>Total Price</th>
                                <th>Remove</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                cartArray.map((item, index) => (
                                    <tr key={index} className="space-x-2">
                                        <td className="flex gap-3 my-4">
                                            <div className="flex gap-3 items-center justify-center bg-slate-100 size-18 rounded-md overflow-hidden">
                                                <Image 
                                                    src={item.images?.[0] || item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"} 
                                                    className="h-14 w-auto object-cover" 
                                                    alt={item.name || "Product"} 
                                                    width={45} 
                                                    height={45} 
                                                />
                                            </div>
                                            <div>
                                                <p className="max-sm:text-sm">{item.name}</p>
                                                <p className="text-xs text-slate-500">{item.category}</p>
                                                <p>{currency}{item.price}</p>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <Counter productId={item.id} />
                                        </td>
                                        <td className="text-center">{currency}{(item.price * item.quantity).toLocaleString()}</td>
                                        <td className="text-center">
                                            <button onClick={() => handleDeleteItemFromCart(item.id)} className=" text-red-500 hover:bg-red-50 p-2 sm:p-2.5 rounded-full active:scale-95 transition-all">
                                                <Trash2Icon size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                    <OrderSummary totalPrice={totalPrice} items={cartArray} />
                </div>
            </div>
        </div>
    ) : (
        <div className="min-h-[70vh] mx-6 flex flex-col items-center justify-center text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Your cart is empty</h1>
            <p className="text-sm text-slate-500 mt-2 max-w-sm">Discover trending digital and physical products with instant 1-click checkout.</p>
            <Link 
                href="/#catalog" 
                className="mt-6 px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm"
            >
                Browse Trending Products
            </Link>
        </div>
    )
}