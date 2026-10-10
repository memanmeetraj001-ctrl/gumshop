'use client'
import { ArrowRight, StarIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

const ProductDescription = ({ product }) => {

    const [selectedTab, setSelectedTab] = useState('Description')

    return (
        <div className="my-18 text-sm text-slate-600">

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6 max-w-2xl">
                {['Description', 'Reviews'].map((tab, index) => (
                    <button className={`${tab === selectedTab ? 'border-b-[1.5px] font-semibold' : 'text-slate-400'} px-3 py-2 font-medium`} key={index} onClick={() => setSelectedTab(tab)}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* Description / Story Lander */}
            {selectedTab === "Description" && (
                <div className="max-w-3xl space-y-6">
                    {product.bodyHtml ? (
                        <div 
                            className="prose prose-slate max-w-none text-slate-700 leading-relaxed [&_h1]:text-2xl [&_h1]:font-black [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-sm [&_p]:text-sm [&_p]:leading-relaxed [&_img]:rounded-2xl [&_img]:shadow-md [&_img]:my-4"
                            dangerouslySetInnerHTML={{ __html: product.bodyHtml }}
                        />
                    ) : (
                        <p className="max-w-xl text-base leading-relaxed text-slate-700 whitespace-pre-line">
                            {product.description}
                        </p>
                    )}
                </div>
            )}

            {/* Reviews */}
            {selectedTab === "Reviews" && (
                <div className="flex flex-col gap-3 mt-8">
                    {Array.isArray(product.rating) && product.rating.length > 0 ? (
                        product.rating.map((item, index) => (
                            <div key={index} className="flex gap-5 mb-8 pb-6 border-b border-slate-100 last:border-0">
                                <img src={item.user?.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} alt="" className="size-10 rounded-full object-cover shrink-0" />
                                <div>
                                    <div className="flex items-center gap-1" >
                                        {Array(5).fill('').map((_, starIdx) => (
                                            <StarIcon key={starIdx} size={15} className='text-transparent' fill={(item.rating || 5) >= starIdx + 1 ? "#10B981" : "#E2E8F0"} />
                                        ))}
                                    </div>
                                    <p className="text-sm max-w-lg my-2 text-slate-700">{item.review}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span className="font-semibold text-slate-800">{item.user?.name || "Customer"}</span>
                                        <span>•</span>
                                        <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Verified Purchase'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-xs">No reviews submitted for this product yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Store Page */}
            {product.store && (
                <div className="flex gap-3 mt-14">
                    <Image src={product.store?.logo || "/placeholder.png"} alt="" className="size-11 rounded-full ring ring-slate-400" width={100} height={100} />
                    <div>
                        <p className="font-medium text-slate-600">Product by {product.store?.name}</p>
                        <Link href={`/shop/${product.store?.username}`} className="flex items-center gap-1.5 text-green-500"> view store <ArrowRight size={14} /></Link>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProductDescription