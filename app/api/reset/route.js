import { NextResponse } from 'next/server';
import { dbResetAllData } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function POST() {
  try {
    const result = await dbResetAllData();
    if (result.success) {
      revalidatePath('/', 'layout');
      revalidatePath('/dashboard');
      return NextResponse.json({ success: true, message: 'All stores and products wiped to 0' });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
