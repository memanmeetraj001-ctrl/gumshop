'use client'
import React from 'react';
import Link from 'next/link';
import { Truck, CheckCircle2, Clock, Globe, ArrowLeft, Package, MapPin } from 'lucide-react';

export default function ShippingPolicyPage() {
    return (
        <div className="bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition mb-6"
                >
                    <ArrowLeft size={14} />
                    <span>Return to Home</span>
                </Link>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-12 shadow-sm">
                    {/* Header */}
                    <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                        <div className="size-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <Truck size={24} />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                Delivery Information
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                                Shipping & Delivery Policy
                            </h1>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Fast, Tracked Worldwide Delivery • Processing within 24–48 Hours
                            </p>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="mt-8 space-y-8 text-sm text-slate-600 leading-relaxed">
                        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <Clock size={20} className="text-emerald-600 mb-2" />
                                <h3 className="font-bold text-slate-900 text-xs">24–48 Hour Processing</h3>
                                <p className="text-[11px] text-slate-500 mt-1">Orders are packed and dispatched swiftly within 1–2 business days.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <Globe size={20} className="text-emerald-600 mb-2" />
                                <h3 className="font-bold text-slate-900 text-xs">Worldwide Coverage</h3>
                                <p className="text-[11px] text-slate-500 mt-1">Direct air delivery to USA, Canada, UK, Europe, Australia, and 120+ countries.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <Package size={20} className="text-emerald-600 mb-2" />
                                <h3 className="font-bold text-slate-900 text-xs">Tracked Shipments</h3>
                                <p className="text-[11px] text-slate-500 mt-1">Every package includes a live postal tracking number with step-by-step milestones.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-slate-900 mb-2">
                                1. Estimated Delivery Timelines
                            </h2>
                            <div className="overflow-x-auto rounded-2xl border border-slate-200 mt-3">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                                            <th className="p-3">Destination Region</th>
                                            <th className="p-3">Estimated Transit Time</th>
                                            <th className="p-3">Carrier Partners</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr>
                                            <td className="p-3 font-bold text-slate-900">United States & Canada</td>
                                            <td className="p-3 text-slate-700">3–7 Business Days</td>
                                            <td className="p-3 text-slate-500">USPS Priority / FedEx / Canada Post</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-bold text-slate-900">United Kingdom & Europe</td>
                                            <td className="p-3 text-slate-700">4–8 Business Days</td>
                                            <td className="p-3 text-slate-500">Royal Mail / DHL / DPD</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-bold text-slate-900">Australia & New Zealand</td>
                                            <td className="p-3 text-slate-700">5–9 Business Days</td>
                                            <td className="p-3 text-slate-500">Australia Post / CouriersPlease</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-bold text-slate-900">Rest of the World</td>
                                            <td className="p-3 text-slate-700">7–14 Business Days</td>
                                            <td className="p-3 text-slate-500">Local Postal Services / YunExpress</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-slate-900 mb-2">
                                2. Tracking Your Order
                            </h2>
                            <p>
                                Once your parcel ships, you will receive an automated email containing your tracking code. You can also monitor your live package status directly on our portal at any time:
                            </p>
                            <Link
                                href="/track"
                                className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                            >
                                <Package size={14} />
                                <span>Go to Order Tracking Portal →</span>
                            </Link>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-slate-900 mb-2">
                                3. Customs, Duties & Taxes
                            </h2>
                            <p>
                                Orders shipped to standard domestic destinations are free of unexpected duties. For international territories, any local customs duties or VAT applicable under local law are the responsibility of the customer.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
