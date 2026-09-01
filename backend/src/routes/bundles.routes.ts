import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { Bundle } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const bundles = [...state.bundles].sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(bundles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const bundle = state.bundles.find((b) => b.slug === req.params.slug || b.id === req.params.slug);
    if (!bundle) {
      res.status(404).json({ error: 'Bundle not found' });
      return;
    }
    const products = state.products.filter((p) => bundle.productIds.includes(p.id));
    res.json({ bundle, products });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const newBundle: Bundle = {
      id: data.id || 'bundle_' + Date.now().toString(36),
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: data.name,
      description: data.description || '',
      image: data.image || '',
      productIds: Array.isArray(data.productIds)  ? data.productIds : [],
      price: Number(data.price) || 0,
      compareAtPrice: Number(data.compareAtPrice) || 0,
      badge: data.badge || '',
      ctaText: data.ctaText || 'Buy Bundle on Gumroad',
      gumroadUrl: data.gumroadUrl || '',
      status: data.status || 'published',
      sortOrder: Number(data.sortOrder) || 99,
    };

    await db.saveState((state) => {
      state.bundles.push(newBundle);
    });

    res.status(201).json(newBundle);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let updated: Bundle | null = null;

    await db.saveState((state) => {
      const idx = state.bundles.findIndex((b) => b.id === id);
      if (idx !== -1) {
        state.bundles[idx] = { ...state.bundles[idx], ...req.body, id };
        updated = state.bundles[idx];
      }
    });

    if (!updated) {
      res.status(404).json({ error: 'Bundle not found' });
      return;
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, requireRole(['superadmin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.saveState((state) => {
      state.bundles = state.bundles.filter((b) => b.id !== id);
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;