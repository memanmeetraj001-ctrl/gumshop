import { NextResponse } from 'next/server';
import { resetAnalytics } from '@/lib/db/analytics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req) {
    try {
        const { searchParams } = new URL(req.url);
        let store = searchParams.get('store') || '';

        // Check if store was passed in json body
        try {
            const body = await req.json();
            if (body && body.store) store = body.store;
        } catch (_) {}

        const result = await resetAnalytics({ storeSlug: store });

        return NextResponse.json({
            success: true,
            message: store && store !== 'all' 
                ? `Analytics reset to zero for store: ${store}`
                : 'Analytics reset to zero for all stores fleet-wide',
            ...result
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate'
            }
        });
    } catch (err) {
        console.error('Analytics reset error:', err);
        return NextResponse.json(
            { success: false, error: 'Failed to reset analytics', details: err.message },
            { status: 500 }
        );
    }
}
