import Script from "next/script";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import { AuthProvider } from "@/lib/AuthContext";
import { Analytics } from "@vercel/analytics/next";
import CartSync from "@/components/CartSync";
import "./globals.css";

export const metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://gumshop.online'),
    title: {
        default: "GumShop.online — 1-Click Store Cloner & Automated E-Commerce for Beginners",
        template: "%s | GumShop"
    },
    description: "Launch a high-converting, fully automated online store in 60 seconds. 1-Click store cloner, white-labeled Gumroad checkout, dedicated creator bio store, and 100% free forever.",
    keywords: ["shopify alternative", "store cloner", "free ecommerce builder", "link in bio store", "dropshipping cloner", "gumroad ecommerce", "stan store alternative", "creator store"],
    authors: [{ name: "GumShop Team", url: "https://gumshop.online" }],
    creator: "GumShop",
    publisher: "GumShop",
    icons: {
        icon: [
            { url: '/favicon.svg', type: 'image/svg+xml' },
            { url: '/favicon.ico', sizes: 'any' }
        ],
        shortcut: '/favicon.ico',
        apple: [
            { url: '/apple-touch-icon.svg', sizes: '512x512', type: 'image/svg+xml' }
        ]
    },
    alternates: {
        canonical: 'https://gumshop.online',
    },
    openGraph: {
        title: "GumShop.online — The Free Shopify for Beginners & Creators",
        description: "Clone any winning store in 60 seconds with banners, reviews, creator bio mode, and instant checkout. 100% Free Forever.",
        url: "https://gumshop.online",
        siteName: "GumShop.online",
        locale: "en_US",
        type: "website",
        images: [
            {
                url: '/favicon.svg',
                width: 512,
                height: 512,
                alt: 'GumShop E-Commerce Logo'
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "GumShop.online — The Free Shopify for Beginners & Creators",
        description: "Launch your high-converting online store in 60s for $0. No monthly fees, no app subscriptions.",
        images: ['/favicon.svg']
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        }
    }
};

const jsonLdOrg = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "GumShop",
    "url": "https://gumshop.online",
    "logo": "https://gumshop.online/favicon.svg",
    "description": "1-Click Store Cloner & Automated E-Commerce platform for creators and digital merchants.",
    "sameAs": [
        "https://twitter.com/gumshop",
        "https://github.com/gumshop"
    ]
};

const jsonLdWebsite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "GumShop.online",
    "url": "https://gumshop.online",
    "potentialAction": {
        "@type": "SearchAction",
        "target": "https://gumshop.online/shop?q={search_term_string}",
        "query-input": "required name=search_term_string"
    }
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                {/* Google Fonts Preconnect */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                {/* Favicons & PWA Manifest */}
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="alternate icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#10b981" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                {/* Schema.org Structured Data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
                />
                {/* Gumroad In-Page Iframe Overlay Script */}
                <Script src="https://gumroad.com/js/gumroad.js" strategy="afterInteractive" />
            </head>
            <body className="antialiased bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
                <StoreProvider>
                    <AuthProvider>
                        <CartSync />
                        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
                        {children}
                        <Analytics />
                    </AuthProvider>
                </StoreProvider>
            </body>
        </html>
    );
}
