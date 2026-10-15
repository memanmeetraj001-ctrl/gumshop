import { NextResponse } from 'next/server';
import { getStoreBySlug, updateStore } from '@/lib/db/stores.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const storeKey = searchParams.get('store') || searchParams.get('store_id') || searchParams.get('slug');
        if (!storeKey) {
            return NextResponse.json({ success: false, error: 'Store identifier required' }, { status: 400 });
        }

        const cleanKey = String(storeKey).toLowerCase().trim().replace(/^store_/, '');
        const store = await getStoreBySlug(cleanKey);
        if (!store) {
            return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
        }

        const leads = Array.isArray(store.data?.leads) 
            ? store.data.leads 
            : (Array.isArray(store.leads) ? store.leads : []);

        return NextResponse.json({
            success: true,
            store: store.slug || cleanKey,
            count: leads.length,
            leads
        });
    } catch (err) {
        console.error("GET /api/store/leads error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const { store: storeKey, email, source = 'stan_bio_lead', leadMagnetTitle = 'Complimentary Lead Magnet' } = body;

        if (!storeKey || !email || typeof email !== 'string' || !email.includes('@')) {
            return NextResponse.json({ success: false, error: 'Valid store and email required' }, { status: 400 });
        }

        const cleanKey = String(storeKey).toLowerCase().trim().replace(/^store_/, '');
        const cleanEmail = email.toLowerCase().trim();
        const store = await getStoreBySlug(cleanKey);

        if (!store) {
            return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
        }

        const existingData = store.data || {};
        const existingLeads = Array.isArray(existingData.leads) ? [...existingData.leads] : [];

        // Check for duplicate email
        const existingIdx = existingLeads.findIndex(l => l.email === cleanEmail);
        const newEntry = {
            email: cleanEmail,
            source,
            leadMagnetTitle,
            createdAt: new Date().toISOString()
        };

        if (existingIdx >= 0) {
            existingLeads[existingIdx] = { ...existingLeads[existingIdx], ...newEntry };
        } else {
            existingLeads.unshift(newEntry);
        }

        const updatedData = {
            ...existingData,
            leads: existingLeads
        };

        await updateStore(cleanKey, { data: updatedData, leads: existingLeads });

        return NextResponse.json({
            success: true,
            message: 'Lead captured successfully',
            count: existingLeads.length
        });
    } catch (err) {
        console.error("POST /api/store/leads error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
