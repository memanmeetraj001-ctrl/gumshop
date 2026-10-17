// scripts/inspect_theluckylk_categories.mjs
async function run() {
    const res = await fetch('https://theluckylk.com/collections.json');
    const data = await res.json();
    console.log(`Found ${data.collections.length} collections on theluckylk.com:\n`);
    
    for (const c of data.collections) {
        const prodRes = await fetch(`https://theluckylk.com/collections/${c.handle}/products.json?limit=250`);
        if (prodRes.ok) {
            const pData = await prodRes.json();
            console.log(`Collection: "${c.title}" (handle: ${c.handle}) - ${pData.products?.length || 0} products`);
        }
    }
}

run();
