import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { serverGetAllStores, serverGetStore, serverSaveStore } from '@/lib/serverDb';

const HOMEPAGE_COOKIE_NAME = 'gumshop_homepage_store';
globalThis.__gumshop_homepage_slug = globalThis.__gumshop_homepage_slug || '';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const cookieSlug = cookieStore.get(HOMEPAGE_COOKIE_NAME)?.value || '';
        const effectiveSlug = (cookieSlug || globalThis.__gumshop_homepage_slug || '').toLowerCase().trim();

        const allStores = await serverGetAllStores();
        let homepageStore = null;

        if (effectiveSlug && allStores.length > 0) {
            homepageStore = allStores.find(s => 
                (s.username && s.username.toLowerCase() === effectiveSlug) ||
                (s.id && (s.id.toLowerCase() === effectiveSlug || s.id.toLowerCase() === `store_${effectiveSlug}`))
            ) || null;
        }

        // If not found by slug, check if any store has is_homepage flag
        if (!homepageStore && allStores.length > 0) {
            homepageStore = allStores.find(s => s.is_homepage === true || s.isHomepage === true) || null;
        }

        const resolvedSlug = homepageStore?.username || effectiveSlug || (allStores[0]?.username || '');

        return NextResponse.json({
            success: true,
            homepageSlug: resolvedSlug,
            homepageStore: homepageStore || (allStores.length > 0 ? allStores[0] : null)
        });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const rawSlug = body.storeSlug || body.username || body.storeId || body.id || '';

        if (!rawSlug) {
            return NextResponse.json({ success: false, error: 'storeSlug is required' }, { status: 400 });
        }

        const cleanSlug = String(rawSlug).toLowerCase().trim().replace(/^store_/, '').replace(/[^a-z0-9-]+/g, '-');
        const storeId = `store_${cleanSlug}`;

        // 1. Update in-memory global state
        globalThis.__gumshop_homepage_slug = cleanSlug;

        // 2. Set persistent 30-day cookie
        const cookieStore = await cookies();
        cookieStore.set(HOMEPAGE_COOKIE_NAME, cleanSlug, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30
        });

        // 3. Update store in Supabase
        const targetStore = await serverGetStore(cleanSlug);
        if (targetStore) {
            await serverSaveStore({
                ...targetStore,
                is_homepage: true,
                isHomepage: true,
                updatedAt: new Date().toISOString()
            });
        }

        return NextResponse.json({
            success: true,
            homepageSlug: cleanSlug,
            message: `Store "${cleanSlug}" is now designated as the official homepage.`
        });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
