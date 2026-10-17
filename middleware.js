import { NextResponse } from 'next/server';

/**
 * ⚡ GumShop Subdomain & Custom Domain Multi-Tenant Router (Edge Middleware)
 * 
 * Maps:
 * - `rcdrift.gumshop.online` -> `/shop/rcdrift` (or `/creator/rcdrift` if configured)
 * - `rcdrift.localhost:3000` -> `/shop/rcdrift` (local testing support)
 * - `gumshop.online` -> Root Homepage Store
 */
export function middleware(request) {
    const url = request.nextUrl.clone();
    const pathname = url.pathname;

    // 1. Skip Next.js internal assets, public files, and core APIs
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/store') ||
        pathname.startsWith('/cart') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    const host = request.headers.get('host') || '';
    const cleanHost = host.split(':')[0].toLowerCase();

    // 2. Extract Subdomain
    const rootDomains = ['gumshop.online', 'gumroad.online', 'localhost'];
    let subdomain = null;

    for (const root of rootDomains) {
        if (cleanHost.endsWith(root) && cleanHost !== root) {
            const candidate = cleanHost.replace(`.${root}`, '').trim();
            if (candidate && !['www', 'api', 'admin', 'dashboard', 'app', 'mail'].includes(candidate)) {
                subdomain = candidate;
                break;
            }
        }
    }

    // 3. Subdomain Routing & Transparent Rewriting
    if (subdomain) {
        // If visiting root of subdomain, route to that store's shop
        if (pathname === '/' || pathname === '') {
            url.pathname = `/shop/${subdomain}`;
            const response = NextResponse.rewrite(url);
            response.headers.set('x-store-subdomain', subdomain);
            return response;
        }

        // If visiting /track on subdomain
        if (pathname === '/track') {
            url.pathname = `/shop/${subdomain}/track`;
            return NextResponse.rewrite(url);
        }
    }

    const response = NextResponse.next();
    if (pathname === '/' || pathname.startsWith('/shop/') || pathname.startsWith('/creator/')) {
        response.headers.set('CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        response.headers.set('Cloudflare-CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    }
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
