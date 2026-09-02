/**
 * Gumroad SaaS Billing & Subscription Utilities
 */

export interface GumroadPlanConfig {
  plan: 'pro' | 'scale';
  cycle: 'monthly' | 'annual';
  limit: number;
}

export const GUMROAD_DEFAULT_STORE = 'https://manmeetraj6.gumroad.com';

// User's active Gumroad Product Permalinks & IDs
export const GUMROAD_PERMALINK_PRO_MONTHLY = 'gumshop-pro';        // ID: htgiks ($12/mo)
export const GUMROAD_PERMALINK_PRO_ANNUAL = 'umshop-pro-annual';   // ID: kujvkd ($9/mo, $108/yr)
export const GUMROAD_PERMALINK_SCALE_MONTHLY = 'gumshop-scale';    // ID: ffvqsn ($29/mo)
export const GUMROAD_PERMALINK_SCALE_ANNUAL = 'gumshop-scale-annual'; // ID: mienn ($24/mo, $288/yr)

// Map all possible Gumroad permalinks, slugs, and product IDs to SaaS tiers
export const GUMROAD_PERMALINK_MAP: Record<string, GumroadPlanConfig> = {
  // ── Pro Monthly ($12/mo) ──
  'gumshop-pro': { plan: 'pro', cycle: 'monthly', limit: 50 },
  'htgiks': { plan: 'pro', cycle: 'monthly', limit: 50 },
  'pro-monthly': { plan: 'pro', cycle: 'monthly', limit: 50 },
  'pro': { plan: 'pro', cycle: 'monthly', limit: 50 },

  // ── Pro Annual ($9/mo billed $108/yr) ──
  'umshop-pro-annual': { plan: 'pro', cycle: 'annual', limit: 50 },
  'gumshop-pro-annual': { plan: 'pro', cycle: 'annual', limit: 50 },
  'kujvkd': { plan: 'pro', cycle: 'annual', limit: 50 },
  'pro-annual': { plan: 'pro', cycle: 'annual', limit: 50 },

  // ── Scale Monthly ($29/mo) ──
  'gumshop-scale': { plan: 'scale', cycle: 'monthly', limit: 9999 },
  'ffvqsn': { plan: 'scale', cycle: 'monthly', limit: 9999 },
  'scale-monthly': { plan: 'scale', cycle: 'monthly', limit: 9999 },
  'scale': { plan: 'scale', cycle: 'monthly', limit: 9999 },

  // ── Scale Annual ($24/mo billed $288/yr) ──
  'gumshop-scale-annual': { plan: 'scale', cycle: 'annual', limit: 9999 },
  'mienn': { plan: 'scale', cycle: 'annual', limit: 9999 },
  'scale-annual': { plan: 'scale', cycle: 'annual', limit: 9999 },
};

/**
 * Build a Gumroad checkout URL with prefilled user email and custom tenant tracking parameters
 */
export function buildGumroadCheckoutUrl(
  permalink: string,
  email: string,
  tenantId: string
): string {
  const baseUrl = process.env.GUMROAD_STORE_URL || GUMROAD_DEFAULT_STORE;
  const cleanBase = baseUrl.replace(/\/$/, '');
  
  // Custom configured URLs from environment variables take top priority if set
  if ((permalink === GUMROAD_PERMALINK_PRO_MONTHLY || permalink === 'htgiks') && process.env.GUMROAD_PRO_MONTHLY_URL) {
    return appendQueryParams(process.env.GUMROAD_PRO_MONTHLY_URL, email, tenantId);
  }
  if ((permalink === GUMROAD_PERMALINK_PRO_ANNUAL || permalink === 'kujvkd') && process.env.GUMROAD_PRO_ANNUAL_URL) {
    return appendQueryParams(process.env.GUMROAD_PRO_ANNUAL_URL, email, tenantId);
  }
  if ((permalink === GUMROAD_PERMALINK_SCALE_MONTHLY || permalink === 'ffvqsn') && process.env.GUMROAD_SCALE_MONTHLY_URL) {
    return appendQueryParams(process.env.GUMROAD_SCALE_MONTHLY_URL, email, tenantId);
  }
  if ((permalink === GUMROAD_PERMALINK_SCALE_ANNUAL || permalink === 'mienn') && process.env.GUMROAD_SCALE_ANNUAL_URL) {
    return appendQueryParams(process.env.GUMROAD_SCALE_ANNUAL_URL, email, tenantId);
  }

  const targetUrl = `${cleanBase}/l/${permalink}`;
  return appendQueryParams(targetUrl, email, tenantId);
}

function appendQueryParams(url: string, email: string, tenantId: string): string {
  const separator = url.includes('?') ? '&' : '?';
  const params = new URLSearchParams();
  if (email) params.append('email', email);
  if (tenantId) params.append('tenant_id', tenantId);
  params.append('wanted', 'true');
  params.append('quantity', '1');
  return `${url}${separator}${params.toString()}`;
}

/**
 * Get dynamic Gumroad checkout URL for requested SaaS plan & billing cycle
 */
export function getGumroadCheckoutUrlForPlan(
  plan: 'pro' | 'scale',
  cycle: 'monthly' | 'annual',
  email: string,
  tenantId: string
): string {
  let permalink = GUMROAD_PERMALINK_PRO_MONTHLY;
  if (plan === 'pro') {
    permalink = cycle === 'annual' ? GUMROAD_PERMALINK_PRO_ANNUAL : GUMROAD_PERMALINK_PRO_MONTHLY;
  } else if (plan === 'scale') {
    permalink = cycle === 'annual' ? GUMROAD_PERMALINK_SCALE_ANNUAL : GUMROAD_PERMALINK_SCALE_MONTHLY;
  }
  return buildGumroadCheckoutUrl(permalink, email, tenantId);
}

/**
 * Determine plan tier and limit from Gumroad webhook payload
 */
export function determinePlanFromGumroadPayload(body: any): {
  plan: 'pro' | 'scale';
  limit: number;
  cycle: 'monthly' | 'annual';
} {
  const permalink = (body.permalink || body.short_product_id || body.product_permalink || '').toLowerCase();
  const productName = (body.product_name || '').toLowerCase();
  const recurrence = (body.recurrence || '').toLowerCase();

  // Check permalink map first
  if (permalink && GUMROAD_PERMALINK_MAP[permalink]) {
    return GUMROAD_PERMALINK_MAP[permalink];
  }

  // Fallback pattern matching
  const isScale = productName.includes('scale') || permalink.includes('scale') || permalink === 'ffvqsn' || permalink === 'mienn';
  const isAnnual = recurrence.includes('year') || recurrence.includes('annual') || productName.includes('annual') || permalink.includes('annual') || permalink === 'kujvkd' || permalink === 'mienn';

  return {
    plan: isScale ? 'scale' : 'pro',
    limit: isScale ? 9999 : 50,
    cycle: isAnnual ? 'annual' : 'monthly',
  };
}
