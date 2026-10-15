import { NextResponse } from 'next/server';
import { inspectStoreUrl } from '@/lib/cloner';
import { validateScraperUrl } from '@/lib/security';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = body?.url;
    if (!url) {
      return NextResponse.json({ success: false, error: 'Store URL is required' }, { status: 400 });
    }

    // Harden against SSRF, Loopback, Private IPs & Cloud Metadata endpoints
    const securityCheck = await validateScraperUrl(url);
    if (!securityCheck.valid) {
      return NextResponse.json({ 
        success: false, 
        error: `SSRF Blocked: ${securityCheck.error}` 
      }, { status: 400 });
    }

    const result = await inspectStoreUrl(securityCheck.url || url);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
