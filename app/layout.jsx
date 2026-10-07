import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "GumShop Modern E-Commerce & Creator Hub",
  description: "Next.js + Supabase High-Performance E-Commerce Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        {children}
      </body>
    </html>
  );
}
