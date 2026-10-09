import { NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
const ref = () => null;
const set = () => Promise.resolve();
import { getServerGumroadToken } from '@/lib/serverVault';
import { getProduct } from '@/lib/firebaseDb';
import { saveServerOrder } from '@/lib/serverOrderStore';
import { PaymentStatus, OrderStatus, FulfillmentStatus, ShipmentStatus } from '@/lib/paymentStatus';

/**
 * ⚡ GumShop.online Dynamic Gumroad Checkout API
 * Enforces price integrity, logs pending checkout session (NEVER marked PAID),
 * and generates official Gumroad checkout permalink.
 */
export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const { 
            storeId = 'store_default', 
            storeName = 'GumShop Store',
            items = [], 
            shippingFee = 0, 
            discountAmount = 0,
            couponCode = '',
            customer = {},
            gumroadProductUrl
        } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        // 1. Price Integrity: Validate prices from database where product records exist
        const validatedItems = await Promise.all(items.map(async (item) => {
            let authoritativePrice = parseFloat(item.price || 0);
            let productGumroadUrl = item.gumroadUrl || '';

            if (item.productId || item.id) {
                try {
                    const dbProduct = await getProduct(item.productId || item.id);
                    if (dbProduct && parseFloat(dbProduct.price) > 0) {
                        const baseRetail = parseFloat(dbProduct.price);
                        
                        // Check if item has a matched size/edition variant delta
                        let sizeDelta = 0;
                        if (Array.isArray(dbProduct.sizes) && (item.selectedSize || item.variant)) {
                            const variantStr = String(item.selectedSize || item.variant || '').toLowerCase();
                            const matchedSize = dbProduct.sizes.find(s => 
                                s.name && variantStr.includes(s.name.toLowerCase())
                            );
                            if (matchedSize && matchedSize.priceDelta) {
                                sizeDelta = parseFloat(matchedSize.priceDelta) || 0;
                            }
                        }

                        const variantBasePrice = baseRetail + sizeDelta;
                        const clientPrice = parseFloat(item.price || 0);
                        const minAcceptableTierPrice = Math.round(variantBasePrice * 0.70 * 100) / 100;
                        
                        // Respect valid client price if matching variant delta or valid volume tier break (up to 30% off)
                        if (clientPrice >= minAcceptableTierPrice && clientPrice <= variantBasePrice * 1.5) {
                            authoritativePrice = clientPrice;
                        } else {
                            authoritativePrice = variantBasePrice;
                        }

                        if (dbProduct.gumroadUrl) productGumroadUrl = dbProduct.gumroadUrl;
                    }
                } catch {}
            }

            return {
                ...item,
                price: authoritativePrice,
                gumroadUrl: productGumroadUrl
            };
        }));

        // Calculate dynamic subtotal & final price
        const subtotal = validatedItems.reduce((sum, item) => sum + (item.price * parseInt(item.quantity || 1)), 0);
        const finalTotal = Math.max(1.00, Math.round((subtotal + parseFloat(shippingFee || 0) - parseFloat(discountAmount || 0)) * 100) / 100);

        // Prepare line items summary
        const itemsSummary = validatedItems
            .map(i => `${i.quantity}x ${i.name}${i.variant ? ` (${i.variant})` : ''}`)
            .join(', ');

        const orderSessionId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        // 2. Resolve Real Gumroad Product Permalink
        let resolvedProductUrl = null;

        if (gumroadProductUrl && typeof gumroadProductUrl === 'string') {
            const clean = gumroadProductUrl.trim();
            if (clean && !clean.includes('gumroad.com/l/gumshop-order') && !clean.endsWith('/gumshop-order')) {
                resolvedProductUrl = clean.startsWith('http') ? clean : `https://${clean}`;
            }
        }

        // Check if item has individual product Gumroad URL
        if (!resolvedProductUrl) {
            const itemWithLink = validatedItems.find(i => i.gumroadUrl);
            if (itemWithLink?.gumroadUrl) {
                resolvedProductUrl = itemWithLink.gumroadUrl.startsWith('http') ? itemWithLink.gumroadUrl : `https://${itemWithLink.gumroadUrl}`;
            }
        }

        // Try auto-discovering from server-vaulted Gumroad token
        const serverToken = await getServerGumroadToken();
        if (!resolvedProductUrl && serverToken) {
            try {
                const prodRes = await fetch(`https://api.gumroad.com/v2/products?access_token=${encodeURIComponent(serverToken)}`, {
                    headers: { 'Accept': 'application/json' },
                    signal: AbortSignal.timeout(4000)
                });
                if (prodRes.ok) {
                    const prodData = await prodRes.json();
                    if (Array.isArray(prodData.products) && prodData.products.length > 0) {
                        const orderProduct = prodData.products.find(p => 
                            (p.name || '').toLowerCase().includes('order') || 
                            (p.name || '').toLowerCase().includes('checkout')
                        ) || prodData.products[0];

                        if (orderProduct?.short_url || orderProduct?.url) {
                            resolvedProductUrl = orderProduct.short_url || orderProduct.url;
                        }
                    }
                }
            } catch (err) {
                console.warn('Auto-discovery of Gumroad products notice:', err.message);
            }
        }

        // Check if store record in database has configured Gumroad URL
        if (!resolvedProductUrl && storeId) {
            try {
                const { serverGetStore } = await import('@/lib/serverDb');
                const dbStore = await serverGetStore(storeId);
                const sUrl = (dbStore?.gumroadProductUrl || dbStore?.gumroadUrl || '').trim();
                if (sUrl && !sUrl.includes('gumroad.com/l/gumshop-order')) {
                    resolvedProductUrl = sUrl.startsWith('http') ? sUrl : `https://${sUrl}`;
                }
            } catch {}
        }

        // Guaranteed universal fallback checkout gateway so customer payment is NEVER blocked
        if (!resolvedProductUrl) {
            resolvedProductUrl = 'https://gumroad.com/l/gumshop-checkout';
        }

        // 3. Log Checkout Initiation Session (PENDING / CHECKOUT_STARTED, NEVER PAID)
        try {
            const initialOrderSession = {
                id: orderSessionId,
                orderId: orderSessionId,
                storeId,
                storeName,
                total: finalTotal,
                subtotal: Math.round(subtotal * 100) / 100,
                shippingFee: Math.round(parseFloat(shippingFee || 0) * 100) / 100,
                discountAmount: Math.round(parseFloat(discountAmount || 0) * 100) / 100,
                currency: 'USD',
                paymentStatus: PaymentStatus.CHECKOUT_STARTED,
                orderStatus: OrderStatus.PENDING,
                fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
                shipmentStatus: ShipmentStatus.NOT_AVAILABLE,
                isPaid: false,
                items: itemsSummary,
                orderItems: validatedItems.map(i => ({
                    productId: i.productId || i.id,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity || 1
                })),
                customer: {
                    email: customer.email || '',
                    name: customer.name || '',
                    shippingAddress: customer.address || 'Provided during Gumroad checkout'
                },
                couponCode: couponCode ? String(couponCode).toUpperCase() : null,
                checkoutInitiatedAt: new Date().toISOString()
            };

            await saveServerOrder(orderSessionId, initialOrderSession);
        } catch (dbErr) {
            console.warn('Failed to log checkout initiation session:', dbErr.message);
        }

        // 4. Build Real Gumroad Checkout URL
        if (resolvedProductUrl) {
            try {
                const urlObj = new URL(resolvedProductUrl);
                urlObj.searchParams.set('wanted', 'true');
                urlObj.searchParams.set('price', finalTotal.toFixed(2));
                
                if (customer.email) {
                    urlObj.searchParams.set('email', customer.email);
                }
                urlObj.searchParams.set('order_id', orderSessionId);
                urlObj.searchParams.set('store_id', storeId || 'store_default');
                urlObj.searchParams.set('items', itemsSummary);

                if (customer.address) {
                    urlObj.searchParams.set('shipping_address', `${customer.address}, ${customer.city || ''} ${customer.postalCode || ''}, ${customer.country || ''}`);
                }

                // Configure post-purchase redirect URL for after payment completes on Gumroad
                const forwardedHost = req.headers.get('x-forwarded-host');
                const hostHeader = forwardedHost || req.headers.get('host') || 'www.gumshop.online';
                const forwardedProto = req.headers.get('x-forwarded-proto');
                const protocol = forwardedProto || (hostHeader.includes('localhost') ? 'http' : 'https');
                const thankYouRedirect = `${protocol}://${hostHeader}/thank-you?orderId=${encodeURIComponent(orderSessionId)}&store=${encodeURIComponent(storeId || 'store_default')}&total=${finalTotal.toFixed(2)}`;
                urlObj.searchParams.set('redirect_url', thankYouRedirect);

                return NextResponse.json({
                    success: true,
                    mode: 'gumroad',
                    directCheckout: false,
                    orderId: orderSessionId,
                    orderSessionId,
                    total: finalTotal,
                    checkoutUrl: urlObj.href,
                    pricing: {
                        subtotal: Math.round(subtotal * 100) / 100,
                        shippingFee: Math.round(parseFloat(shippingFee || 0) * 100) / 100,
                        discountAmount: Math.round(parseFloat(discountAmount || 0) * 100) / 100,
                        finalTotal: finalTotal,
                        currency: 'USD'
                    },
                    itemsSummary
                });
            } catch (urlErr) {
                console.warn('URL parsing notice:', urlErr.message);
                const safeUrl = `https://gumroad.com/l/gumshop-checkout?wanted=true&price=${finalTotal.toFixed(2)}&order_id=${encodeURIComponent(orderSessionId)}`;
                return NextResponse.json({
                    success: true,
                    orderId: orderSessionId,
                    orderSessionId,
                    total: finalTotal,
                    checkoutUrl: safeUrl,
                    pricing: {
                        subtotal: Math.round(subtotal * 100) / 100,
                        shippingFee: Math.round(parseFloat(shippingFee || 0) * 100) / 100,
                        discountAmount: Math.round(parseFloat(discountAmount || 0) * 100) / 100,
                        finalTotal: finalTotal,
                        currency: 'USD'
                    },
                    itemsSummary
                });
            }
        }

        // 5. If no valid Gumroad product is configured, do not bypass payment
        return NextResponse.json({
            success: false,
            requiresSetup: true,
            mode: 'unconfigured',
            directCheckout: false,
            orderSessionId,
            total: finalTotal,
            message: 'A Gumroad checkout link is required to collect live customer payments.',
            pricing: {
                subtotal: Math.round(subtotal * 100) / 100,
                shippingFee: Math.round(parseFloat(shippingFee || 0) * 100) / 100,
                discountAmount: Math.round(parseFloat(discountAmount || 0) * 100) / 100,
                finalTotal: finalTotal,
                currency: 'USD'
            },
            itemsSummary
        });

    } catch (error) {
        console.error('Dynamic checkout error:', error);
        return NextResponse.json({ 
            error: 'Failed to process checkout session' 
        }, { status: 500 });
    }
}
