import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST() {
  try {
    // 1-Click Sync: revalidates all storefront and creator routes
    revalidatePath('/', 'layout');
    revalidatePath('/dashboard');
    revalidatePath('/shop/[username]', 'page');
    revalidatePath('/creator/[username]', 'page');
    revalidatePath('/[username]', 'page');
    revalidatePath('/product/[productId]', 'page');
    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
