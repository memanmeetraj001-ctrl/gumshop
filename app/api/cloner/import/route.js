import { NextResponse } from 'next/server';
import { dbCreateProduct } from '@/lib/supabase';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const store_id = body?.store_id;
    const products = body?.products;
    if (!store_id || !products || !Array.isArray(products)) {
      return NextResponse.json({ success: false, error: 'store_id and products array required' }, { status: 400 });
    }

    const imported = [];
    for (const p of products) {
      const created = await dbCreateProduct({
        ...p,
        store_id
      });
      imported.push(created);
    }

    return NextResponse.json({ success: true, count: imported.length, imported });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
