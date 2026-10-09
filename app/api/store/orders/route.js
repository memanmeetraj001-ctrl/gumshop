import { NextResponse } from 'next/server';
import { getServerOrdersByStore, saveServerOrder } from '@/lib/serverOrderStore';

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const storeKey = url.searchParams.get('storeId') || url.searchParams.get('store') || url.searchParams.get('slug') || '';
        
        const orders = await getServerOrdersByStore(storeKey);
        
        return NextResponse.json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (err) {
        console.error('Error fetching store orders:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const order = body.order || body;
        const orderId = order.id || order.orderId || order.orderSessionId || `ord_${Date.now()}`;

        if (!order || typeof order !== 'object') {
            return NextResponse.json({ success: false, error: 'Invalid order data' }, { status: 400 });
        }

        const normalizedOrder = {
            ...order,
            id: orderId,
            updatedAt: new Date().toISOString()
        };

        await saveServerOrder(orderId, normalizedOrder);

        return NextResponse.json({
            success: true,
            order: normalizedOrder
        });
    } catch (err) {
        console.error('Error saving store order:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
