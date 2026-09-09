import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { Affiliate } from '../types';

const router = Router();

// Helper to sanitize affiliate codes (alphanumeric + dashes only)
function sanitizeCode(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 30);
}

// =======================================================
// PUBLIC AFFILIATE ENDPOINTS
// =======================================================

/**
 * POST /api/affiliates/register
 * Register a new affiliate partner or retrieve an existing one by email.
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, customCode, payoutAddress, payoutMethod } = req.body;

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'A valid email address is required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const state = await db.getState();
    const affiliates: Affiliate[] = state.affiliates || [];

    // Check if affiliate already exists by email
    const existing = affiliates.find((a) => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      if (payoutAddress && !existing.payoutAddress) {
        await db.saveState((s) => {
          const target = (s.affiliates || []).find((a) => a.id === existing.id);
          if (target) {
            target.payoutAddress = payoutAddress;
            if (payoutMethod) target.payoutMethod = payoutMethod;
            target.updatedAt = new Date().toISOString();
          }
        });
      }
      res.json({
        message: 'Welcome back! Here is your active affiliate partner link.',
        affiliate: existing,
        referralUrl: `https://gumshop.online/?ref=${existing.code}`,
      });
      return;
    }

    // Determine unique code
    let baseCode = customCode ? sanitizeCode(customCode) : sanitizeCode(cleanEmail.split('@')[0]);
    if (!baseCode || baseCode.length < 2) {
      baseCode = `partner-${Math.random().toString(36).slice(2, 6)}`;
    }

    let code = baseCode;
    let counter = 1;
    while (affiliates.some((a) => a.code.toLowerCase() === code.toLowerCase())) {
      code = `${baseCode}${counter++}`;
    }

    const newAffiliate: Affiliate = {
      id: `aff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      code,
      email: cleanEmail,
      name: name?.trim() || cleanEmail.split('@')[0],
      payoutMethod: payoutMethod || 'paypal',
      payoutAddress: payoutAddress?.trim() || cleanEmail,
      commissionRate: 0.20, // 20% lifetime recurring commission
      totalClicks: 0,
      totalConversions: 0,
      totalVolume: 0,
      totalEarnings: 0,
      paidEarnings: 0,
      unpaidEarnings: 0,
      status: 'active',
      referredTenants: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.saveState((s) => {
      s.affiliates = s.affiliates || [];
      s.affiliates.push(newAffiliate);
    });

    res.status(201).json({
      message: 'Successfully enrolled in GumShop Creator Partner Program!',
      affiliate: newAffiliate,
      referralUrl: `https://gumshop.online/?ref=${newAffiliate.code}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Affiliate registration failed' });
  }
});

/**
 * GET /api/affiliates/track/:code
 * Public hit counter when a customer lands with ?ref=code
 */
router.get('/track/:code', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawCode = req.params.code;
    const cleanCode = sanitizeCode(rawCode);

    if (!cleanCode) {
      res.json({ tracked: false });
      return;
    }

    await db.saveState((s) => {
      const target = (s.affiliates || []).find((a) => a.code.toLowerCase() === cleanCode.toLowerCase() && a.status === 'active');
      if (target) {
        target.totalClicks = (target.totalClicks || 0) + 1;
        target.updatedAt = new Date().toISOString();
      }
    });

    res.json({ tracked: true, code: cleanCode });
  } catch {
    res.json({ tracked: false });
  }
});

/**
 * GET /api/affiliates/stats/:codeOrEmail
 * Public stats for an affiliate checking their own earnings
 */
router.get('/stats/:codeOrEmail', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.params.codeOrEmail.toLowerCase().trim();
    const state = await db.getState();
    const affiliates = state.affiliates || [];
    const target = affiliates.find(
      (a) => a.code.toLowerCase() === query || a.email.toLowerCase() === query
    );

    if (!target) {
      res.status(404).json({ error: 'No partner found with that referral code or email.' });
      return;
    }

    res.json({
      affiliate: {
        code: target.code,
        name: target.name,
        email: target.email,
        commissionRate: target.commissionRate,
        totalClicks: target.totalClicks || 0,
        totalConversions: target.totalConversions || 0,
        totalEarnings: target.totalEarnings || 0,
        unpaidEarnings: target.unpaidEarnings || 0,
        paidEarnings: target.paidEarnings || 0,
        status: target.status,
        referralUrl: `https://gumshop.online/?ref=${target.code}`,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =======================================================
// MASTER ADMIN SPECIFIC ENDPOINTS
// =======================================================

/**
 * GET /api/affiliates/master/all
 * Super Admin: Get all affiliates and aggregate partner metrics
 */
router.get('/master/all', authenticate, requireRole(['superadmin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const affiliates = state.affiliates || [];
    const tenants = state.tenants || [];

    // Calculate dynamic stats
    let totalClicks = 0;
    let totalConversions = 0;
    let totalUnpaid = 0;
    let totalPaid = 0;

    const enriched = affiliates.map((aff) => {
      totalClicks += aff.totalClicks || 0;
      totalConversions += aff.totalConversions || 0;
      totalUnpaid += aff.unpaidEarnings || 0;
      totalPaid += aff.paidEarnings || 0;

      // Count currently active referred stores
      const referredStores = tenants.filter((t) => aff.referredTenants?.includes(t.id) || t.referralCode === aff.code);

      return {
        ...aff,
        activeReferredStoresCount: referredStores.length,
      };
    });

    res.json({
      totalPartners: affiliates.length,
      totalClicks,
      totalConversions,
      totalUnpaidCommissions: Math.round(totalUnpaid * 100) / 100,
      totalPaidCommissions: Math.round(totalPaid * 100) / 100,
      affiliates: enriched,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/affiliates/master/create
 * Super Admin: Manually onboard a partner / VIP influencer
 */
router.post('/master/create', authenticate, requireRole(['superadmin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, customCode, commissionRate, payoutAddress, payoutMethod, notes } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Partner email is required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const state = await db.getState();
    const affiliates = state.affiliates || [];

    if (affiliates.some((a) => a.email.toLowerCase() === cleanEmail)) {
      res.status(400).json({ error: 'A partner with this email already exists.' });
      return;
    }

    let code = customCode ? sanitizeCode(customCode) : sanitizeCode(cleanEmail.split('@')[0]);
    if (!code) code = `vip-${Math.random().toString(36).slice(2, 6)}`;

    if (affiliates.some((a) => a.code.toLowerCase() === code.toLowerCase())) {
      res.status(400).json({ error: 'This referral code is already in use. Please choose another.' });
      return;
    }

    const newAffiliate: Affiliate = {
      id: `aff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      code,
      email: cleanEmail,
      name: name?.trim() || cleanEmail.split('@')[0],
      commissionRate: typeof commissionRate === 'number' ? commissionRate : 0.20,
      payoutMethod: payoutMethod || 'paypal',
      payoutAddress: payoutAddress?.trim() || cleanEmail,
      totalClicks: 0,
      totalConversions: 0,
      totalVolume: 0,
      totalEarnings: 0,
      paidEarnings: 0,
      unpaidEarnings: 0,
      status: 'active',
      referredTenants: [],
      notes: notes?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.saveState((s) => {
      s.affiliates = s.affiliates || [];
      s.affiliates.push(newAffiliate);
    });

    res.status(201).json({ affiliate: newAffiliate });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/affiliates/master/:id
 * Super Admin: Update partner commission rate, payout info, status, or notes
 */
router.patch('/master/:id', authenticate, requireRole(['superadmin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { commissionRate, status, payoutAddress, payoutMethod, notes, name } = req.body;

    let updatedAffiliate: Affiliate | null = null;

    await db.saveState((s) => {
      const target = (s.affiliates || []).find((a) => a.id === id || a.code === id);
      if (target) {
        if (typeof commissionRate === 'number') target.commissionRate = commissionRate;
        if (status && ['active', 'paused', 'banned'].includes(status)) target.status = status;
        if (payoutAddress !== undefined) target.payoutAddress = payoutAddress;
        if (payoutMethod !== undefined) target.payoutMethod = payoutMethod;
        if (notes !== undefined) target.notes = notes;
        if (name !== undefined) target.name = name;
        target.updatedAt = new Date().toISOString();
        updatedAffiliate = target;
      }
    });

    if (!updatedAffiliate) {
      res.status(404).json({ error: 'Affiliate not found' });
      return;
    }

    res.json({ affiliate: updatedAffiliate });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/affiliates/master/:id/payout
 * Super Admin: Mark earnings as paid
 */
router.post('/master/:id/payout', authenticate, requireRole(['superadmin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, note } = req.body;

    const payoutNum = parseFloat(amount);
    if (isNaN(payoutNum) || payoutNum <= 0) {
      res.status(400).json({ error: 'Invalid payout amount.' });
      return;
    }

    let updatedAffiliate: Affiliate | null = null;

    await db.saveState((s) => {
      const target = (s.affiliates || []).find((a) => a.id === id || a.code === id);
      if (target) {
        target.unpaidEarnings = Math.max(0, (target.unpaidEarnings || 0) - payoutNum);
        target.paidEarnings = (target.paidEarnings || 0) + payoutNum;
        if (note) {
          target.notes = target.notes ? `${target.notes}\n[Payout $${payoutNum} on ${new Date().toLocaleDateString()}]: ${note}` : `[Payout $${payoutNum} on ${new Date().toLocaleDateString()}]: ${note}`;
        }
        target.updatedAt = new Date().toISOString();
        updatedAffiliate = target;
      }
    });

    if (!updatedAffiliate) {
      res.status(404).json({ error: 'Affiliate not found' });
      return;
    }

    res.json({
      message: `Successfully recorded $${payoutNum} payout.`,
      affiliate: updatedAffiliate,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/affiliates/master/:id
 * Super Admin: Delete an affiliate partner
 */
router.delete('/master/:id', authenticate, requireRole(['superadmin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let deleted = false;

    await db.saveState((s) => {
      const idx = (s.affiliates || []).findIndex((a) => a.id === id || a.code === id);
      if (idx !== -1) {
        s.affiliates.splice(idx, 1);
        deleted = true;
      }
    });

    if (!deleted) {
      res.status(404).json({ error: 'Affiliate not found' });
      return;
    }

    res.json({ message: 'Affiliate partner removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
