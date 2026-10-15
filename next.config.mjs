/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    compress: true,
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 31536000,
        remotePatterns: [
            { protocol: 'https', hostname: '**' },
            { protocol: 'http', hostname: '**' }
        ]
    },
    experimental: {
        optimizePackageImports: ['lucide-react', 'date-fns', 'recharts']
    },
    async headers() {
        const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
        return [
            {
                source: '/_next/static/:path*',
                headers: [
                    { key: 'Expires', value: oneYearFromNow },
                    { key: 'Vary', value: 'Accept-Encoding' }
                ]
            },
            {
                source: '/:file*(favicon.ico|favicon.svg|apple-touch-icon.svg|manifest.json)',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
                    { key: 'Expires', value: thirtyDaysFromNow }
                ]
            }
        ];
    }
};

export default nextConfig;
