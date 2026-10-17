// scripts/test_mapping.mjs
import { postgrest } from '../lib/db/client.js';

async function run() {
    // 1. Fetch all products from stores table or products table
    const pRes = await postgrest('products?store_id=eq.store_rubber-couch-toys-official-store&select=*&limit=250');
    console.log(`Fetched ${pRes.data?.length || 0} products from products table.`);

    const sRes = await postgrest('stores?id=eq.store_rubber-couch-toys-official-store&select=data,name');
    const storeProds = sRes.data?.[0]?.data?.products || [];
    console.log(`Fetched ${storeProds.length} products from stores.data.products.`);

    if (pRes.data && pRes.data.length > 0) {
        console.log('\nSample product names:');
        pRes.data.slice(0, 10).forEach(p => console.log(`- [${p.price}] ${p.name} (cat: ${p.data?.category})`));
    }
}

run().catch(console.error);
