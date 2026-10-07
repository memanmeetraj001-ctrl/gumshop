import { NextResponse } from 'next/server';
import { analyzeStoreUrl } from '@/lib/importer';

/**
 * POST /api/importer/analyze
 * Analyzes a public e-commerce store URL with SSRF protection.
 * Returns structured Import Preview Data.
 */
export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const targetUrl = body.url || body.targetUrl || body.storeUrl;

        if (!targetUrl || typeof targetUrl !== 'string') {
            return NextResponse.json({ 
                success: false, 
                error: 'Please provide a valid store URL to analyze.' 
            }, { status: 400 });
        }

        const result = await analyzeStoreUrl(targetUrl);

        if (!result.success) {
            return NextResponse.json({ 
                success: false, 
                error: result.error || 'Failed to inspect store.' 
            }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error('API /api/importer/analyze error:', err);
        return NextResponse.json({ 
            success: false, 
            error: 'Server error while analyzing store. Please try again.' 
        }, { status: 500 });
    }
}
