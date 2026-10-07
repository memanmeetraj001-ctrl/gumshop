// lib/gumroad.js - Gumroad Dynamic Inframe Checkout & Webhooks
export function getGumroadCheckoutUrl(product, customerEmail = '', storeSlug = '') {
    if (!product) return 'https://gumroad.com';
    
    // If the product has a custom configured gumroad_url, use it
    if (product.gumroad_url && product.gumroad_url.startsWith('http')) {
        const u = new URL(product.gumroad_url);
        if (customerEmail) u.searchParams.set('email', customerEmail);
        u.searchParams.set('wanted', 'true');
        return u.toString();
    }

    // Dynamic fallback checkout link with product metadata
    const cleanTitle = encodeURIComponent(product.title || 'Product');
    const cleanPrice = encodeURIComponent(product.price || '0.00');
    return `https://gumroad.com/l/gumshop-checkout?product_id=${product.id}&title=${cleanTitle}&price=${cleanPrice}&store=${storeSlug}&wanted=true`;
}

export function parseGumroadWebhook(formData) {
    const params = new URLSearchParams(formData);
    return {
        saleId: params.get('sale_id') || params.get('id') || `sale_${Date.now()}`,
        productId: params.get('product_id') || '',
        productName: params.get('product_name') || 'Item',
        price: parseFloat(params.get('price') || 0) / 100, // Gumroad sends cents
        currency: params.get('currency') || 'usd',
        email: params.get('email') || params.get('purchaser_email') || 'customer@example.com',
        storeId: params.get('custom_fields[store_id]') || params.get('store_id') || '',
        createdAt: new Date().toISOString()
    };
}
