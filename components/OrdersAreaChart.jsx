'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function OrdersAreaChart({ allOrders }) {

    // Group orders by date safely
    const ordersPerDay = (Array.isArray(allOrders) ? allOrders : []).reduce((acc, order) => {
        if (!order) return acc;
        try {
            const rawDate = order.createdAt || order.created_at || order.date;
            const parsed = rawDate ? new Date(rawDate) : new Date();
            const date = !isNaN(parsed.getTime()) ? parsed.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
        } catch {
            const today = new Date().toISOString().split('T')[0];
            acc[today] = (acc[today] || 0) + 1;
        }
        return acc;
    }, {});

    // Convert to array for Recharts
    const chartData = Object.entries(ordersPerDay).map(([date, count]) => ({
        date,
        orders: count
    }))

    return (
        <div className="w-full max-w-4xl h-[300px] text-xs">
            <h3 className="text-lg font-medium text-slate-800 mb-4 pt-2 text-right"> <span className='text-slate-500'>Orders /</span> Day</h3>
            <ResponsiveContainer width="100%" height="100%"> 
                <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} label={{ value: 'Orders', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="orders" stroke="#4f46e5" fill="#8884d8" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
