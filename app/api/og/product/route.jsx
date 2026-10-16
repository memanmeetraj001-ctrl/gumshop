import { ImageResponse } from 'next/og';
import { getProductById } from '@/lib/db/products';

export const runtime = 'edge';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        let product = null;
        if (id) {
            product = await getProductById(id).catch(() => null);
        }

        const title = product?.name || product?.title || 'Featured Viral Deal & Creator Product';
        const price = product?.price ? `$${Number(product.price).toFixed(2)}` : '$52.99';
        const compareAtPrice = product?.compareAtPrice ? `$${Number(product.compareAtPrice).toFixed(2)}` : null;
        const storeName = product?.storeName || 'GumShop Super Store';
        const image = product?.image || (Array.isArray(product?.images) && product?.images[0]) || '';

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        backgroundColor: '#090d16',
                        backgroundImage: 'radial-gradient(circle at 25% 25%, #10b98125 0%, transparent 50%), radial-gradient(circle at 75% 75%, #06b6d420 0%, transparent 50%)',
                        padding: '60px',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                >
                    {/* Top Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    backgroundColor: '#10b981',
                                    color: '#020617',
                                    fontSize: '24px',
                                    fontWeight: '900'
                                }}
                            >
                                ⚡
                            </div>
                            <span style={{ color: '#ffffff', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                                GumShop.online
                            </span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 18px',
                                borderRadius: '999px',
                                backgroundColor: '#10b98120',
                                border: '1px solid #10b98150',
                                color: '#34d399',
                                fontSize: '15px',
                                fontWeight: '700'
                            }}
                        >
                            ✓ Verified Merchant Store
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '48px', marginTop: '20px' }}>
                        {image ? (
                            <img
                                src={image}
                                alt={title}
                                style={{
                                    width: '280px',
                                    height: '280px',
                                    borderRadius: '24px',
                                    objectFit: 'cover',
                                    border: '2px solid #334155'
                                }}
                            />
                        ) : null}

                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <span style={{ color: '#94a3b8', fontSize: '18px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {storeName}
                            </span>
                            <span
                                style={{
                                    color: '#ffffff',
                                    fontSize: '38px',
                                    fontWeight: '900',
                                    lineHeight: '1.2',
                                    marginTop: '8px',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}
                            >
                                {title}
                            </span>

                            {/* Price Badge */}
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginTop: '20px' }}>
                                <span style={{ color: '#34d399', fontSize: '46px', fontWeight: '900' }}>
                                    {price}
                                </span>
                                {compareAtPrice ? (
                                    <span style={{ color: '#64748b', fontSize: '26px', textDecoration: 'line-through', fontWeight: '600' }}>
                                        {compareAtPrice}
                                    </span>
                                ) : null}
                                <span
                                    style={{
                                        backgroundColor: '#10b981',
                                        color: '#020617',
                                        padding: '4px 12px',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '800'
                                    }}
                                >
                                    DIRECT CHECKOUT
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Trust Footer */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '1px solid #1e293b',
                            paddingTop: '24px',
                            color: '#94a3b8',
                            fontSize: '16px',
                            fontWeight: '600'
                        }}
                    >
                        <span>🔒 256-Bit SSL Gumroad Checkout</span>
                        <span>📦 Free Worldwide Shipping Over $50</span>
                        <span>🛡️ 30-Day Buyer Guarantee</span>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630
            }
        );
    } catch (e) {
        return new Response(`Failed to generate social preview: ${e.message}`, { status: 500 });
    }
}
