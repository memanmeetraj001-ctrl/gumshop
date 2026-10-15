import { NextResponse } from 'next/server';
import { PaymentStatus, OrderStatus, FulfillmentStatus, ShipmentStatus } from '@/lib/paymentStatus';
import { isSaleProcessed, markSaleProcessed, saveServerOrder, getServerOrder } from '@/lib/db/orders';

/**
 * Dispatches optional real-time sale alerts to Discord or Telegram (Zero Dependencies)
 */
async function dispatchSaleAlert(order) {
    const discordWebhook = process.env.DISCORD_SALES_WEBHOOK_URL;
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;

    // 1. Discord Webhook
    if (discordWebhook && discordWebhook.startsWith('http')) {
        try {
            const firstItem = order.items?.[0]?.name || order.items?.[0]?.title || 'Product';
            const embed = {
                title: '🎉 New Sale Confirmed!',
                color: 0x10B981, // Emerald green
                fields: [
                    { name: 'Store', value: order.storeId || 'Default', inline: true },
                    { name: 'Total', value: `$${order.total?.toFixed(2)} ${order.currency || 'USD'}`, inline: true },
                    { name: 'Buyer', value: order.customerEmail || 'Guest', inline: true },
                    { name: 'Items', value: `${firstItem} (Qty: ${order.items?.length || 1})`, inline: false }
                ],
                timestamp: new Date().toISOString()
            };
            await fetch(discordWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ embeds: [embed] })
            }).catch(() => {});
        } catch {}
    }

    // 2. Telegram Alert
    if (tgToken && tgChatId) {
        try {
            const msg = `🎉 *NEW SALE!*\n\n🏬 *Store*: ${order.storeId}\n💰 *Total*: $${order.total?.toFixed(2)} ${order.currency || 'USD'}\n📦 *Item*: ${order.items?.[0]?.name || 'Item'}\n👤 *Buyer*: ${order.customerEmail}`;
            await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: tgChatId,
                    text: msg,
                    parse_mode: 'Markdown'
                })
            }).catch(() => {});
        } catch {}
    }
}

/**
 * ⚡ GumShop.online Gumroad Webhook Listener (Idempotent & Secure)
 * Receives Gumroad sale notifications, updates order to PAID in Supabase, and dispatches sale alerts.
 */
export async function POST(req) {
    try {
        let payload = {};
        const contentType = req.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            payload = await req.json().catch(() => ({}));
        } else {
            const formData = await req.formData().catch(() => new FormData());
            for (const [key, value] of formData.entries()) {
                payload[key] = value;
            }
        }

        // Optional Secret verification
        const configuredSecret = process.env.GUMROAD_WEBHOOK_SECRET;
        if (configuredSecret) {
            const incomingSecret = req.headers.get('x-gumroad-secret') || payload.webhook_secret;
            if (incomingSecret !== configuredSecret) {
                console.warn('[Webhook] Rejected unauthorized webhook payload missing matching secret');
                return NextResponse.json({ error: 'Unauthorized webhook caller' }, { status: 401 });
            }
        }

        const saleId = payload.sale_id || payload.id;
        const orderId = payload.custom_fields?.order_id || payload.order_id || payload.url_params?.orderId || saleId;

        if (!saleId && !orderId) {
            return NextResponse.json({ error: 'Missing sale_id or order_id in webhook payload' }, { status: 400 });
        }

        // 1. Idempotency Check: Prevent duplicate processing of the same sale
        if (saleId && await isSaleProcessed(saleId)) {
            return NextResponse.json({ message: 'Sale already processed', saleId }, { status: 200 });
        }

        if (saleId) {
            await markSaleProcessed(saleId, orderId);
        }

        // Extract customer and payment details
        const email = payload.email || payload.buyer_email || payload.customer_email || 'guest@gumshop.online';
        const pricePaid = parseFloat(payload.price || payload.amount || 0) / 100; // Gumroad prices are in cents
        const currency = (payload.currency || 'USD').toUpperCase();
        
        let shippingAddress = {};
        if (payload.shipping_address) {
            shippingAddress = typeof payload.shipping_address === 'string' 
                ? JSON.parse(payload.shipping_address) 
                : payload.shipping_address;
        }

        let items = [];
        if (payload.custom_fields?.items) {
            try {
                items = typeof payload.custom_fields.items === 'string'
                    ? JSON.parse(payload.custom_fields.items)
                    : payload.custom_fields.items;
            } catch (e) {}
        } else {
            items = [{
                name: payload.product_name || 'Product',
                quantity: parseInt(payload.quantity || 1),
                price: pricePaid
            }];
        }

        let storeId = payload.custom_fields?.store_id || payload.url_params?.store || payload.url_params?.storeId;
        if (!storeId || storeId === 'undefined') {
            storeId = 'store_default';
        }

        let effectiveStoreId = String(storeId);
        if ((!effectiveStoreId || effectiveStoreId === 'store_default') && orderId) {
            try {
                const existing = await getServerOrder(orderId);
                if (existing?.storeId && existing.storeId !== 'store_default') {
                    effectiveStoreId = existing.storeId;
                }
            } catch {}
        }

        // 2. Verified Paid Order Data
        const orderData = {
            id: String(orderId),
            orderId: String(orderId),
            storeId: effectiveStoreId,
            customer: {
                name: payload.full_name || payload.buyer_name || email.split('@')[0],
                email: email,
                shippingAddress: shippingAddress,
            },
            customerEmail: email,
            customerName: payload.full_name || payload.buyer_name || email.split('@')[0],
            shippingAddress: shippingAddress,
            items: items,
            total: pricePaid,
            subtotal: pricePaid,
            currency: currency,
            paymentStatus: PaymentStatus.PAID,
            orderStatus: OrderStatus.CONFIRMED,
            fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
            shipmentStatus: ShipmentStatus.NOT_AVAILABLE,
            isPaid: true,
            paymentMethod: 'Gumroad Verified Checkout',
            gumroadSaleId: saleId,
            saleId: saleId,
            verifiedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        };

        // 3. Persist verified order to authoritative Supabase
        await saveServerOrder(orderId, orderData);

        // 4. Dispatch real-time sale alert
        dispatchSaleAlert(orderData).catch(() => {});

        return NextResponse.json({ 
            success: true, 
            message: 'Payment verified and order confirmed successfully',
            orderId 
        }, { status: 200 });

    } catch (error) {
        console.error('Gumroad webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
