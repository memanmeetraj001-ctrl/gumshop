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
    const idParam = searchParams.get('id');
    const storesParam = searchParams.get('stores');

    if (idParam) {
      const { getProductById } = await import('@/lib/db/products');
      const singleProduct = await getProductById(idParam);
      if (singleProduct) {
        return NextResponse.json({ success: true, product: singleProduct, products: [singleProduct] }, { headers: NO_CACHE_HEADERS });
      }
    }

    if (mode === 'all' || mode === 'custom' || storesParam) {
      let products = await getAllProductsWithStores();
      if (storesParam) {
        const allowedSlugs = new Set(
          storesParam.split(',').map(s => s.toLowerCase().trim().replace(/^store_/, '')).filter(Boolean)
        );
        if (allowedSlugs.size > 0) {
          products = products.filter(p => {
            const pSlug = (p.storeSlug || p.storeId || '').toLowerCase().replace(/^store_/, '');
            return allowedSlugs.has(pSlug);
          });
        }
      }
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
    const title = body?.title || body?.name;
    if (!body || !body.store_id || !title) {
      return NextResponse.json({ success: false, error: 'store_id and title (or name) are required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    const product = await dbCreateProduct({ ...body, title });
    return NextResponse.json({ success: true, product }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body) {
      return NextResponse.json({ success: false, error: 'Payload required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    // Support batch updates: { products: [...] } or { batch: [...] } or raw array [...]
    const items = Array.isArray(body) 
      ? body 
      : (Array.isArray(body.products) ? body.products : (Array.isArray(body.batch) ? body.batch : null));

    if (items && items.length > 0) {
      const results = [];
      for (const item of items) {
        if (!item || !item.id) continue;
        const updates = item.updates || { ...item };
        delete updates.id;
        const updated = await dbUpdateProduct(item.id, updates);
        results.push(updated);
      }
      return NextResponse.json({ success: true, count: results.length, products: results }, { headers: NO_CACHE_HEADERS });
    }

    // Single product update
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }
    const updates = body.updates || { ...body };
    delete updates.id;
    const updated = await dbUpdateProduct(body.id, updates);
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
