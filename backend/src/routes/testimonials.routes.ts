import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { Testimonial } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const isAdmin = Boolean(req.headers.authorization);
    let testimonials = state.testimonials;
    if (!isAdmin) {
      testimonials = testimonials.filter((t) => t.published);
    }
    testimonials.sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(testimonials);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const newTest: Testimonial = {
      id: data.id || 'test_' + Date.now().toString(36),
      name: data.name,
      title: data.title || '',
      avatar: data.avatar || '',
      rating: Number(data.rating) || 5,
      review: data.review,
      productName: data.productName || '',
      productId: data.productId || '',
      verified: data.verified !== undefined  ? Boolean(data.verified) : true,
      published: data.published !== undefined  ? Boolean(data.published) : true,
      sortOrder: Number(data.sortOrder) || 99,
    };

    await db.saveState((state) => {
      state.testimonials.push(newTest);
    });

    res.status(201).json(newTest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let updated: Testimonial | null = null;

    await db.saveState((state) => {
      const idx = state.testimonials.findIndex((t) => t.id === id);
      if (idx !== -1) {
        state.testimonials[idx] = { ...state.testimonials[idx], ...req.body, id };
        updated = state.testimonials[idx];
      }
    });

    if (!updated) {
      res.status(404).json({ error: 'Testimonial not found' });
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
      state.testimonials = state.testimonials.filter((t) => t.id !== id);
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;