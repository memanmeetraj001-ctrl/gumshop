import { NextResponse } from 'next/server';
import { inspectStoreUrl } from '@/lib/cloner';

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ success: false, error: 'Store URL is required' }, { status: 400 });
    }
    const result = await inspectStoreUrl(url);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
