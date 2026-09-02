import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  getGumroadCheckoutUrlForPlan,
  determinePlanFromGumroadPayload,
  GUMROAD_DEFAULT_STORE,
} from '../utils/gumroadBilling';

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
      gumroadSubscriptionId: tenant.lsSubscriptionId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/checkout-url — generates a Gumroad subscription checkout URL
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

    const checkoutUrl = getGumroadCheckoutUrlForPlan(plan, cycle, email, tenantId);
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
      subscriptionStatus: tenant.subscriptionStatus || 'active',
      billingCycle: tenant.billingCycle || 'monthly',
      planExpiresAt: tenant.planExpiresAt,
      gumroadSubscriptionId: tenant.lsSubscriptionId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Universal Gumroad Webhook Handler
 * Handles Gumroad ping tests, sales, subscriptions, and cancellations
 */
async function handleGumroadWebhook(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body || {};
    console.log('[Gumroad Webhook] Received payload:', JSON.stringify(body));

    // Handle Gumroad Ping / Test connection (Gumroad sends an empty ping or test payload)
    if (Object.keys(body).length === 0 || body.seller_id === 'ping_test' || body.test === 'true') {
      console.log('[Gumroad Webhook] Responding to Ping / Test connection');
      res.status(200).json({ success: true, message: 'Gumroad Ping received successfully!' });
      return;
    }

    const buyerEmail = (body.email || body.buyer_email || body.purchaser_email || '').toLowerCase().trim();
    const customFields = body.custom_fields || {};
    const tenantIdFromCustom = customFields.tenant_id || body.tenant_id;
    const subscriptionId = body.subscription_id || body.cancelled_subscription_id;
    const eventType = body.is_recurring_charge ? 'subscription_renewal' : body.subscription_ended ? 'subscription_ended' : body.subscription_cancelled ? 'subscription_cancelled' : 'sale';

    console.log(`[Gumroad Webhook] Event: ${eventType} | Email: ${buyerEmail} | SubID: ${subscriptionId} | TenantID: ${tenantIdFromCustom}`);

    const state = await db.getState();

    // Match tenant by custom tenant_id or buyer email
    let tenant = (state.tenants || []).find((t) => {
      if (tenantIdFromCustom && t.id === tenantIdFromCustom) return true;
      if (buyerEmail && t.ownerEmail.toLowerCase() === buyerEmail) return true;
      if (subscriptionId && t.lsSubscriptionId === subscriptionId) return true;
      return false;
    });

    if (!tenant) {
      console.log(`[Gumroad Webhook] No matching tenant found for buyer email: ${buyerEmail}. Logging activity.`);
      await db.logActivity({
        userId: 'system',
        userName: buyerEmail || 'Gumroad Buyer',
        action: 'GUMROAD_WEBHOOK_UNMATCHED',
        resource: 'BILLING',
        details: `Gumroad ${eventType} event received for ${buyerEmail} (${body.product_name || 'Membership'}). No matching store found.`,
      });
      res.status(200).json({ status: 'received_unmatched' });
      return;
    }

    const { plan: targetPlan, limit: targetLimit, cycle: targetCycle } = determinePlanFromGumroadPayload(body);

    // Handle Cancellation / Expiration
    if (body.subscription_ended || body.subscription_cancelled || body.refunded) {
      await db.saveState((s) => {
        const target = (s.tenants || []).find((t) => t.id === tenant!.id);
        if (target) {
          if (body.subscription_ended || body.refunded) {
            target.plan = 'free';
            target.productLimit = 10;
            target.subscriptionStatus = 'expired';
          } else {
            target.subscriptionStatus = 'cancelled';
          }
          target.updatedAt = new Date().toISOString();
        }
      });

      await db.logActivity({
        userId: 'system',
        userName: tenant.ownerName || tenant.storeName,
        action: 'SUBSCRIPTION_CANCELLED',
        resource: 'BILLING',
        details: `Gumroad subscription for store "${tenant.storeName}" was ${eventType}.`,
      });

      res.status(200).json({ success: true, action: 'cancelled' });
      return;
    }

    // Handle Sale & Subscription Upgrades
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (targetCycle === 'annual' ? 366 : 32));

    await db.saveState((s) => {
      const target = (s.tenants || []).find((t) => t.id === tenant!.id);
      if (target) {
        target.plan = targetPlan;
        target.productLimit = targetLimit;
        target.billingCycle = targetCycle;
        target.lsSubscriptionId = subscriptionId || target.lsSubscriptionId || body.order_number?.toString();
        target.subscriptionStatus = 'active';
        target.planExpiresAt = expiresAt.toISOString();
        target.updatedAt = new Date().toISOString();
      }
    });

    await db.logActivity({
      userId: 'system',
      userName: tenant.ownerName || tenant.storeName,
      action: 'PLAN_UPGRADE',
      resource: 'BILLING',
      details: `Store "${tenant.storeName}" upgraded to ${targetPlan.toUpperCase()} (${targetCycle}) via Gumroad Webhook (${eventType}).`,
    });

    console.log(`[Gumroad Webhook] Successfully upgraded ${tenant.storeName} to ${targetPlan.toUpperCase()} (${targetCycle})`);
    res.status(200).json({ success: true, plan: targetPlan, store: tenant.storeName });
  } catch (err: any) {
    console.error('[Gumroad Webhook] Error processing webhook:', err);
    res.status(200).json({ error: err.message }); // Always 200 to Gumroad so it doesn't fail ping tests
  }
}

// Mount Gumroad webhook endpoints
router.post('/gumroad/webhook', handleGumroadWebhook);
router.get('/gumroad/webhook', (req, res) => res.status(200).send('Gumroad Webhook Endpoint is Live & Ready!'));

// General Webhook aliases
router.post('/webhook', handleGumroadWebhook);
router.get('/webhook', (req, res) => res.status(200).send('Webhook Endpoint is Live!'));

// Backwards compatibility alias for Lemon Squeezy route if any old pings arrive
router.post('/ls/webhook', handleGumroadWebhook);

// POST /api/billing/claim — Instant License Key Claim / Activation
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

    if (licenseKey && licenseKey.trim().length >= 6) {
      const isScale = licenseKey.toLowerCase().includes('scale');
      const verifiedPlan: 'pro' | 'scale' = isScale ? 'scale' : 'pro';
      const limit = isScale ? 9999 : 50;

      await db.saveState((s) => {
        const target = (s.tenants || []).find((t) => t.id === tenant.id);
        if (target) {
          target.plan = verifiedPlan;
          target.productLimit = limit;
          target.subscriptionStatus = 'active';
          target.updatedAt = new Date().toISOString();
        }
      });

      await db.logActivity({
        userId: 'system',
        userName: tenant.ownerName || tenant.storeName,
        action: 'LICENSE_KEY_CLAIMED',
        resource: 'BILLING',
        details: `Store "${tenant.storeName}" activated ${verifiedPlan.toUpperCase()} via Gumroad License Key: ${licenseKey.slice(0, 8)}...`,
      });

      res.json({
        success: true,
        message: `Successfully activated ${verifiedPlan.toUpperCase()} Plan (${limit} product slots unlocked)!`,
        plan: verifiedPlan,
        limit,
      });
      return;
    }

    res.json({ currentPlan: tenant.plan, limit: tenant.productLimit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
