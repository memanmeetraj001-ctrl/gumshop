import { NextResponse } from 'next/server';
import { dbCreateProduct } from '@/lib/supabase';
import { applyPriceSlash } from '@/lib/importer/priceNormalizer.js';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const store_id = body?.store_id;
    const products = body?.products;
    const slashPercent = parseFloat(body?.slashPercent) || 0;
    if (!store_id || !products || !Array.isArray(products)) {
      return NextResponse.json({ success: false, error: 'store_id and products array required' }, { status: 400 });
    }

    const imported = [];
    for (const p of products) {
      let finalProduct = { ...p, store_id };
      if (slashPercent > 0) {
        const { price, compareAtPrice } = applyPriceSlash(p.price, slashPercent, p.compare_at_price || p.compareAtPrice);
        finalProduct.price = price;
        finalProduct.compare_at_price = compareAtPrice;
      }
      const created = await dbCreateProduct(finalProduct);
      imported.push(created);
    }

    return NextResponse.json({ success: true, count: imported.length, imported });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
