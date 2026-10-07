import Script from "next/script";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import { AuthProvider } from "@/lib/AuthContext";
import { Analytics } from "@vercel/analytics/next";
import CartSync from "@/components/CartSync";
import "./globals.css";

export const metadata = {
    title: "GumShop.online — 1-Click Store Cloner & Automated E-Commerce for Beginners",
    description: "Launch a high-converting, fully automated online store in 60 seconds. 1-Click store cloner, white-labeled Gumroad checkout, dedicated creator bio store, and 100% free forever.",
    keywords: ["shopify alternative", "store cloner", "free ecommerce builder", "link in bio store", "dropshipping cloner", "gumroad ecommerce"],
    openGraph: {
        title: "GumShop.online — The Free Shopify for Beginners",
        description: "Clone any winning store in 60 seconds with banners, reviews, creator bio mode, and instant checkout. 100% Free Forever.",
        url: "https://gumshop.online",
        siteName: "GumShop.online",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "GumShop.online — The Free Shopify for Beginners",
        description: "Launch your high-converting online store in 60s for $0. No monthly fees, no app subscriptions.",
    }
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                {/* Google Fonts Preconnect */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                {/* PWA Web App Manifest */}
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#10b981" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
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
