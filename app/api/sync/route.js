import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST() {
  try {
    // 1-Click Sync: revalidates all storefront and creator routes
    revalidatePath('/', 'layout');
    revalidatePath('/dashboard');
    revalidatePath('/shop/[slug]', 'page');
    revalidatePath('/creator/[slug]', 'page');
    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
