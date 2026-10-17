import PublicChrome from "@/components/PublicChrome";

export default function PublicLayout({ children }) {
    return (
        <PublicChrome>
            {children}
        </PublicChrome>
    );
}
