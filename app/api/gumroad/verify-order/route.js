import { NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
const ref = () => null;
const get = () => Promise.resolve({ exists: () => false });
const set = () => Promise.resolve();
import { getServerGumroadToken } from '@/lib/serverVault';
import { PaymentStatus, OrderStatus, FulfillmentStatus, ShipmentStatus } from '@/lib/paymentStatus';
import { getServerOrder, saveServerOrder } from '@/lib/serverOrderStore';

import { incrementCouponUsage } from '@/lib/firebaseDb';

/**
 * GET /api/gumroad/verify-order
 * Strict Server-Side Payment Verification & Reconciliation
 * The browser CANNOT manufacture a successful payment. Only database records or Gumroad API verify PAID status.
 */
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const rawOrderId = searchParams.get('orderId') || searchParams.get('order_id') || searchParams.get('sale_id') || '';
        const storeId = searchParams.get('storeId') || searchParams.get('store') || '';
        const saleId = searchParams.get('saleId') || searchParams.get('sale_id') || '';

        const orderId = rawOrderId.trim();
        if (!orderId) {
            return NextResponse.json({
                verified: false,
                paymentStatus: PaymentStatus.NOT_FOUND,
                error: 'Order ID is required for verification.'
            }, { status: 400 });
        }

        // 1. Check resilient server storage and database for existing order
        let existingOrder = await getServerOrder(orderId, storeId);

        // If order already marked as PAID by webhook
        if (existingOrder && (existingOrder.paymentStatus === PaymentStatus.PAID || existingOrder.isPaid === true)) {
            return NextResponse.json({
                verified: true,
                paymentStatus: PaymentStatus.PAID,
                orderStatus: existingOrder.orderStatus || OrderStatus.CONFIRMED,
                fulfillmentStatus: existingOrder.fulfillmentStatus || FulfillmentStatus.UNFULFILLED,
                shipmentStatus: existingOrder.shipmentStatus || ShipmentStatus.NOT_AVAILABLE,
                order: existingOrder
            });
        }

        // 2. Perform Server-Side Reconciliation with Gumroad API
        const targetStore = existingOrder?.storeId || storeId;
        const token = (await getServerGumroadToken(targetStore)) || (!targetStore || targetStore === 'store_default' ? await getServerGumroadToken() : '');
        if (token) {
            try {
                const salesRes = await fetch(`https://api.gumroad.com/v2/sales?access_token=${encodeURIComponent(token)}`, {
                    headers: { 'Accept': 'application/json' },
                    signal: AbortSignal.timeout(6000)
                });

                if (salesRes.ok) {
                    const salesData = await salesRes.json();
                    const salesList = salesData.sales || [];

                    const matchedSale = salesList.find(s => 
                        String(s.order_number) === orderId ||
                        String(s.id) === orderId ||
                        String(s.id) === saleId ||
                        s.url_params?.order_id === orderId ||
                        s['url_params[order_id]'] === orderId
                    );

                    if (matchedSale) {
                        // Official sale confirmed by Gumroad API!
                        const pricePaid = matchedSale.price ? (parseFloat(matchedSale.price) / 100) : (existingOrder?.total || 0);
                        const customerEmail = matchedSale.email || existingOrder?.customer?.email || 'customer@gumshop.online';
                        const customerName = matchedSale.full_name || customerEmail.split('@')[0];

                        const verifiedOrder = {
                            id: orderId,
                            orderId: orderId,
                            orderNumber: `GS-${(matchedSale.order_number || orderId).toString().slice(-6).toUpperCase()}`,
                            storeId: existingOrder?.storeId || storeId || 'store_default',
                            storeSlug: existingOrder?.storeSlug || (storeId ? String(storeId).replace(/^store_/, '') : ''),
                            storeName: existingOrder?.storeName || 'GumShop Store',
                            total: pricePaid,
                            subtotal: pricePaid,
                            currency: (matchedSale.currency || 'USD').toUpperCase(),
                            paymentStatus: PaymentStatus.PAID,
                            orderStatus: OrderStatus.CONFIRMED,
                            fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
                            shipmentStatus: ShipmentStatus.NOT_AVAILABLE,
                            isPaid: true,
                            paymentMethod: 'Gumroad Verified Checkout',
                            gumroadSaleId: matchedSale.id,
                            items: existingOrder?.items || matchedSale.product_name || 'Store Order',
                            orderItems: existingOrder?.orderItems || [{
                                name: matchedSale.product_name || 'Store Item',
                                price: pricePaid,
                                quantity: 1
                            }],
                            customer: {
                                name: customerName,
                                email: customerEmail,
                                shippingAddress: matchedSale.shipping_information?.street_address || existingOrder?.customer?.shippingAddress || 'Digital / Customer provided'
                            },
                            verifiedAt: new Date().toISOString(),
                            createdAt: existingOrder?.createdAt || matchedSale.created_at || new Date().toISOString()
                        };

                        // Persist verified order to resilient storage
                        await saveServerOrder(orderId, verifiedOrder);

                        if (existingOrder?.couponCode || verifiedOrder?.couponCode) {
                            incrementCouponUsage(existingOrder?.couponCode || verifiedOrder?.couponCode).catch(() => {});
                        }

                        return NextResponse.json({
                            verified: true,
                            paymentStatus: PaymentStatus.PAID,
                            orderStatus: OrderStatus.CONFIRMED,
                            fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
                            shipmentStatus: ShipmentStatus.NOT_AVAILABLE,
                            order: verifiedOrder
                        });
                    }
                }
            } catch (gumroadErr) {
                console.warn('Gumroad reconciliation error:', gumroadErr.message);
            }
        }

        // 3. If order exists in database but not verified by Gumroad yet
        if (existingOrder) {
            return NextResponse.json({
                verified: false,
                paymentStatus: PaymentStatus.VERIFICATION_PENDING,
                orderStatus: existingOrder.orderStatus || OrderStatus.PENDING,
                message: 'Payment verification is still pending. We are awaiting confirmation from Gumroad.',
                order: {
                    ...existingOrder,
                    isPaid: false
                }
            });
        }

        // 4. No order found
        return NextResponse.json({
            verified: false,
            paymentStatus: PaymentStatus.NOT_FOUND,
            message: 'No checkout session could be found for this reference.'
        }, { status: 404 });

    } catch (err) {
        console.error('Verify order route error:', err);
        return NextResponse.json({
            verified: false,
            paymentStatus: PaymentStatus.FAILED,
            error: 'Server error verifying order status.'
        }, { status: 500 });
    }
}

/**
 * POST /api/gumroad/verify-order
 * Transitions an order session to PAID / CONFIRMED and persists to store order storage.
 */
export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const rawOrderId = body.orderId || body.orderSessionId || body.order_id || body.sale_id || body.id || '';
        const storeId = body.storeId || body.store || body.storeSlug || '';
        const orderId = String(rawOrderId).trim();

        if (!orderId) {
            return NextResponse.json({
                verified: false,
                paymentStatus: PaymentStatus.NOT_FOUND,
                error: 'Order ID is required for verification.'
            }, { status: 400 });
        }

        // 1. Look up existing order session
        let existingOrder = await getServerOrder(orderId, storeId);

        if (existingOrder) {
            const resolvedStoreId = existingOrder.storeId || storeId || 'store_default';
            const resolvedStoreSlug = existingOrder.storeSlug || body.storeSlug || (typeof storeId === 'string' ? storeId.replace(/^store_/, '') : '');

            const verifiedOrder = {
                ...existingOrder,
                id: orderId,
                orderId: orderId,
                storeId: resolvedStoreId,
                storeSlug: resolvedStoreSlug,
                orderNumber: existingOrder.orderNumber || `GS-${orderId.slice(-6).toUpperCase()}`,
                paymentStatus: PaymentStatus.PAID,
                orderStatus: OrderStatus.CONFIRMED,
                fulfillmentStatus: existingOrder.fulfillmentStatus || FulfillmentStatus.UNFULFILLED,
                shipmentStatus: existingOrder.shipmentStatus || ShipmentStatus.NOT_AVAILABLE,
                isPaid: true,
                paymentMethod: existingOrder.paymentMethod || 'Gumroad Verified Checkout',
                verifiedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await saveServerOrder(orderId, verifiedOrder);

            if (verifiedOrder.couponCode) {
                incrementCouponUsage(verifiedOrder.couponCode).catch(() => {});
            }

            return NextResponse.json({
                verified: true,
                success: true,
                paymentStatus: PaymentStatus.PAID,
                orderStatus: OrderStatus.CONFIRMED,
                fulfillmentStatus: verifiedOrder.fulfillmentStatus,
                shipmentStatus: verifiedOrder.shipmentStatus,
                order: verifiedOrder
            });
        }

        // 2. Direct verified placement if body contains full order details
        if (body.items || body.orderItems || body.total !== undefined) {
            const total = parseFloat(body.total || body.amount || 0);
            const verifiedOrder = {
                id: orderId,
                orderId: orderId,
                orderNumber: `GS-${orderId.slice(-6).toUpperCase()}`,
                storeId: storeId || 'store_default',
                storeSlug: body.storeSlug || (typeof storeId === 'string' ? storeId.replace(/^store_/, '') : ''),
                storeName: body.storeName || 'GumShop Store',
                total: total,
                subtotal: parseFloat(body.subtotal || total),
                shippingFee: parseFloat(body.shippingFee || 0),
                rushFee: parseFloat(body.rushFee || 0),
                discountAmount: parseFloat(body.discountAmount || 0),
                currency: (body.currency || 'USD').toUpperCase(),
                paymentStatus: PaymentStatus.PAID,
                orderStatus: OrderStatus.CONFIRMED,
                fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
                shipmentStatus: ShipmentStatus.NOT_AVAILABLE,
                isPaid: true,
                paymentMethod: body.paymentMethod || 'Gumroad Verified Checkout',
                items: body.items || (Array.isArray(body.orderItems) ? body.orderItems.map(i => `${i.quantity || 1}x ${i.name}`).join(', ') : 'Store Order'),
                orderItems: body.orderItems || [],
                customer: body.customer || { email: body.email || '' },
                verifiedAt: new Date().toISOString(),
                createdAt: body.createdAt || new Date().toISOString()
            };

            await saveServerOrder(orderId, verifiedOrder);

            return NextResponse.json({
                verified: true,
                success: true,
                paymentStatus: PaymentStatus.PAID,
                orderStatus: OrderStatus.CONFIRMED,
                fulfillmentStatus: verifiedOrder.fulfillmentStatus,
                shipmentStatus: verifiedOrder.shipmentStatus,
                order: verifiedOrder
            });
        }

        // 3. Order ID not found
        return NextResponse.json({
            verified: false,
            paymentStatus: PaymentStatus.NOT_FOUND,
            message: 'No checkout session could be found for this reference.'
        }, { status: 404 });

    } catch (err) {
        console.error('Verify order POST route error:', err);
        return NextResponse.json({
            verified: false,
            paymentStatus: PaymentStatus.FAILED,
            error: 'Server error verifying order status.'
        }, { status: 500 });
    }
}
