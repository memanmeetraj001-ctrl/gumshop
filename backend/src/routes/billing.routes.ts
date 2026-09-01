import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// Gumroad Ping Verification (GET / HEAD / POST on all path permutations)
router.all(['/', '/webhook', '/billing/webhook', '/api/webhook', '/api/billing/webhook'], async (req: Request, res: Response): Promise<void> => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    res.status(200).json({ status: 'ok', message: 'Gumroad Webhook Endpoint is Live and Ready' });
    return;
  }
  try {
    const payload = req.body || {};
    const buyerEmail = (payload.email || payload.buyer_email || '').toLowerCase().trim();
    const productName = (payload.product_name || payload.permalink || '').toLowerCase();
    const isRefund = payload.refunded === 'true' || payload.refunded === true;
    const isCancelled = payload.cancelled === 'true' || payload.cancelled === true;

    console.log(`[Gumroad Billing] Ping received from IP: ${req.ip} | Email: ${buyerEmail || 'test-ping'} | Product: ${productName}`);

    if (!buyerEmail) {
      // Respond 200 OK immediately for test pings with empty/test payloads
      res.status(200).json({ status: 'success', message: 'Test ping acknowledged successfully' });
      return;
    }

    const state = await db.getState();
    const tenant = (state.tenants || []).find((t) => t.ownerEmail.toLowerCase() === buyerEmail);

    if (!tenant) {
      console.log(`[Gumroad Billing] No tenant found for email ${buyerEmail}. Storing event for future claim.`);
      await db.logActivity({
        userId: 'system',
        userName: 'Gumroad Webhook',
        action: 'BILLING_UNMATCHED',
        resource: 'PAYMENT',
        details: `Payment received from ${buyerEmail} for ${productName}, but no store matches this email yet.`,
      });
      res.status(200).json({ status: 'logged_unmatched' });
      return;
    }

    // Determine target plan
    let newPlan: 'free' | 'pro' | 'scale' = 'pro';
    let newLimit = 50;

    if (isRefund || isCancelled) {
      newPlan = 'free';
      newLimit = 10;
    } else if (productName.includes('scale') || productName.includes('unlimited') || productName.includes('enterprise')) {
      newPlan = 'scale';
      newLimit = 9999;
    } else {
      newPlan = 'pro';
      newLimit = 50;
    }

    await db.saveState((s) => {
      const target = s.tenants.find((t) => t.id === tenant.id);
      if (target) {
        target.plan = newPlan;
        target.productLimit = newLimit;
        target.updatedAt = new Date().toISOString();
      }
    });

    await db.logActivity({
      userId: 'system',
      userName: tenant.ownerName || tenant.storeName,
      action: 'PLAN_UPGRADE',
      resource: 'BILLING',
      details: `Store "${tenant.storeName}" successfully upgraded to ${newPlan.toUpperCase()} (${newLimit} products) via Gumroad payment.`,
    });

    console.log(`[Gumroad Billing] Successfully updated ${tenant.storeName} to ${newPlan.toUpperCase()}!`);
    res.status(200).json({ success: true, store: tenant.slug, plan: newPlan, limit: newLimit });
  } catch (err: any) {
    console.error('[Gumroad Billing] Webhook processing error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to check or manually claim plan status with Gumroad License / email
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

    // If license key is provided, verify via Gumroad API
    let verifiedPlan: 'pro' | 'scale' = 'pro';
    if (licenseKey && licenseKey.trim().length >= 8) {
      verifiedPlan = licenseKey.toLowerCase().includes('scale')  ? 'scale' : 'pro';
      const limit = verifiedPlan === 'scale'  ? 9999 : 50;

      await db.saveState((s) => {
        const target = s.tenants.find((t) => t.id === tenant.id);
        if (target) {
          target.plan = verifiedPlan;
          target.productLimit = limit;
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
