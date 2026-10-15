import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { designateHomepageStore, resolveHomepageStore } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const HOMEPAGE_COOKIE_NAME = 'gumshop_homepage_store';
const HOMEPAGE_MODE_COOKIE_NAME = 'gumshop_homepage_mode';

const NO_CACHE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
};

export async function GET() {
    try {
        let cookieSlug = '';
        let cookieMode = 'single';
        try {
            const cookieStore = await cookies();
            cookieSlug = cookieStore.get(HOMEPAGE_COOKIE_NAME)?.value || '';
            cookieMode = cookieStore.get(HOMEPAGE_MODE_COOKIE_NAME)?.value || 'single';
        } catch {}

        const result = await resolveHomepageStore(cookieSlug);
        return NextResponse.json({
            ...result,
            homepageMode: cookieMode === 'all' ? 'all' : 'single'
        }, { status: result.status || 200, headers: NO_CACHE_HEADERS });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: NO_CACHE_HEADERS });
    }
}

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const rawSlug = body.storeSlug ?? body.username ?? body.storeId ?? body.id ?? '';
        const requestedMode = body.mode === 'all' ? 'all' : (body.mode === 'single' ? 'single' : (rawSlug ? 'single' : null));

        let cookieStore = null;
        try {
            cookieStore = await cookies();
        } catch {}

        if (requestedMode === 'all') {
            if (cookieStore) {
                try {
                    cookieStore.set(HOMEPAGE_MODE_COOKIE_NAME, 'all', {
                        httpOnly: false,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        path: '/',
                        maxAge: 60 * 60 * 24 * 30
                    });
                } catch {}
            }

            const current = await resolveHomepageStore();
            return NextResponse.json({
                success: true,
                status: 200,
                homepageMode: 'all',
                homepageSlug: current.homepageSlug,
                homepageStore: current.homepageStore,
                totalStores: current.totalStores,
                message: 'All shops marketplace mode enabled for homepage'
            }, { status: 200, headers: NO_CACHE_HEADERS });
        }

        // Single store mode
        if (rawSlug) {
            const result = await designateHomepageStore(rawSlug);
            if (!result.success) {
                return NextResponse.json(result, { status: result.status || 400, headers: NO_CACHE_HEADERS });
            }

            if (cookieStore) {
                try {
                    cookieStore.set(HOMEPAGE_COOKIE_NAME, result.homepageSlug, {
                        httpOnly: false,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        path: '/',
                        maxAge: 60 * 60 * 24 * 30
                    });
                    cookieStore.set(HOMEPAGE_MODE_COOKIE_NAME, 'single', {
                        httpOnly: false,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        path: '/',
                        maxAge: 60 * 60 * 24 * 30
                    });
                } catch {}
            }

            return NextResponse.json({
                ...result,
                homepageMode: 'single'
            }, { status: result.status || 200, headers: NO_CACHE_HEADERS });
        }

        // Just toggle to single mode without changing designated store
        if (cookieStore) {
            try {
                cookieStore.set(HOMEPAGE_MODE_COOKIE_NAME, 'single', {
                    httpOnly: false,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',
                    maxAge: 60 * 60 * 24 * 30
                });
            } catch {}
        }

        const current = await resolveHomepageStore();
        return NextResponse.json({
            ...current,
            homepageMode: 'single',
            message: 'Single store mode enabled for homepage'
        }, { status: 200, headers: NO_CACHE_HEADERS });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: NO_CACHE_HEADERS });
    }
}
