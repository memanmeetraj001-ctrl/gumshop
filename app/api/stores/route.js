import { NextResponse } from 'next/server';
import { dbGetAllStores, dbCreateStore, dbDeleteStore } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0'
};

export async function GET() {
  try {
    const stores = await dbGetAllStores();
    return NextResponse.json({ success: true, stores }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body || !body.name || !body.slug) {
      return NextResponse.json({ success: false, error: 'Store name and slug are required' }, { status: 400 });
    }
    const store = await dbCreateStore(body);
    return NextResponse.json({ success: true, store });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('id') || searchParams.get('slug');
    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Store ID or slug required' }, { status: 400 });
    }
    const success = await dbDeleteStore(storeId);
    return NextResponse.json({ success });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
