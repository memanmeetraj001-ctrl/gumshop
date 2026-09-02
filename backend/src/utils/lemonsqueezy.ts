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
const API_KEY = process.env.LEMONSQUEEZY_API_KEY || '';

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
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';
  if (!secret) {
    console.warn('[LemonSqueezy Webhook] Warning: LEMONSQUEEZY_WEBHOOK_SECRET is not configured.');
    return process.env.NODE_ENV !== 'production';
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
