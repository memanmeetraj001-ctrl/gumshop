'use client'

import { notFound } from 'next/navigation';
import { use } from 'react';
import StoreShop from '@/app/(public)/shop/[username]/page';

const RESERVED_ROUTES = new Set([
    'admin', 
    'api', 
    'cart', 
    'checkout', 
    'contact', 
    'create-store', 
    'creator', 
    'dashboard', 
    'login', 
    'orders', 
    'policies', 
    'product', 
    'settings', 
    'shop', 
    'store', 
    'thank-you', 
    'track', 
    'favicon.ico',
    'robots.txt',
    'sitemap.xml'
]);

export default function DirectStorePageRoute({ params }) {
    const resolvedParams = params ? (typeof params.then === 'function' ? use(params) : params) : null;
    const cleanSlug = (resolvedParams?.username || '').toLowerCase().trim();

    if (RESERVED_ROUTES.has(cleanSlug)) {
        notFound();
    }

    return <StoreShop params={params} />;
}
