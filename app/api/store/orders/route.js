import { NextResponse } from 'next/server';
import { getServerOrdersByStore, saveServerOrder, deleteServerOrder, deleteUnpaidServerOrders } from '@/lib/db/orders';

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

export async function DELETE(req) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id') || '';
        const store = url.searchParams.get('store') || url.searchParams.get('storeId') || '';
        const clearUnpaid = url.searchParams.get('clearUnpaid') === 'true';

        if (clearUnpaid) {
            const res = await deleteUnpaidServerOrders(store);
            return NextResponse.json({
                success: true,
                message: `Purged ${res.deletedCount || 0} unpaid/test orders.`,
                deletedCount: res.deletedCount || 0
            });
        }

        if (!id) {
            return NextResponse.json({ success: false, error: 'Order id is required' }, { status: 400 });
        }

        const res = await deleteServerOrder(id, store);
        return NextResponse.json({
            success: true,
            message: `Order ${id} deleted successfully.`,
            orderId: id
        });
    } catch (err) {
        console.error('Error deleting store order:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
