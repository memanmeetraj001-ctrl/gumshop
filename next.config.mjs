/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    compress: true,
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'cdn.shopify.com' },
            { protocol: 'https', hostname: 'api.dicebear.com' }
        ]
    }
};

export default nextConfig;
