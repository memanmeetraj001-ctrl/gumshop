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

export async function postgrest(path, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${path}`;
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': options.prefer || 'return=representation',
        ...options.headers
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            cache: 'no-store'
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[Supabase PostgREST Error] ${options.method || 'GET'} ${path} (${response.status}):`, errText);
            return { data: null, error: errText, status: response.status };
        }

        const data = await response.json().catch(() => null);
        return { data, error: null, status: response.status };
    } catch (err) {
        console.error(`[Supabase Network Error] ${path}:`, err.message);
        return { data: null, error: err.message, status: 500 };
    }
}
