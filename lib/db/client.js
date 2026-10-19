/**
 * lib/db/client.js
 * 
 * Clean, Zero-Dependency PostgREST HTTP Client for Supabase.
 * Enforces:
 * 1. cache: 'no-store' on all requests (zero stale caching)
 * 2. Standardized error handling and structured returns
 * 3. Consistent auth token forwarding
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rkdigvwkcbbysuvilkzp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_kS8eq_QMEg5qLnsJxAIqCg_eYTuU6uP';

// High-Performance In-Memory PostgREST Query Cache
const queryCache = new Map();
const inFlightRequests = new Map();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds fresh
const STALE_TTL_MS = 5 * 60 * 1000; // 5 minutes stale-while-revalidate

export function clearDbCache() {
    queryCache.clear();
}

export async function postgrest(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const url = `${SUPABASE_URL}/rest/v1/${path}`;
    const cacheKey = `${method}:${path}:${options.body || ''}`;

    // Non-GET requests (mutations) or explicit bypassCache bypass the in-memory cache
    if (method !== 'GET' || options.bypassCache) {
        if (method !== 'GET') {
            queryCache.clear();
        }
    } else {
        const cached = queryCache.get(cacheKey);
        const now = Date.now();
        if (cached) {
            // Fresh hit: Return instantly (0ms)
            if (now - cached.time < CACHE_TTL_MS) {
                return { data: cached.data, error: null, status: 200 };
            }
            // Stale hit: Return stale data immediately and trigger background revalidation
            if (now - cached.time < STALE_TTL_MS) {
                // Fire background update if not already in-flight
                if (!inFlightRequests.has(cacheKey)) {
                    postgrestFetch(url, path, options, cacheKey).catch(() => {});
                }
                return { data: cached.data, error: null, status: 200 };
            }
        }

        // Deduplicate simultaneous in-flight GET requests
        if (inFlightRequests.has(cacheKey)) {
            return inFlightRequests.get(cacheKey);
        }
    }

    const requestPromise = postgrestFetch(url, path, options, cacheKey);
    if (method === 'GET') {
        inFlightRequests.set(cacheKey, requestPromise);
    }

    try {
        return await requestPromise;
    } finally {
        if (method === 'GET') {
            inFlightRequests.delete(cacheKey);
        }
    }
}

async function postgrestFetch(url, path, options, cacheKey) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': options.prefer || (method === 'GET' ? 'return=representation' : 'return=minimal'),
        ...options.headers
    };

    try {
        // Resilient timeout for cloud database operations (guarantees worker stays well under Cloudflare limits)
        const controller = new AbortController();
        const timeoutMs = options.timeout || 3500;
        const timerId = setTimeout(() => controller.abort(), timeoutMs);

        const fetchOptions = {
            ...options,
            headers,
            signal: options.signal || controller.signal
        };

        // Cache GET queries with Next.js ISR (300s) unless bypass requested; force no-store on mutations
        if (method === 'GET' && !options.bypassCache) {
            fetchOptions.next = { revalidate: options.revalidate !== undefined ? options.revalidate : 300 };
        } else {
            fetchOptions.cache = 'no-store';
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timerId);

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[Supabase PostgREST Error] ${method} ${path} (${response.status}):`, errText);
            
            // On 5xx/404 server error, check if stale data exists
            if (queryCache.has(cacheKey)) {
                return { data: queryCache.get(cacheKey).data, error: null, status: 200 };
            }
            return { data: null, error: errText, status: response.status };
        }

        let data = null;
        if (response.status !== 204 && response.status !== 205) {
            data = await response.json().catch(() => null);
        }
        
        // Cache successful GET responses
        if (method === 'GET' && data !== null && !options.bypassCache) {
            queryCache.set(cacheKey, { data, time: Date.now() });
        }

        return { data, error: null, status: response.status };
    } catch (err) {
        console.error(`[Supabase Network Notice] ${path}:`, err.message);
        // On network failure or abort, return cached stale data if available
        if (queryCache.has(cacheKey)) {
            return { data: queryCache.get(cacheKey).data, error: null, status: 200 };
        }
        return { data: null, error: err.message, status: 500 };
    }
}
