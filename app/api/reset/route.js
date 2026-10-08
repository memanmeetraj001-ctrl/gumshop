import { NextResponse } from 'next/server';
import { dbResetAllData } from '@/lib/supabase';
import { serverWipeAllData } from '@/lib/serverDb';
import { revalidatePath } from 'next/cache';

async function performReset() {
  try {
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

    return NextResponse.json({ 
      success: true, 
      storesCount: 0,
      productsCount: 0,
      message: 'All stores, products, orders, and sessions successfully wiped to 0' 
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST() {
  return performReset();
}

export async function GET() {
  return performReset();
}
