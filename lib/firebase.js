// lib/firebase.js - Pure Supabase & Local Adapter (Zero Firebase SDK Dependency)
export const app = null;
export const auth = {
    currentUser: null,
    onAuthStateChanged: (cb) => {
        if (typeof cb === 'function') cb(null);
        return () => {};
    }
};
export const db = null;
export const database = null;

export default { app, auth, db, database };
