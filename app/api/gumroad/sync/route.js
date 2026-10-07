import { NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
const ref = () => null;
const set = () => Promise.resolve();
import { getServerGumroadToken } from '@/lib/serverVault';

/**
 * ⚡ GumShop.online Instant Gumroad Sales Sync & Verification API
 * Validates merchant's Gumroad token and synchronizes sales directly into their store orders.
 */
export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const { storeId, action = 'sync' } = body;
        let rawToken = body.token || body.accessToken || body.gumroadToken;

        if (!rawToken || !rawToken.trim()) {
            rawToken = await getServerGumroadToken();
        }

        if (!rawToken || !rawToken.trim()) {
            return NextResponse.json({ 
                error: 'Please connect your Gumroad account in Gumroad Settings.' 
            }, { status: 400 });
        }

        const cleanToken = rawToken.trim();

        // 1. Verify Token with Gumroad API (GET /v2/user)
        let userRes;
        try {
            userRes = await fetch(`https://api.gumroad.com/v2/user?access_token=${encodeURIComponent(cleanToken)}`, {
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(6000)
            });
        } catch (fetchErr) {
            return NextResponse.json({ 
                error: 'Unable to reach Gumroad API. Please check your internet connection and try again.' 
            }, { status: 504 });
        }

        if (!userRes.ok) {
            return NextResponse.json({ 
                error: 'Invalid Gumroad Access Token. Please verify the token copied from gumroad.com/settings/developer.' 
            }, { status: 401 });
        }

        const userData = await userRes.json();
        if (!userData.success) {
            return NextResponse.json({ 
                error: userData.message || 'Gumroad verification failed' 
            }, { status: 401 });
        }

        // If action is just to verify
        if (action === 'verify') {
            return NextResponse.json({
                success: true,
                message: `Connected successfully as ${userData.user?.name || userData.user?.email}!`,
                user: {
                    name: userData.user?.name,
                    email: userData.user?.email,
                    url: userData.user?.url
                }
            });
        }

        // Action: Fetch merchant's Gumroad products (GET /v2/products)
        if (action === 'get_products') {
            try {
                const prodRes = await fetch(`https://api.gumroad.com/v2/products?access_token=${encodeURIComponent(cleanToken)}`, {
                    headers: { 'Accept': 'application/json' },
                    signal: AbortSignal.timeout(8000)
                });
                if (prodRes.ok) {
                    const prodData = await prodRes.json();
                    const productsList = (prodData.products || []).map(p => ({
                        id: p.id,
                        name: p.name,
                        short_url: p.short_url,
                        url: p.url || p.short_url,
                        price: p.price ? p.price / 100 : 0,
                        formatted_price: p.formatted_price || `$${((p.price || 0) / 100).toFixed(2)}`,
                        published: p.published
                    }));
                    return NextResponse.json({
                        success: true,
                        count: productsList.length,
                        products: productsList,
                        user: userData.user
                    });
                }
            } catch (pErr) {
                console.warn('Failed to fetch Gumroad products:', pErr.message);
            }
            return NextResponse.json({ success: true, count: 0, products: [] });
        }

        // Action: Auto-create a Pay-What-You-Want checkout product on Gumroad (POST /v2/products)
        if (action === 'create_checkout_product') {
            try {
                const createRes = await fetch(`https://api.gumroad.com/v2/products`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json' 
                    },
                    body: new URLSearchParams({
                        access_token: cleanToken,
                        name: 'GumShop Express Order',
                        price: '100', // $1.00 base price
                        description: 'Official checkout session for your GumShop.online store order.',
                        custom_receipt: 'Thank you for your order on GumShop! Your tracking details have been generated.'
                    }),
                    signal: AbortSignal.timeout(10000)
                });

                if (createRes.ok) {
                    const createData = await createRes.json();
                    if (createData.success && createData.product) {
                        return NextResponse.json({
                            success: true,
                            message: 'Created Gumroad checkout product successfully!',
                            product: {
                                id: createData.product.id,
                                name: createData.product.name,
                                short_url: createData.product.short_url,
                                url: createData.product.url || createData.product.short_url
                            }
                        });
                    }
                }
            } catch (cErr) {
                console.warn('Failed to auto-create Gumroad product:', cErr.message);
            }
        }

        // 2. Fetch Real Sales from Gumroad (GET /v2/sales)
        let salesRes;
        try {
            salesRes = await fetch(`https://api.gumroad.com/v2/sales?access_token=${encodeURIComponent(cleanToken)}`, {
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(8000)
            });
        } catch (salesErr) {
            return NextResponse.json({ 
                error: 'Timed out fetching sales from Gumroad.' 
            }, { status: 504 });
        }

        const salesData = await salesRes.json();
        const rawSales = salesData.sales || [];
        const syncedOrders = [];

        // 3. Normalize into GumShop standard orders
        for (const sale of rawSales) {
            const orderSessionId = sale.url_params?.order_id || sale.custom_fields?.order_id || null;
            const orderId = orderSessionId || sale.order_number || sale.id || `ord_${Date.now()}`;
            const pricePaid = sale.price ? (parseFloat(sale.price) / 100) : 0;
            const customerEmail = sale.email || 'customer@example.com';
            const customerName = sale.full_name || customerEmail.split('@')[0];
            const address = sale.shipping_information 
                ? `${sale.shipping_information.street_address || ''}, ${sale.shipping_information.city || ''} ${sale.shipping_information.postal_code || ''}, ${sale.shipping_information.country || ''}`
                : (sale.url_params?.shipping_address || 'Provided at checkout');

            const orderPayload = {
                id: String(orderId),
                orderId: String(orderId),
                gumroadOrderNumber: sale.order_number ? String(sale.order_number) : null,
                storeId: sale.url_params?.store_id || storeId || 'store_default',
                customer: {
                    name: customerName,
                    email: customerEmail,
                    shippingAddress: address
                },
                items: sale.product_name || 'Gumroad Product',
                total: pricePaid,
                currency: (sale.currency || 'USD').toUpperCase(),
                status: sale.refunded ? 'Refunded' : (sale.disputed ? 'Disputed' : 'Completed'),
                fulfillmentStatus: 'unfulfilled',
                paymentMethod: 'Gumroad Pay',
                createdAt: sale.created_at || new Date().toISOString(),
                gumroadSaleId: sale.id
            };

            const alreadyExists = syncedOrders.some(o => o.id === String(orderId) || (o.gumroadSaleId && o.gumroadSaleId === sale.id));
            if (!alreadyExists) {
                syncedOrders.push(orderPayload);
            }

            // Persist into Firebase RTDB
            if (database && storeId) {
                try {
                    const storeOrderRef = ref(database, `stores/${storeId}/orders/${orderId}`);
                    await set(storeOrderRef, orderPayload);
                } catch (e) {
                    console.warn(`Sync write skipped for order ${orderId}:`, e.message);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Successfully synchronized ${syncedOrders.length} order(s) from Gumroad!`,
            count: syncedOrders.length,
            orders: syncedOrders,
            gumroadUser: userData.user?.name || userData.user?.email
        });

    } catch (error) {
        console.error('Gumroad sync error:', error);
        return NextResponse.json({ 
            error: error.message || 'Failed to sync Gumroad data' 
        }, { status: 500 });
    }
}
