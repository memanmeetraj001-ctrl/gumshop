import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { recordAnalyticsEvent } from '@/lib/db/analytics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Fast User-Agent Parser without external dependencies
function parseUserAgent(ua = '') {
    const raw = String(ua).toLowerCase();
    
    // Device
    let deviceType = 'desktop';
    if (/tablet|ipad|playbook|silk/i.test(raw)) {
        deviceType = 'tablet';
    } else if (/mobile|iphone|ipod|android.*mobile|blackberry|bb10|phone/i.test(raw)) {
        deviceType = 'mobile';
    }

    // OS
    let os = 'Other';
    if (/iphone|ipad|ipod/i.test(raw)) os = 'iOS';
    else if (/android/i.test(raw)) os = 'Android';
    else if (/windows/i.test(raw)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(raw)) os = 'macOS';
    else if (/linux/i.test(raw)) os = 'Linux';

    // Browser
    let browser = 'Other';
    if (/edg\//i.test(raw)) browser = 'Edge';
    else if (/chrome|crios/i.test(raw) && !/edg\//i.test(raw)) browser = 'Chrome';
    else if (/safari/i.test(raw) && !/chrome/i.test(raw)) browser = 'Safari';
    else if (/firefox|fxios/i.test(raw)) browser = 'Firefox';
    else if (/opr\//i.test(raw)) browser = 'Opera';

    return { deviceType, os, browser };
}

// Map ISO country codes to readable Country names
const COUNTRY_MAP = {
    US: 'United States',
    GB: 'United Kingdom',
    CA: 'Canada',
    AU: 'Australia',
    DE: 'Germany',
    FR: 'France',
    IN: 'India',
    JP: 'Japan',
    BR: 'Brazil',
    IT: 'Italy',
    ES: 'Spain',
    NL: 'Netherlands',
    SE: 'Sweden',
    CH: 'Switzerland',
    SG: 'Singapore',
    NZ: 'New Zealand',
    IE: 'Ireland',
    MX: 'Mexico',
    AE: 'United Arab Emirates'
};

export async function POST(req) {
    try {
        // Support both application/json and text/plain (navigator.sendBeacon)
        const contentType = req.headers.get('content-type') || '';
        let body = {};
        try {
            if (contentType.includes('text/plain') || contentType.includes('application/json')) {
                const raw = await req.text();
                if (raw && raw.trim()) {
                    body = JSON.parse(raw);
                }
            } else {
                const raw = await req.text();
                if (raw && raw.trim()) {
                    body = JSON.parse(raw);
                }
            }
        } catch {
            body = {};
        }

        const userAgent = req.headers.get('user-agent') || body.userAgent || '';
        const { deviceType, os, browser } = parseUserAgent(userAgent);

        // Geolocation from Cloudflare / Vercel / Proxy headers
        const headerCountry = req.headers.get('cf-ipcountry')
            || req.headers.get('x-vercel-ip-country')
            || req.headers.get('x-country-code')
            || body.countryCode
            || 'US';

        const countryCode = String(headerCountry).toUpperCase().substring(0, 2);
        const country = COUNTRY_MAP[countryCode] || body.country || 'United States';

        // Anonymize IP with daily rotating salt for GDPR/CCPA privacy
        const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
            || req.headers.get('x-real-ip') 
            || '127.0.0.1';
        const anonymizedIpHash = crypto.createHash('sha256')
            .update(rawIp + new Date().toDateString())
            .digest('hex')
            .substring(0, 12);

        const event = await recordAnalyticsEvent({
            visitorId: body.visitorId || anonymizedIpHash,
            sessionId: body.sessionId || `sess_${anonymizedIpHash}`,
            eventType: body.eventType || 'page_view',
            pathname: body.pathname || '/',
            pageTitle: body.pageTitle || 'GumShop',
            referrer: body.referrer || req.headers.get('referer') || '',
            trafficChannel: body.trafficChannel,
            utmSource: body.utmSource,
            utmMedium: body.utmMedium,
            utmCampaign: body.utmCampaign,
            utmContent: body.utmContent,
            deviceType: body.deviceType || deviceType,
            browser: body.browser || browser,
            os: body.os || os,
            country,
            countryCode,
            storeId: body.storeId,
            storeSlug: body.storeSlug,
            productId: body.productId,
            productName: body.productName,
            metadata: body.metadata || {}
        });

        return NextResponse.json({ success: true, eventId: event.id }, { status: 200 });
    } catch (err) {
        console.error('Analytics tracking error:', err.message);
        // Fail-safe: Always return 200 so visitor experience is 100% unaffected
        return NextResponse.json({ success: false, error: err.message }, { status: 200 });
    }
}
