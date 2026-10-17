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

const EDGE_CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
    'CDN-Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
    'Cloudflare-CDN-Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
    'Vercel-CDN-Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300'
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');
    const storeId = searchParams.get('store_id') || searchParams.get('store');
    const idParam = searchParams.get('id');
    const storesParam = searchParams.get('stores');
    const isFresh = searchParams.get('fresh') === 'true';
    const responseHeaders = isFresh ? NO_CACHE_HEADERS : EDGE_CACHE_HEADERS;

    if (idParam) {
      const { getProductById } = await import('@/lib/db/products');
      const singleProduct = await getProductById(idParam);
      if (singleProduct) {
        return NextResponse.json({ success: true, product: singleProduct, products: [singleProduct] }, { headers: responseHeaders });
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
      return NextResponse.json({ success: true, products }, { headers: responseHeaders });
    }

    const products = await dbGetProducts(storeId);
    return NextResponse.json({ success: true, products }, { headers: responseHeaders });
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
      // 1. Identify store slug from batch items if available
      const sample = items.find(i => i.storeSlug || i.storeId);
      const storeSlug = sample?.storeSlug || (sample?.storeId ? String(sample.storeId).replace(/^store_/, '') : null);

      // 2. Synchronize parent store's products array in ONE single atomic PATCH!
      if (storeSlug) {
        try {
          const { dbGetStoreBySlug, dbUpdateStore } = await import('@/lib/db/stores.js');
          const store = await dbGetStoreBySlug(storeSlug);
          if (store && Array.isArray(store.products)) {
            const updatesMap = new Map();
            items.forEach(i => { if (i?.id) updatesMap.set(i.id, i.updates || i); });
            const updatedProducts = store.products.map(p => {
              const u = updatesMap.get(p.id);
              if (!u) return p;
              const newPrice = u.price !== undefined ? parseFloat(u.price) : p.price;
              const newCompare = u.compareAtPrice !== undefined ? parseFloat(u.compareAtPrice) : p.compareAtPrice;
              return {
                ...p,
                ...u,
                price: newPrice,
                compareAtPrice: newCompare,
                mrp: newCompare,
                customBundles: u.customBundles || p.customBundles
              };
            });
            await dbUpdateStore(storeSlug, { products: updatedProducts });
          }
        } catch (e) {
          console.warn('Batch store array sync notice:', e.message);
        }
      }

      // 3. Update products table in parallel chunks of 15 items to stay well below Cloudflare subrequest limits
      const chunkSize = 15;
      const results = [];
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const chunkRes = await Promise.all(chunk.map(async (item) => {
          if (!item || !item.id) return null;
          const updates = item.updates || { ...item };
          delete updates.id;
          return await dbUpdateProduct(item.id, { ...updates, _skipStoreSync: Boolean(storeSlug) });
        }));
        results.push(...chunkRes.filter(Boolean));
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
