/**
 * Central Store Presets and Starter Catalogs
 * Shared between standard storefronts (/shop/[username]) and creator link-in-bio (/creator/[username])
 * Now backed by pure Supabase database with zero phantom defaults.
 */

import { getStoreBySlug, getHomepageStore } from './db/stores.js';
import { getProductsByStore } from './db/products.js';

export const STARTER_PRODUCTS = [];
export const RC_DRIFT_STARTER_PRODUCTS = [];
export const HIGHGEARTOYS_PRODUCTS = [];
export const DEFAULT_STORE_STARTER_PRODUCTS = [];
export const AURA_TRENDS_PRODUCTS = [];

export const DEMO_PRESETS = {};

export const DEFAULT_DEMO_CREATOR = {
    name: 'GumShop Storefront',
    username: 'store',
    bio: 'Direct supplier pricing, zero monthly fees.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    socials: { twitter: '', instagram: '', tiktok: '', youtube: '' },
    themeColor: '#10B981',
    products: []
};

export function resolvePresetStore(slug) {
    if (!slug) return null;
    return null;
}

export function resolvePresetProducts() {
    return [];
}

export function getStoreAndCatalogSync(rawUser) {
    if (!rawUser) return { store: null, products: [] };
    return { store: null, products: [] };
}

export async function resolveStoreAndProducts(username) {
    if (!username) {
        const homeStore = await getHomepageStore();
        if (homeStore) {
            const products = await getProductsByStore(homeStore.slug);
            return { store: homeStore, products };
        }
        return { store: null, products: [] };
    }

    const cleanUser = String(username).toLowerCase().trim().replace(/^store_/, '');
    const store = await getStoreBySlug(cleanUser);
    if (!store) {
        return { store: null, products: [] };
    }

    const products = await getProductsByStore(store.slug || store.id);
    return { store, products };
}
