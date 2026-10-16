import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { designateHomepageStore, resolveHomepageStore } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const HOMEPAGE_COOKIE_NAME = 'gumshop_homepage_store';
const HOMEPAGE_MODE_COOKIE_NAME = 'gumshop_homepage_mode';
const HOMEPAGE_STORES_COOKIE_NAME = 'gumshop_homepage_stores';

const NO_CACHE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
};

export async function GET() {
    try {
        let cookieSlug = '';
        let cookieMode = 'single';
        let selectedStores = [];
        try {
            const cookieStore = await cookies();
            cookieSlug = cookieStore.get(HOMEPAGE_COOKIE_NAME)?.value || '';
            cookieMode = cookieStore.get(HOMEPAGE_MODE_COOKIE_NAME)?.value || 'single';
            const rawStores = cookieStore.get(HOMEPAGE_STORES_COOKIE_NAME)?.value || '';
            if (rawStores) {
                try {
                    selectedStores = JSON.parse(rawStores);
                } catch {
                    selectedStores = rawStores.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
                }
            }
        } catch {}

        const result = await resolveHomepageStore(cookieSlug);
        return NextResponse.json({
            ...result,
            homepageMode: (cookieMode === 'all' || cookieMode === 'custom') ? cookieMode : 'single',
            selectedStores: Array.isArray(selectedStores) && selectedStores.length > 0 ? selectedStores : ['rubber-couch-toys-official-store', 'phantompaws-headless-horseman-pet-costume']
        }, { status: result.status || 200, headers: NO_CACHE_HEADERS });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: NO_CACHE_HEADERS });
    }
}

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const rawSlug = body.storeSlug ?? body.username ?? body.storeId ?? body.id ?? '';
        const incomingStores = Array.isArray(body.selectedStores) 
            ? body.selectedStores.map(s => String(s).toLowerCase().trim().replace(/^store_/, '')).filter(Boolean)
            : null;

        let requestedMode = body.mode;
        if (!requestedMode) {
            if (incomingStores && incomingStores.length > 0) requestedMode = 'custom';
            else if (rawSlug) requestedMode = 'single';
        }

        let cookieStore = null;
        try {
            cookieStore = await cookies();
        } catch {}

        const cookieOptions = {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30
        };

        // Persist selectedStores if provided
        if (incomingStores && cookieStore) {
            try {
                cookieStore.set(HOMEPAGE_STORES_COOKIE_NAME, JSON.stringify(incomingStores), cookieOptions);
            } catch {}
        }

        // 1. All Shops Marketplace Mode
        if (requestedMode === 'all') {
            if (cookieStore) {
                try {
                    cookieStore.set(HOMEPAGE_MODE_COOKIE_NAME, 'all', cookieOptions);
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
                selectedStores: incomingStores || ['rubber-couch-toys-official-store', 'phantompaws-headless-horseman-pet-costume'],
                message: 'All shops combined marketplace mode enabled for homepage'
            }, { status: 200, headers: NO_CACHE_HEADERS });
        }

        // 2. Custom Multi-Store Selection Mode
        if (requestedMode === 'custom') {
            if (cookieStore) {
                try {
                    cookieStore.set(HOMEPAGE_MODE_COOKIE_NAME, 'custom', cookieOptions);
                } catch {}
            }

            const current = await resolveHomepageStore();
            return NextResponse.json({
                success: true,
                status: 200,
                homepageMode: 'custom',
                homepageSlug: current.homepageSlug,
                homepageStore: current.homepageStore,
                totalStores: current.totalStores,
                selectedStores: incomingStores || [],
                message: 'Custom multi-store selection enabled for homepage'
            }, { status: 200, headers: NO_CACHE_HEADERS });
        }

        // 3. Single Store Mode
        if (rawSlug) {
            const result = await designateHomepageStore(rawSlug);
            if (!result.success) {
                return NextResponse.json(result, { status: result.status || 400, headers: NO_CACHE_HEADERS });
            }

            if (cookieStore) {
                try {
                    cookieStore.set(HOMEPAGE_COOKIE_NAME, result.homepageSlug, cookieOptions);
                    cookieStore.set(HOMEPAGE_MODE_COOKIE_NAME, 'single', cookieOptions);
                } catch {}
            }

            return NextResponse.json({
                ...result,
                homepageMode: 'single',
                selectedStores: incomingStores || [result.homepageSlug]
            }, { status: result.status || 200, headers: NO_CACHE_HEADERS });
        }

        // Toggle to single mode preserving existing homepage store
        if (cookieStore) {
            try {
                cookieStore.set(HOMEPAGE_MODE_COOKIE_NAME, 'single', cookieOptions);
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
