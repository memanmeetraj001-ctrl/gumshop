// scripts/test_active_store_loop_prevention.mjs
// Lightweight vanilla JS DOM / browser mock (Ponytail principle: 0 extra npm dependencies)

const storage = new Map();
const mockLocalStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear()
};

const listeners = new Map();
const mockWindow = {
    addEventListener: (type, fn) => {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(fn);
    },
    removeEventListener: (type, fn) => {
        if (!listeners.has(type)) return;
        listeners.set(type, listeners.get(type).filter(f => f !== fn));
    },
    dispatchEvent: (event) => {
        const type = event?.type || event;
        const list = listeners.get(type) || [];
        list.forEach(fn => fn(event));
    },
    location: {
        search: '?store=rubber-couch-toys-official-store',
        origin: 'https://www.gumshop.online'
    }
};

const mockDocument = {
    cookie: '',
    addEventListener: () => {},
    removeEventListener: () => {}
};

class MockEvent {
    constructor(type) {
        this.type = type;
    }
}

globalThis.window = mockWindow;
globalThis.document = mockDocument;
globalThis.localStorage = mockLocalStorage;
globalThis.sessionStorage = mockLocalStorage;
globalThis.Event = MockEvent;

async function run() {
    console.log('=== TESTING ACTIVESTORE EVENT LOOP SAFEGUARDS ===\n');

    const { setActiveStoreSlug } = await import('../lib/activeStore.js');

    let eventCount = 0;
    mockWindow.addEventListener('active_store_changed', () => {
        eventCount++;
    });

    console.log('1. Setting active store to "rubber-couch-toys-official-store" for the first time...');
    setActiveStoreSlug('rubber-couch-toys-official-store');
    console.log(`   Events fired: ${eventCount} (Expected: 1)`);
    if (eventCount !== 1) throw new Error(`Expected 1 event, got ${eventCount}`);

    console.log('\n2. Calling setActiveStoreSlug 50 times in a loop with same slug (and variants with store_ prefix & object)...');
    for (let i = 0; i < 50; i++) {
        setActiveStoreSlug('rubber-couch-toys-official-store');
        setActiveStoreSlug({ username: 'rubber-couch-toys-official-store' });
        setActiveStoreSlug('store_rubber-couch-toys-official-store');
    }

    console.log(`   Events fired after 150 redundant calls: ${eventCount} (Expected: 1)`);
    if (eventCount !== 1) {
        throw new Error(`Infinite loop detected! Expected 1 event, got ${eventCount}`);
    }
    console.log('   ✅ Bedrock Safeguard successfully suppressed 150 redundant event dispatches!');

    console.log('\n3. Testing active store switch to "phantompaws-headless-horseman-pet-costume"...');
    setActiveStoreSlug('phantompaws-headless-horseman-pet-costume');
    console.log(`   Events fired: ${eventCount} (Expected: 2)`);
    if (eventCount !== 2) throw new Error('Expected 2 events after genuine store switch');
    console.log('   ✅ Legitimate store switch successfully dispatched single event!');

    console.log('\n4. Calling setActiveStoreSlug with phantompaws again...');
    setActiveStoreSlug('phantompaws-headless-horseman-pet-costume');
    console.log(`   Events fired: ${eventCount} (Expected: 2)`);
    if (eventCount !== 2) throw new Error('Redundant switch not suppressed');
    console.log('   ✅ Redundant switch suppressed!');

    console.log('\n🎉 ALL TESTS PASSED! Zero event recursion; complete freeze protection.');
}

run().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
