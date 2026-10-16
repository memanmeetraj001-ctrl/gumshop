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
        default: "GumShop.online — The Best E-Commerce Store for Best Deals & Viral Products | 1-Click Clone to Gumroad",
        template: "%s | GumShop — Best Deals & Viral Products"
    },
    description: "The Best E-Commerce Store for Best Deals and Viral Products. 1-Click clone any winning store directly to Gumroad with guaranteed best pricing, direct supplier wholesale rates, automated Gumroad checkout, and high-converting storefronts with zero monthly subscription fees.",
    keywords: [
        "best e-commerce store",
        "best deals and viral products",
        "viral products ecommerce",
        "best deals online store",
        "1 click clone to gumroad store",
        "gumroad store cloner",
        "gumroad online store",
        "best pricing ecommerce",
        "wholesale rates dropshipping",
        "clone store to gumroad",
        "gumroad ecommerce",
        "free stan store alternative",
        "high converting gumroad store",
        "verified wholesale pricing",
        "creator bio store",
        "zero fee ecommerce"
    ],
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
        title: "GumShop.online — The Best E-Commerce Store for Best Deals & Viral Products",
        description: "The Best E-Commerce Store for Best Deals and Viral Products. 1-Click clone winning stores to Gumroad with verified wholesale rates and automated checkout.",
        url: "https://gumshop.online",
        siteName: "GumShop.online",
        locale: "en_US",
        type: "website",
        images: [
            {
                url: '/favicon.svg',
                width: 512,
                height: 512,
                alt: 'GumShop — Best Deals & Viral Products'
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "GumShop.online — The Best E-Commerce Store for Best Deals & Viral Products",
        description: "The Best E-Commerce Store for Best Deals and Viral Products. 1-Click clone any store to Gumroad in 60s.",
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

const jsonLdMarketplaceFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "What is GumShop.online?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "GumShop.online is a curated e-commerce marketplace and creator storefront platform where verified merchants offer viral products with direct, store-isolated Gumroad checkout."
            }
        },
        {
            "@type": "Question",
            "name": "How does checkout and buyer protection work?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Every purchase is processed securely via Gumroad with 256-bit SSL encryption and backed by a 30-day risk-free money-back guarantee with trackable fulfillment."
            }
        },
        {
            "@type": "Question",
            "name": "What are the shipping costs and delivery times?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "We offer standard trackable delivery for $4.99 and express priority delivery for $9.99, with FREE shipping on all orders over $50."
            }
        }
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
                {/* Checkout DNS & Asset Preconnects for instant dynamic iframe checkout */}
                <link rel="preconnect" href="https://gumroad.com" crossOrigin="anonymous" />
                <link rel="preconnect" href="https://assets.gumroad.com" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://gumroad.com" />
                <link rel="dns-prefetch" href="https://assets.gumroad.com" />
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
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdMarketplaceFaq) }}
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
