import crypto from 'crypto';

export interface PlanVariantInfo {
  plan: 'pro' | 'scale';
  cycle: 'monthly' | 'annual';
  limit: number;
}

export const VARIANT_MAP: Record<string, PlanVariantInfo> = {
  // Pro Monthly
  '2082941': { plan: 'pro', cycle: 'monthly', limit: 50 },
  // Pro Annual
  '2082945': { plan: 'pro', cycle: 'annual', limit: 50 },
  // Scale Monthly
  '2082951': { plan: 'scale', cycle: 'monthly', limit: 9999 },
  // Scale Annual
  '2082952': { plan: 'scale', cycle: 'annual', limit: 9999 },
};

export const PLAN_TO_VARIANT: Record<'pro' | 'scale', Record<'monthly' | 'annual', string>> = {
  pro: {
    monthly: process.env.LEMONSQUEEZY_VARIANT_PRO_MONTHLY || '2082941',
    annual: process.env.LEMONSQUEEZY_VARIANT_PRO_ANNUAL || '2082945',
  },
  scale: {
    monthly: process.env.LEMONSQUEEZY_VARIANT_SCALE_MONTHLY || '2082951',
    annual: process.env.LEMONSQUEEZY_VARIANT_SCALE_ANNUAL || '2082952',
  },
};

const STORE_SLUG = process.env.LEMONSQUEEZY_STORE_SLUG || 'gumshop';
const API_KEY = process.env.LEMONSQUEEZY_API_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiIxMjU5YmE0NjQxY2JhM2YyODU2ZTYwMTk4NTY5YmRkYzA0YzdkYmZmM2EyMDE5ZDAzZDNhNjNlN2EyYjdlNjJhNzBlZGMwOTUzNDVkZGVmMSIsImlhdCI6MTc4ODMyNzU4Mi41NzkxODIsIm5iZiI6MTc4ODMyNzU4Mi41NzkxODQsImV4cCI6MTgwNjQ1MTIwMC4wMjY5NjUsInN1YiI6Ijc4ODg3NTAiLCJzY29wZXMiOltdfQ.7gJPRAlU5x3Ot7J8Oq0yPx95NrvMGwOLJ3z5WOdQ2EGIoqqqFlkGH8JaUamxx5izOxUFFDrTdEExx3wrAwXEBhPF6azXrSz3H62A_539tPH08rYcxFhSUr_rL_xv6y6OgJb0WhbayGc9agyticCzSjSgAYCXn3eVonQLZbGjqiyxRKnyvs2wSBdfTWBGtmDT6QKJqNpnqeAPM_VxPNkjtJW_FW9h9QbSJqp7pLLkJKTRc-e5N4tgj2N0MsFfqp6tGVIQwnfUnZCC0E-dBJw4DfijgUyULEK5zhOydwIQUZMacPuXWgApUYMVHJ0ILkLJ6m89WxQgmEbGrl9HGQf1ioDWzkEr3ZeMkpfzIE-rhlKkDX1pnMxpyIoUZVwza-sfX9tDrUVook4vam4NLwMDSNxlyjyIH3J0AWxi8DJcKLcnn9WL6u-XUi6O7uXnWW730jW8YsxRi4G4lm6nzHP-uD4rkjsxyN73wYwEwa7QynUjjQ3rMzoUcPxY2kGK0IHujJ6eI4K1ulSeoNlYB-dqcw6TcM5Gj3uIby8YK2W4Yr7VaKiXspU2FMt9v1MGEzlTxxJtdkVtOOV9GCUITojOnekG4qXBr3JgHjjPo7cLTRoPgt9tZ1DljFB5246qqOMe-GrA5q4I4hZ2uv2ndAVWxn48_4Dog17awFx0xBsSpbs';

export function buildCheckoutUrl(variantId: string, email: string, tenantId: string): string {
  const base = `https://${STORE_SLUG}.lemonsqueezy.com/checkout/buy/${variantId}`;
  const params = new URLSearchParams();
  if (email) {
    params.append('checkout[email]', email);
  }
  if (tenantId) {
    params.append('checkout[custom][tenant_id]', tenantId);
  }
  params.append('checkout[custom][variant_id]', variantId);
  params.append('checkout[redirect_url]', 'https://gumshop.online/billing/success');
  
  return `${base}?${params.toString()}`;
}

export function getCheckoutUrlForPlan(
  plan: 'pro' | 'scale',
  cycle: 'monthly' | 'annual',
  email: string,
  tenantId: string
): string {
  const variantId = PLAN_TO_VARIANT[plan]?.[cycle] || (plan === 'scale' ? '2082951' : '2082941');
  return buildCheckoutUrl(variantId, email, tenantId);
}

export function verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || 'gumshop_ls_secret_950214';
  if (!secret) {
    // If no secret configured in env, allow through with warning in non-strict development
    console.warn('[LemonSqueezy Webhook] Warning: LEMONSQUEEZY_WEBHOOK_SECRET is not set.');
    return true;
  }
  if (!signature) {
    return false;
  }
  try {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');
    return digest.length === signatureBuffer.length && crypto.timingSafeEqual(digest, signatureBuffer);
  } catch (err) {
    console.error('[LemonSqueezy Webhook] Signature verification failed:', err);
    return false;
  }
}

export async function cancelLemonSqueezySubscription(subscriptionId: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'subscriptions',
          id: subscriptionId,
          attributes: {
            cancelled: true,
          },
        },
      }),
    });
    return response.ok;
  } catch (err) {
    console.error(`[LemonSqueezy] Failed to cancel subscription ${subscriptionId}:`, err);
    return false;
  }
}
