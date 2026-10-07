'use client'
import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePathname } from "next/navigation";

export default function PublicLayout({ children }) {
    const pathname = usePathname();
    // Merchant storefronts under /shop/[username] must be 100% white-labeled!
    // They should NOT display GumShop SaaS navigation, SaaS pricing links, or SaaS banners.
    const isStorefront = pathname?.startsWith('/shop/') && pathname !== '/shop';
    const isCreatorBio = pathname?.startsWith('/creator/');
    const isLogin = pathname === '/login';
    const hideChrome = isStorefront || isLogin || isCreatorBio;

    return (
        <>
            {!hideChrome && <Banner />}
            {!hideChrome && <Navbar />}
            {children}
            {!hideChrome && <Footer />}
        </>
    );
}
