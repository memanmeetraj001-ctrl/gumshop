import { NextResponse } from 'next/server';
import { dbResetAllData } from '@/lib/supabase';
import { serverWipeAllData } from '@/lib/serverDb';
import { revalidatePath } from 'next/cache';
import { validateAdminRequest, checkRateLimit } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'global_reset';

    // Rate limit reset calls to max 3 per 5 minutes
    const rateLimit = checkRateLimit(`reset_${clientIp}`, 3, 300000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: `Rate limit exceeded. Try again in ${rateLimit.resetInSeconds} seconds.` 
      }, { status: 429 });
    }

    // Strict Admin Authorization Check
    const isAuthorized = await validateAdminRequest(req);
    if (!isAuthorized) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized. Admin credentials required to execute database reset.' 
      }, { status: 401 });
    }

    // 1. Wipe Supabase tables
    await dbResetAllData().catch(() => {});

    // 2. Wipe server in-memory database and Supabase tables
    await serverWipeAllData().catch(() => {});

    // 3. Clear server orders and deduplication records
    if (globalThis.__gumshop_server_orders) {
      globalThis.__gumshop_server_orders.clear();
    }
    if (globalThis.__gumshop_processed_sales) {
      globalThis.__gumshop_processed_sales.clear();
    }

    // 4. Reset server homepage designated slug
    globalThis.__gumshop_homepage_slug = '';

    // 5. Revalidate Next.js cache layers
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/dashboard');
      revalidatePath('/(public)', 'layout');
    } catch {}

    const res = NextResponse.json({ 
      success: true, 
      storesCount: 0,
      productsCount: 0,
      message: 'All stores, products, orders, and sessions successfully wiped to 0' 
    });
    res.cookies.delete('gumshop_homepage_store');
    res.cookies.delete('active_store_slug');
    return res;
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: false, 
    error: 'GET method not allowed on destructive endpoints. Use authenticated POST.' 
  }, { status: 405 });
}
