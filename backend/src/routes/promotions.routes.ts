import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { Promotion } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const isAdmin = Boolean(req.headers.authorization);
    let promos = state.promotions;
    if (!isAdmin) {
      promos = promos.filter((p) => p.enabled);
    }
    res.json(promos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public Promo Code Validation
router.post('/validate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, subtotal = 0 } = req.body;
    if (!code || typeof code !== 'string') {
      res.status(400).json({ valid: false, error: 'Promo code is required.' });
      return;
    }

    const state = await db.getState();
    const cleanCode = code.trim().toUpperCase();

    // Check promotions
    const promo = (state.promotions || []).find(
      (p) => p.enabled && p.discountCode && p.discountCode.toUpperCase() === cleanCode
    );

    if (!promo) {
      res.json({ valid: false, error: 'Invalid or expired promo code.' });
      return;
    }

    if (promo.minSpend && subtotal < promo.minSpend) {
      res.json({
        valid: false,
        error: `This code requires a minimum order of $${promo.minSpend.toFixed(2)}.`,
      });
      return;
    }

    let discountAmount = 0;
    const type = promo.discountType || (promo.discountValue ? 'percentage' : 'percentage');
    const val = promo.discountValue || 10;

    if (type === 'percentage') {
      discountAmount = Math.round(((subtotal * val) / 100) * 100) / 100;
    } else if (type === 'fixed_amount') {
      discountAmount = Math.min(subtotal, val);
    } else if (type === 'free_shipping') {
      discountAmount = 0; // Handled as free shipping
    }

    const newTotal = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

    res.json({
      valid: true,
      code: cleanCode,
      title: promo.title,
      discountType: type,
      discountValue: val,
      discountAmount,
      newTotal,
      message: type === 'percentage' ? `${val}% discount applied!` : `$${val.toFixed(2)} discount applied!`,
    });
  } catch (err: any) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

router.post('/', authenticate, requireRole(['superadmin', 'marketing', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const newPromo: Promotion = {
      id: data.id || 'promo_' + Date.now().toString(36),
      type: data.type || 'discount_code',
      title: data.title,
      description: data.description || '',
      ctaText: data.ctaText || '',
      ctaUrl: data.ctaUrl || '',
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
      discountCode: (data.discountCode || '').toUpperCase().trim(),
      discountType: data.discountType || 'percentage',
      discountValue: Number(data.discountValue) || 10,
      minSpend: Number(data.minSpend) || 0,
      settingsJson: data.settingsJson || {},
    };

    await db.saveState((state) => {
      state.promotions.push(newPromo);
    });

    res.status(201).json(newPromo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, requireRole(['superadmin', 'marketing', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let updated: Promotion | null = null;

    await db.saveState((state) => {
      const idx = state.promotions.findIndex((p) => p.id === id);
      if (idx !== -1) {
        state.promotions[idx] = { ...state.promotions[idx], ...req.body, id };
        if (state.promotions[idx].discountCode) {
          state.promotions[idx].discountCode = state.promotions[idx].discountCode?.toUpperCase().trim();
        }
        updated = state.promotions[idx];
      }
    });

    if (!updated) {
      res.status(404).json({ error: 'Promotion not found' });
      return;
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.saveState((state) => {
      state.promotions = state.promotions.filter((p) => p.id !== id);
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
