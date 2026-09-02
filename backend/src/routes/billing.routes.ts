import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  getCheckoutUrlForPlan,
  verifyWebhookSignature,
  cancelLemonSqueezySubscription,
  VARIANT_MAP,
} from '../utils/lemonsqueezy';

const router = Router();

// GET /api/billing/plan — returns the authenticated user's real plan from their tenant record
router.get('/plan', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const tenant = (state.tenants || []).find(
      (t) => t.id === req.user?.tenantId || t.ownerEmail === req.user?.email
    );
    if (!tenant) {
      res.json({
        plan: 'free',
        productLimit: 10,
        storeName: 'My Store',
        subscriptionStatus: 'active',
        billingCycle: 'monthly',
      });
      return;
    }
    res.json({
      plan: tenant.plan || 'free',
      productLimit: tenant.productLimit || 10,
      storeName: tenant.storeName,
      subscriptionStatus: tenant.subscriptionStatus || 'active',
      billingCycle: tenant.billingCycle || 'monthly',
      planExpiresAt: tenant.planExpiresAt,
      lsSubscriptionId: tenant.lsSubscriptionId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/checkout-url — generates a Lemon Squeezy checkout URL for the authenticated user
router.post('/checkout-url', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { plan, cycle } = req.body as { plan: 'pro' | 'scale'; cycle: 'monthly' | 'annual' };
    if (!plan || !cycle) {
      res.status(400).json({ error: 'Plan and billing cycle are required.' });
      return;
    }

    const state = await db.getState();
    const tenant = (state.tenants || []).find(
      (t) => t.id === req.user?.tenantId || t.ownerEmail === req.user?.email
    );

    const email = req.user?.email || tenant?.ownerEmail || '';
    const tenantId = tenant?.id || req.user?.tenantId || '';

    const checkoutUrl = getCheckoutUrlForPlan(plan, cycle, email, tenantId);
    res.json({ checkoutUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/billing/subscription — get subscription details for active user
router.get('/subscription', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const tenant = (state.tenants || []).find(
      (t) => t.id === req.user?.tenantId || t.ownerEmail === req.user?.email
    );

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    res.json({
      plan: tenant.plan || 'free',
      productLimit: tenant.productLimit || 10,
      lsSubscriptionId: tenant.lsSubscriptionId,
      subscriptionStatus: tenant.subscriptionStatus || 'active',
      billingCycle: tenant.billingCycle || 'monthly',
      planExpiresAt: tenant.planExpiresAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/cancel — cancel active Lemon Squeezy subscription
router.post('/cancel', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const tenant = (state.tenants || []).find(
      (t) => t.id === req.user?.tenantId || t.ownerEmail === req.user?.email
    );

    if (!tenant || !tenant.lsSubscriptionId) {
      res.status(400).json({ error: 'No active Lemon Squeezy subscription found.' });
      return;
    }

    const cancelled = await cancelLemonSqueezySubscription(tenant.lsSubscriptionId);
    if (!cancelled) {
      res.status(500).json({ error: 'Failed to cancel subscription with Lemon Squeezy. Please try again.' });
      return;
    }

    await db.saveState((s) => {
      const target = (s.tenants || []).find((t) => t.id === tenant.id);
      if (target) {
        target.subscriptionStatus = 'cancelled';
        target.updatedAt = new Date().toISOString();
      }
    });

    await db.logActivity({
      userId: req.user?.id || 'system',
      userName: tenant.ownerName || tenant.storeName,
      action: 'SUBSCRIPTION_CANCELLED',
      resource: 'BILLING',
      details: `Subscription ${tenant.lsSubscriptionId} cancelled by user. Access retained until end of billing period.`,
    });

    res.json({ success: true, message: 'Subscription successfully cancelled.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/ls/webhook — Lemon Squeezy Webhook Listener
router.post('/ls/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = (req.headers['x-signature'] as string) || '';
    const rawBody = req.body;

    // Verify signature
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error('[LemonSqueezy Webhook] Invalid HMAC signature');
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    // Parse payload
    let payload: any;
    if (Buffer.isBuffer(rawBody)) {
      payload = JSON.parse(rawBody.toString('utf8'));
    } else if (typeof rawBody === 'string') {
      payload = JSON.parse(rawBody);
    } else {
      payload = rawBody;
    }

    const eventName = payload?.meta?.event_name;
    const customData = payload?.meta?.custom_data || {};
    const dataAttributes = payload?.data?.attributes || {};
    const subscriptionId = payload?.data?.id?.toString();
    const variantId = dataAttributes?.variant_id?.toString() || customData?.variant_id?.toString();
    const userEmail = (dataAttributes?.user_email || '').toLowerCase().trim();
    const tenantIdFromCustom = customData?.tenant_id;

    console.log(`[LemonSqueezy Webhook] Received event: ${eventName} | SubID: ${subscriptionId} | Email: ${userEmail} | Variant: ${variantId}`);

    const state = await db.getState();

    // Match tenant either by custom tenant_id or user email
    let tenant = (state.tenants || []).find((t) => {
      if (tenantIdFromCustom && t.id === tenantIdFromCustom) return true;
      if (userEmail && t.ownerEmail.toLowerCase() === userEmail) return true;
      if (subscriptionId && t.lsSubscriptionId === subscriptionId) return true;
      return false;
    });

    if (!tenant) {
      console.log(`[LemonSqueezy Webhook] No matching tenant found for email: ${userEmail}, tenant_id: ${tenantIdFromCustom}. Logging.`);
      await db.logActivity({
        userId: 'system',
        userName: 'Lemon Squeezy Webhook',
        action: 'BILLING_UNMATCHED',
        resource: 'PAYMENT',
        details: `Event ${eventName} for ${userEmail} (variant ${variantId}) could not be matched to a tenant.`,
      });
      res.status(200).json({ status: 'logged_unmatched' });
      return;
    }

    const variantInfo = variantId ? VARIANT_MAP[variantId] : undefined;
    const targetPlan = variantInfo?.plan || (dataAttributes?.product_name?.toLowerCase().includes('scale') ? 'scale' : 'pro');
    const targetLimit = variantInfo?.limit || (targetPlan === 'scale' ? 9999 : 50);
    const targetCycle = variantInfo?.cycle || (dataAttributes?.billing_interval === 'year' ? 'annual' : 'monthly');
    const renewsAt = dataAttributes?.renews_at || dataAttributes?.ends_at;

    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated':
      case 'subscription_payment_success':
      case 'subscription_resumed':
      case 'subscription_unpaused': {
        const subStatus = dataAttributes?.status === 'active' || dataAttributes?.status === 'on_trial' ? 'active' : dataAttributes?.status || 'active';
        
        await db.saveState((s) => {
          const target = (s.tenants || []).find((t) => t.id === tenant!.id);
          if (target) {
            target.plan = targetPlan;
            target.productLimit = targetLimit;
            target.billingCycle = targetCycle;
            target.lsSubscriptionId = subscriptionId || target.lsSubscriptionId;
            target.lsVariantId = variantId || target.lsVariantId;
            target.lsCustomerId = dataAttributes?.customer_id?.toString() || target.lsCustomerId;
            target.subscriptionStatus = subStatus;
            target.planExpiresAt = renewsAt || target.planExpiresAt;
            target.updatedAt = new Date().toISOString();
          }
        });

        await db.logActivity({
          userId: 'system',
          userName: tenant.ownerName || tenant.storeName,
          action: 'PLAN_UPGRADE',
          resource: 'BILLING',
          details: `Store "${tenant.storeName}" upgraded to ${targetPlan.toUpperCase()} (${targetCycle}) via Lemon Squeezy (${eventName}).`,
        });

        console.log(`[LemonSqueezy Webhook] Successfully upgraded ${tenant.storeName} to ${targetPlan.toUpperCase()} (${targetCycle})`);
        break;
      }

      case 'subscription_cancelled': {
        await db.saveState((s) => {
          const target = (s.tenants || []).find((t) => t.id === tenant!.id);
          if (target) {
            target.subscriptionStatus = 'cancelled';
            target.planExpiresAt = dataAttributes?.ends_at || target.planExpiresAt;
            target.updatedAt = new Date().toISOString();
          }
        });

        await db.logActivity({
          userId: 'system',
          userName: tenant.ownerName || tenant.storeName,
          action: 'SUBSCRIPTION_CANCELLED',
          resource: 'BILLING',
          details: `Subscription for store "${tenant.storeName}" was cancelled. Plan remains active until ${dataAttributes?.ends_at || 'period end'}.`,
        });
        break;
      }

      case 'subscription_expired': {
        await db.saveState((s) => {
          const target = (s.tenants || []).find((t) => t.id === tenant!.id);
          if (target) {
            target.plan = 'free';
            target.productLimit = 10;
            target.subscriptionStatus = 'expired';
            target.updatedAt = new Date().toISOString();
          }
        });

        await db.logActivity({
          userId: 'system',
          userName: tenant.ownerName || tenant.storeName,
          action: 'PLAN_DOWNGRADE',
          resource: 'BILLING',
          details: `Subscription expired for store "${tenant.storeName}". Downgraded to Free tier.`,
        });
        break;
      }

      case 'subscription_payment_failed': {
        await db.saveState((s) => {
          const target = (s.tenants || []).find((t) => t.id === tenant!.id);
          if (target) {
            target.subscriptionStatus = 'past_due';
            target.updatedAt = new Date().toISOString();
          }
        });
        break;
      }

      default:
        console.log(`[LemonSqueezy Webhook] Unhandled event: ${eventName}`);
    }

    res.status(200).json({ success: true, event: eventName });
  } catch (err: any) {
    console.error('[LemonSqueezy Webhook] Processing error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to check or manually claim plan status with license key / email
router.post('/claim', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, licenseKey } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const state = await db.getState();
    const tenant = (state.tenants || []).find((t) => t.ownerEmail.toLowerCase() === email.toLowerCase().trim());

    if (!tenant) {
      res.status(404).json({ error: 'No store account found matching this email.' });
      return;
    }

    let verifiedPlan: 'pro' | 'scale' = 'pro';
    if (licenseKey && licenseKey.trim().length >= 8) {
      verifiedPlan = licenseKey.toLowerCase().includes('scale') ? 'scale' : 'pro';
      const limit = verifiedPlan === 'scale' ? 9999 : 50;

      await db.saveState((s) => {
        const target = (s.tenants || []).find((t) => t.id === tenant.id);
        if (target) {
          target.plan = verifiedPlan;
          target.productLimit = limit;
          target.subscriptionStatus = 'active';
          target.updatedAt = new Date().toISOString();
        }
      });

      res.json({ success: true, message: `Successfully upgraded to ${verifiedPlan.toUpperCase()} Plan!`, plan: verifiedPlan, limit });
      return;
    }

    res.json({ currentPlan: tenant.plan, limit: tenant.productLimit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
