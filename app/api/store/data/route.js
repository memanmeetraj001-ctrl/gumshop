import { NextResponse } from 'next/server';
import { 
    serverGetStore, 
    serverGetAllStores, 
    serverSaveStore, 
    serverDeleteStore, 
    serverGetProducts, 
    serverSaveProducts,
    serverDeleteProduct,
    serverWipeAllData,
    isSupabaseConfigured 
} from '@/lib/serverDb';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get('slug') || searchParams.get('username') || searchParams.get('id');

        if (!slug) {
            const allStores = await serverGetAllStores();
            return NextResponse.json({
                success: true,
                isSupabase: isSupabaseConfigured(),
                stores: allStores
            });
        }

        const store = await serverGetStore(slug);
        let products = [];
        if (store && store.id) {
            products = await serverGetProducts(store.id);
        }
        if (products.length === 0 && Array.isArray(store?.products) && store.products.length > 0) {
            products = store.products;
        }

        return NextResponse.json({
            success: true,
            isSupabase: isSupabaseConfigured(),
            store,
            products
        });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const { store, products } = body;

        if (!store) {
            return NextResponse.json({ success: false, error: 'Store object is required' }, { status: 400 });
        }

        const cleanSlug = (store.username || store.slug || store.id || '').toLowerCase().trim().replace(/^store_/, '');
        const storeId = store.id || `store_${cleanSlug}`;

        const storeProducts = Array.isArray(products) 
            ? products 
            : (Array.isArray(store.products) ? store.products : null);

        await serverSaveStore({ ...store, id: storeId, username: cleanSlug });

        if (storeProducts) {
            await serverSaveProducts(storeId, storeProducts);
        }

        return NextResponse.json({
            success: true,
            isSupabase: isSupabaseConfigured(),
            storeId,
            slug: cleanSlug
        });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const wipeAll = searchParams.get('wipeAll') === 'true' || searchParams.get('all') === 'true';
        if (wipeAll) {
            await serverWipeAllData();
            return NextResponse.json({
                success: true,
                isSupabase: isSupabaseConfigured(),
                wiped: true
            });
        }

        const productId = searchParams.get('productId');
        if (productId) {
            await serverDeleteProduct(productId);
            return NextResponse.json({
                success: true,
                isSupabase: isSupabaseConfigured(),
                deletedProduct: productId
            });
        }

        const id = searchParams.get('id');
        const slug = searchParams.get('slug') || searchParams.get('username');

        await serverDeleteStore(id, slug);

        return NextResponse.json({
            success: true,
            isSupabase: isSupabaseConfigured()
        });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
