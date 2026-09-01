import os

def replace_in_file(filepath, replacements):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        for old, new in replacements:
            new_content = new_content.replace(old, new)
            
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filepath}")
        else:
            print(f"No changes in {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

# Task 1
token_files = [
    'frontend/src/api/client.ts',
    'frontend/src/context/AuthContext.tsx',
    'frontend/src/context/CartContext.tsx',
    'frontend/src/pages/admin/MasterStoresPage.tsx'
]

for f in token_files:
    replace_in_file(f, [
        ('washforge_admin_token', 'gumshop_admin_token'),
        ('washforge_cart', 'gumshop_cart')
    ])

# Task 2
admin_layout_replacements = [
    ("{ label: 'Store Dashboard', path: '/admin/dashboard', emoji: '??' }", "{ label: 'Store Dashboard', path: '/admin/dashboard', emoji: '📊' }"),
    ("{ label: 'Products', path: '/admin/products', emoji: '??' }", "{ label: 'Products', path: '/admin/products', emoji: '📦' }"),
    ("{ label: 'Categories', path: '/admin/categories', emoji: '??' }", "{ label: 'Categories', path: '/admin/categories', emoji: '📂' }"),
    ("{ label: 'Collections', path: '/admin/collections', emoji: '??' }", "{ label: 'Collections', path: '/admin/collections', emoji: '🗃️' }"),
    ("{ label: 'Bundles & Kits', path: '/admin/bundles', emoji: '??' }", "{ label: 'Bundles & Kits', path: '/admin/bundles', emoji: '🎁' }"),
    ("{ label: '1-Click Product Importer', path: '/admin/import', emoji: '??' }", "{ label: '1-Click Product Importer', path: '/admin/import', emoji: '📥' }"),
    ("{ label: 'Gumroad Catalog Sync', path: '/admin/gumroad', emoji: '?' }", "{ label: 'Gumroad Catalog Sync', path: '/admin/gumroad', emoji: '⚡' }"),
    ("{ label: 'Discounts & Promo Codes', path: '/admin/promotions', emoji: '??' }", "{ label: 'Discounts & Promo Codes', path: '/admin/promotions', emoji: '🏷️' }"),
    ("{ label: 'Orders & Shipping Leads', path: '/admin/orders', emoji: '??' }", "{ label: 'Orders & Shipping Leads', path: '/admin/orders', emoji: '📬' }"),
    ("{ label: 'Customer Reviews', path: '/admin/testimonials', emoji: '\\u2B50' }", "{ label: 'Customer Reviews', path: '/admin/testimonials', emoji: '⭐' }"),
    ("{ label: 'Homepage Builder', path: '/admin/homepage', emoji: '??' }", "{ label: 'Homepage Builder', path: '/admin/homepage', emoji: '🎨' }"),
    ("{ label: 'Navigation & Menus', path: '/admin/navigation', emoji: '??' }", "{ label: 'Navigation & Menus', path: '/admin/navigation', emoji: '🗺️' }"),
    ("{ label: 'Footer Builder', path: '/admin/footer', emoji: '??' }", "{ label: 'Footer Builder', path: '/admin/footer', emoji: '📋' }"),
    ("{ label: 'Theme & Appearance', path: '/admin/appearance', emoji: '??' }", "{ label: 'Theme & Appearance', path: '/admin/appearance', emoji: '🎨' }"),
    ("{ label: 'Store Settings', path: '/admin/settings', emoji: '??' }", "{ label: 'Store Settings', path: '/admin/settings', emoji: '⚙️' }"),
    ("{ label: 'Store Guide & FAQ', path: '/admin/guide', emoji: '??' }", "{ label: 'Store Guide & FAQ', path: '/admin/guide', emoji: '📖' }"),
    ("? Upgrade (50 Slots)", "⚡ Upgrade (50 Slots)"),
    ("?? Master Platform Admin", "👑 Master Platform Admin")
]
replace_in_file('frontend/src/components/admin/AdminLayout.tsx', admin_layout_replacements)

master_admin_replacements = [
    ("{ label: 'Platform Overview & MRR', path: '/super-admin', emoji: '??' }", "{ label: 'Platform Overview & MRR', path: '/super-admin', emoji: '📊' }"),
    ("{ label: 'Store Tenant Directory', path: '/super-admin/stores', emoji: '??' }", "{ label: 'Store Tenant Directory', path: '/super-admin/stores', emoji: '🏪' }"),
    ("{ label: 'SaaS Billing & Webhooks', path: '/super-admin/billing', emoji: '??' }", "{ label: 'SaaS Billing & Webhooks', path: '/super-admin/billing', emoji: '💳' }"),
    ("{ label: 'Admins & Store Owners', path: '/super-admin/users', emoji: '??' }", "{ label: 'Admins & Store Owners', path: '/super-admin/users', emoji: '👥' }"),
    ("{ label: 'Global Platform Settings', path: '/super-admin/settings', emoji: '??' }", "{ label: 'Global Platform Settings', path: '/super-admin/settings', emoji: '⚙️' }"),
    ("text-lg\">??</div>", "text-lg\">👑</div>"),
    ("text-lg\">??</span>", "text-lg\">👑</span>"),
    ("<span className=\"text-sm\">???</span>", "<span className=\"text-sm\">🛍️</span>")
]
replace_in_file('frontend/src/components/admin/MasterAdminLayout.tsx', master_admin_replacements)

# Tasks 3 and 4: fix any '?' broken emoji in AdminDashboardPage and SuperAdminDashboardPage
# Let's inspect their content for generic '?' emoji characters that shouldn't be there.
# Looking at the code earlier, there aren't blatant '?' in Dashboard pages except maybe conditionally.
# Wait, I didn't see any in AdminDashboardPage.tsx. Let me do a generic replace for broken utf-8 like '' if possible, but the prompt says '?'
