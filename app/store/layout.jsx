import StoreLayout from "@/components/store/StoreLayout";

export const metadata = {
    title: "Merchant Command Center | GumShop — 1-Click Gumroad Store Cloner",
    description: "Manage products, customize wholesale pricing, and track automated Gumroad store checkouts with GumShop.online",
};

export default function RootStoreLayout({ children }) {
    return (
        <StoreLayout>
            {children}
        </StoreLayout>
    );
}
