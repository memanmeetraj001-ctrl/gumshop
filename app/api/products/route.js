import { NextResponse } from 'next/server';
import { dbGetProducts, dbCreateProduct, dbUpdateProduct, dbDeleteProduct } from '@/lib/supabase';
import { getAllProductsWithStores } from '@/lib/db/products';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_CACHE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');
    const storeId = searchParams.get('store_id') || searchParams.get('store');

    if (mode === 'all') {
      const products = await getAllProductsWithStores();
      return NextResponse.json({ success: true, products }, { headers: NO_CACHE_HEADERS });
    }

    const products = await dbGetProducts(storeId);
    return NextResponse.json({ success: true, products }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body || !body.store_id || !body.title) {
      return NextResponse.json({ success: false, error: 'store_id and title are required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    const product = await dbCreateProduct(body);
    return NextResponse.json({ success: true, product }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body || !body.id) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    const updated = await dbUpdateProduct(body.id, body.updates || {});
    return NextResponse.json({ success: true, product: updated }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    const success = await dbDeleteProduct(id);
    return NextResponse.json({ success }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
