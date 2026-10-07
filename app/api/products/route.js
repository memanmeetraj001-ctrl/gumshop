import { NextResponse } from 'next/server';
import { dbGetProducts, dbCreateProduct, dbUpdateProduct, dbDeleteProduct } from '@/lib/supabase';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('store_id') || searchParams.get('store');
    if (!storeId) {
      return NextResponse.json({ success: false, error: 'store_id parameter required' }, { status: 400 });
    }
    const products = await dbGetProducts(storeId);
    return NextResponse.json({ success: true, products });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.store_id || !body.title) {
      return NextResponse.json({ success: false, error: 'store_id and title are required' }, { status: 400 });
    }
    const product = await dbCreateProduct(body);
    return NextResponse.json({ success: true, product });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }
    const updated = await dbUpdateProduct(body.id, body.updates || {});
    return NextResponse.json({ success: true, product: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }
    const success = await dbDeleteProduct(id);
    return NextResponse.json({ success });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
