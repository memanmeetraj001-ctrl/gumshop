import { NextResponse } from 'next/server';
import { getAllStores } from '@/lib/db/stores.js';
import { getAllProductsWithStores } from '@/lib/db/products.js';

const INDEXNOW_KEY = 'c4b8e5f2a1b94c3d8e7f1a2b3c4d5e6f';
const HOST = 'gumshop.online';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

export async function submitToIndexNow(urls) {
    if (!Array.isArray(urls) || urls.length === 0) return { success: false, error: 'No URLs provided' };

    const payload = {
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: KEY_LOCATION,
        urlList: urls.slice(0, 10000) // IndexNow limit per request
    };

    try {
        const res = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(payload)
        });

        // 200 or 202 is success in IndexNow protocol
        const ok = res.status === 200 || res.status === 202;
        return {
            success: ok,
            status: res.status,
            submittedCount: payload.urlList.length
        };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// GET: Gathers active URLs and submits them to IndexNow
export async function GET() {
    try {
        const baseUrl = `https://${HOST}`;
        const urls = [
            baseUrl,
            `${baseUrl}/shop`,
            `${baseUrl}/llms.txt`,
            `${baseUrl}/llms-full.txt`
        ];

        // Add creator & shop URLs
        try {
            const stores = await getAllStores();
            if (Array.isArray(stores)) {
                stores.forEach(s => {
                    const slug = s.username || s.slug;
                    if (slug && !slug.includes('test') && !slug.startsWith('_')) {
                        urls.push(`${baseUrl}/creator/${slug}`);
                        urls.push(`${baseUrl}/shop/${slug}`);
                    }
                });
            }
        } catch (e) {
            console.warn('[indexnow] Failed to fetch stores:', e.message);
        }

        // Add products (top 50 active items)
        try {
            const products = await getAllProductsWithStores();
            if (Array.isArray(products)) {
                products.slice(0, 100).forEach(p => {
                    if (p.id && !String(p.id).includes('test')) {
                        urls.push(`${baseUrl}/product/${p.id}`);
                    }
                });
            }
        } catch (e) {
            console.warn('[indexnow] Failed to fetch products:', e.message);
        }

        const result = await submitToIndexNow(urls);
        return NextResponse.json({
            status: 'ok',
            indexNowResult: result,
            sampleUrls: urls.slice(0, 5)
        });
    } catch (err) {
        return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
    }
}

// POST: Custom URL submission
export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const urls = body.urls || [];
        if (!Array.isArray(urls) || urls.length === 0) {
            return NextResponse.json({ status: 'error', message: 'urls array is required' }, { status: 400 });
        }

        const result = await submitToIndexNow(urls);
        return NextResponse.json({ status: 'ok', indexNowResult: result });
    } catch (err) {
        return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
    }
}
