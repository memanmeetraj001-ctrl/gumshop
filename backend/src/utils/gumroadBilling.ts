/**
 * Gumroad SaaS Billing & Subscription Utilities
 */

export interface GumroadPlanConfig {
  plan: 'pro' | 'scale';
  cycle: 'monthly' | 'annual';
  limit: number;
}

export const GUMROAD_DEFAULT_STORE = 'https://manmeetraj6.gumroad.com';

// User's active Gumroad Product Permalinks
export const GUMROAD_PERMALINK_PRO = 'htgiks';
export const GUMROAD_PERMALINK_SCALE = 'ffvqsn';

// Map Gumroad permalinks / product IDs to SaaS tiers
export const GUMROAD_PERMALINK_MAP: Record<string, GumroadPlanConfig> = {
  // Pro Creator ($12/mo)
  'htgiks': { plan: 'pro', cycle: 'monthly', limit: 50 },
  'gumshop-pro': { plan: 'pro', cycle: 'monthly', limit: 50 },
  'pro-monthly': { plan: 'pro', cycle: 'monthly', limit: 50 },
  'pro': { plan: 'pro', cycle: 'monthly', limit: 50 },

  // Unlimited Scale ($29/mo)
  'ffvqsn': { plan: 'scale', cycle: 'monthly', limit: 9999 },
  'gumshop-scale': { plan: 'scale', cycle: 'monthly', limit: 9999 },
  'scale-monthly': { plan: 'scale', cycle: 'monthly', limit: 9999 },
  'scale': { plan: 'scale', cycle: 'monthly', limit: 9999 },
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
  
  // Custom configured URLs from environment variables take top priority
  if ((permalink === GUMROAD_PERMALINK_PRO || permalink === 'gumshop-pro') && process.env.GUMROAD_PRO_MONTHLY_URL) {
    return appendQueryParams(process.env.GUMROAD_PRO_MONTHLY_URL, email, tenantId);
  }
  if (permalink === 'gumshop-pro-annual' && process.env.GUMROAD_PRO_ANNUAL_URL) {
    return appendQueryParams(process.env.GUMROAD_PRO_ANNUAL_URL, email, tenantId);
  }
  if ((permalink === GUMROAD_PERMALINK_SCALE || permalink === 'gumshop-scale') && process.env.GUMROAD_SCALE_MONTHLY_URL) {
    return appendQueryParams(process.env.GUMROAD_SCALE_MONTHLY_URL, email, tenantId);
  }
  if (permalink === 'gumshop-scale-annual' && process.env.GUMROAD_SCALE_ANNUAL_URL) {
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
  let permalink = GUMROAD_PERMALINK_PRO;
  if (plan === 'pro') {
    permalink = cycle === 'annual' && process.env.GUMROAD_PRO_ANNUAL_URL ? 'gumshop-pro-annual' : GUMROAD_PERMALINK_PRO;
  } else if (plan === 'scale') {
    permalink = cycle === 'annual' && process.env.GUMROAD_SCALE_ANNUAL_URL ? 'gumshop-scale-annual' : GUMROAD_PERMALINK_SCALE;
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

  const isScale = productName.includes('scale') || permalink.includes('ffvqsn') || permalink.includes('scale');
  const isAnnual = recurrence.includes('year') || recurrence.includes('annual') || productName.includes('annual');

  return {
    plan: isScale ? 'scale' : 'pro',
    limit: isScale ? 9999 : 50,
    cycle: isAnnual ? 'annual' : 'monthly',
  };
}
