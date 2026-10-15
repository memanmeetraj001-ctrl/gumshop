'use client'
import { addToCart, removeFromCart } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";

const Counter = ({ productId }) => {

    const cartItems = useSelector(state => state?.cart?.cartItems) || {};
    const count = (productId && cartItems[productId]) ? cartItems[productId] : 0;

    const dispatch = useDispatch();

    const addToCartHandler = () => {
        if (productId) dispatch(addToCart({ productId }));
    }

    const removeFromCartHandler = () => {
        if (productId) dispatch(removeFromCart({ productId }));
    }

    return (
        <div className="inline-flex items-center gap-1 sm:gap-3 px-3 py-1 rounded border border-slate-200 max-sm:text-sm text-slate-600">
            <button onClick={removeFromCartHandler} className="p-1 select-none cursor-pointer">-</button>
            <p className="p-1 min-w-5 text-center font-bold">{count}</p>
            <button onClick={addToCartHandler} className="p-1 select-none cursor-pointer">+</button>
        </div>
    )
}

export default Counter