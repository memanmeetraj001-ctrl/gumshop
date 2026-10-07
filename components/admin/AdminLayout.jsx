'use client'
import { usePathname } from "next/navigation"
import AdminNavbar from "./AdminNavbar"
import AdminSidebar from "./AdminSidebar"

const AdminLayout = ({ children }) => {
    const pathname = usePathname()

    // Login page does not render admin sidebar or navbar
    if (pathname === '/admin/login') {
        return <>{children}</>
    }

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
            <AdminNavbar />
            <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                <AdminSidebar />
                <div className="flex-1 h-full p-5 lg:pl-10 lg:pt-8 overflow-y-scroll bg-slate-950/50">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default AdminLayout