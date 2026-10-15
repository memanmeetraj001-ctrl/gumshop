import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { designateHomepageStore, resolveHomepageStore } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const HOMEPAGE_COOKIE_NAME = 'gumshop_homepage_store';

const NO_CACHE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
};

export async function GET() {
    try {
        let cookieSlug = '';
        try {
            const cookieStore = await cookies();
            cookieSlug = cookieStore.get(HOMEPAGE_COOKIE_NAME)?.value || '';
        } catch {}

        const result = await resolveHomepageStore(cookieSlug);
        return NextResponse.json(result, { status: result.status || 200, headers: NO_CACHE_HEADERS });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: NO_CACHE_HEADERS });
    }
}

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const rawSlug = body.storeSlug ?? body.username ?? body.storeId ?? body.id ?? '';

        const result = await designateHomepageStore(rawSlug);
        if (!result.success) {
            return NextResponse.json(result, { status: result.status || 400, headers: NO_CACHE_HEADERS });
        }

        // Set persistent 30-day cookie
        try {
            const cookieStore = await cookies();
            cookieStore.set(HOMEPAGE_COOKIE_NAME, result.homepageSlug, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 30
            });
        } catch {}

        return NextResponse.json(result, { status: result.status || 200, headers: NO_CACHE_HEADERS });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: NO_CACHE_HEADERS });
    }
}
