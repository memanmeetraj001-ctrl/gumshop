'use client'
import Image from "next/image";
import { DotIcon } from "lucide-react";
import { useSelector } from "react-redux";
import Rating from "./Rating";
import { useState } from "react";
import RatingModal from "./RatingModal";

const OrderItem = ({ order }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
    const [ratingModal, setRatingModal] = useState(null);

    const { ratings } = useSelector(state => state.rating);

    return (
        <>
            <tr className="text-sm">
                <td className="text-left">
                    <div className="flex flex-col gap-6">
                        {((order.orderItems && order.orderItems.length > 0)
                            ? order.orderItems
                            : [{
                                name: typeof order.items === 'string' ? order.items : (order.productName || order.product?.name || 'Order Item'),
                                price: order.total || order.amount || 0,
                                quantity: order.quantity || 1,
                                image: order.image || order.product?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100',
                                productId: order.productId || `prod_${order.id || 0}`
                            }]
                        ).map((item, index) => {
                            const prodId = item.product?.id || item.productId || `prod_${index}`;
                            const prodName = item.product?.name || item.name || 'Order Item';
                            const prodImg = item.product?.images?.[0] || item.product?.image || item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100';

                            return (
                                <div key={index} className="flex items-center gap-4">
                                    <div className="w-16 aspect-square bg-slate-100 flex items-center justify-center rounded-xl overflow-hidden shrink-0">
                                        <img
                                            className="h-full w-full object-cover"
                                            src={prodImg}
                                            alt={prodName}
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center text-sm">
                                        <p className="font-semibold text-slate-800 text-sm sm:text-base">{prodName}</p>
                                        <p className="text-slate-500 text-xs mt-0.5">{currency}{item.price} • Qty: {item.quantity}</p>
                                        <p className="text-[11px] text-slate-400 mt-1">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}</p>
                                        <div className="mt-1">
                                            {ratings.find(rating => order.id === rating.orderId && prodId === rating.productId)
                                                ? <Rating value={ratings.find(rating => order.id === rating.orderId && prodId === rating.productId).rating} />
                                                : <button onClick={() => setRatingModal({ orderId: order.id, productId: prodId })} className={`text-emerald-600 hover:text-emerald-700 text-xs font-semibold transition ${order.status !== "DELIVERED" && 'hidden'}`}>Rate Product</button>
                                            }
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </td>

                <td className="text-center max-md:hidden font-bold text-slate-900">{currency}{order.total}</td>

                <td className="text-left max-md:hidden text-xs text-slate-600">
                    {typeof order.address === 'object' && order.address !== null ? (
                        <>
                            <p className="font-semibold text-slate-800">{order.address.name || 'Customer'}</p>
                            <p>{order.address.street}</p>
                            <p>{order.address.city}{order.address.state ? `, ${order.address.state}` : ''} {order.address.zip}</p>
                            {order.address.phone && <p className="text-slate-400">{order.address.phone}</p>}
                        </>
                    ) : (
                        <p>{order.address || 'Standard Delivery'}</p>
                    )}
                </td>

                <td className="text-left space-y-2 text-sm max-md:hidden">
                    <div
                        className={`flex items-center justify-center gap-1 rounded-full p-1 capitalize ${
                            (order.status || '').toUpperCase() === 'PROCESSING' || (order.status || '').toUpperCase() === 'SHIPPED'
                            ? 'text-yellow-600 bg-yellow-100'
                            : (order.status || '').toUpperCase() === 'DELIVERED' || (order.status || '').toUpperCase() === 'COMPLETED'
                                ? 'text-emerald-600 bg-emerald-100'
                                : 'text-slate-600 bg-slate-100'
                            }`}
                    >
                        <DotIcon size={10} className="scale-250" />
                        {String(order.status || 'Processing').replace(/_/g, ' ').toLowerCase()}
                    </div>
                </td>
            </tr>
            {/* Mobile */}
            <tr className="md:hidden">
                <td colSpan={5} className="py-3 px-2 text-xs">
                    {typeof order.address === 'object' && order.address !== null ? (
                        <>
                            <p className="font-semibold text-slate-800">{order.address.name || 'Customer'}</p>
                            <p>{order.address.street || ''} {order.address.city || ''}</p>
                            {order.address.phone && <p className="text-slate-400">{order.address.phone}</p>}
                        </>
                    ) : (
                        <p>{order.address || 'Standard Delivery'}</p>
                    )}
                    <div className="flex items-center mt-2">
                        <span className='px-4 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs capitalize'>
                            {String(order.status || 'Processing').replace(/_/g, ' ').toLowerCase()}
                        </span>
                    </div>
                </td>
            </tr>
            <tr>
                <td colSpan={4}>
                    <div className="border-b border-slate-300 w-6/7 mx-auto" />
                </td>
            </tr>
            {ratingModal && <RatingModal ratingModal={ratingModal} setRatingModal={setRatingModal} />}
        </>
    )
}

export default OrderItem