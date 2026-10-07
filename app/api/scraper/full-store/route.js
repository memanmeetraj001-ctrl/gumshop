import { NextResponse } from 'next/server';

/**
 * Legacy Scraper Route
 * Deprecated in favor of the hardened /api/importer/analyze engine.
 * Redirects requests safely without fake mock catalog fallbacks.
 */
export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const targetUrl = body.url || body.storeUrl || body.targetUrl;

        if (!targetUrl) {
            return NextResponse.json({ 
                success: false, 
                error: 'Please provide a valid store URL to analyze.' 
            }, { status: 400 });
        }

        // Direct client to the official SSRF-hardened importer engine
        return NextResponse.json({
            success: false,
            deprecated: true,
            message: 'Please use /api/importer/analyze for secure catalog analysis.'
        }, { status: 410 });
    } catch {
        return NextResponse.json({ error: 'Endpoint deprecated' }, { status: 410 });
    }
}
