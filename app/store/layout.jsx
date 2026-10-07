import StoreLayout from "@/components/store/StoreLayout";

export const metadata = {
    title: "GumShop.online — Merchant Command Center",
    description: "Launch, clone, and manage your high-converting online storefront with GumShop.online",
};

export default function RootStoreLayout({ children }) {
    return (
        <StoreLayout>
            {children}
        </StoreLayout>
    );
}
