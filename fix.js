const fs = require('fs');
const path = require('path');
const base = 'C:/Users/meman/.gemini/antigravity/scratch/washforge/frontend/src/pages/admin';

const fix = (file, replacements) => {
  const p = path.join(base, file);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(p, content, 'utf8');
};

fix('MasterStoresPage.tsx', [
  ['washforge_admin_token', 'gumshop_admin_token'],
  ['? 50 Slots', '— 50 Slots'],
  ['? Unlimited', '— Unlimited'],
]);

fix('AdminDashboardPage.tsx', [
  ['WashForge', 'GumShop'],
  ['washforge', 'gumshop'],
  ['Gumroad  intent', 'Gumroad intent'],
]);

fix('SuperAdminDashboardPage.tsx', [
  ['WashForge', 'GumShop'],
  ['washforge', 'gumshop']
]);

fix('AdminSettingsPage.tsx', [
  ['WashForge', 'GumShop'],
  ['washforge', 'gumshop'],
  ['? 50', '— 50'],
  ['? Unlimited', '— Unlimited'],
  ['EUR (-)', 'EUR (€)'],
  ['GBP (-)', 'GBP (£)'],
  ['INR (-)', 'INR (₹)'],
  ['shop.yourbrand.com', 'gumshop.online'],
  ['store.mybrand.com', 'gumshop.online']
]);

fix('AdminProductsPage.tsx', [
  ['? Upgrade', '🚀 Upgrade'],
]);

fix('AdminOrdersPage.tsx', [
  ['? Abandoned Leads', '🕒 Abandoned Leads'],
  ['? {it.title}', '• {it.title}'],
  ['?{it.quantity}', 'x{it.quantity}']
]);

console.log("Fixes applied");
