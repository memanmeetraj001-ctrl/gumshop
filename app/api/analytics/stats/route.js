import { NextResponse } from 'next/server';
import { getAnalyticsStats } from '@/lib/db/analytics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const timeframe = searchParams.get('timeframe') || 'today';
        const store = searchParams.get('store') || '';

        const stats = await getAnalyticsStats({ timeframe, storeId: store });

        return NextResponse.json(stats, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            }
        });
    } catch (err) {
        console.error('Analytics stats error:', err);
        return NextResponse.json(
            { success: false, error: 'Failed to retrieve analytics metrics', details: err.message },
            { status: 500 }
        );
    }
}
