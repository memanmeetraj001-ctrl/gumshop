import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { Category } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const categories = [...state.categories].sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const newCategory: Category = {
      id: data.id || 'cat_' + Date.now().toString(36),
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: data.name,
      description: data.description || '',
      image: data.image || '',
      icon: data.icon || 'Sparkles',
      sortOrder: Number(data.sortOrder) || 99,
      status: data.status || 'active',
    };

    await db.saveState((state) => {
      state.categories.push(newCategory);
    });

    if (req.user) {
      await db.logActivity({
        userId: req.user.id,
        userName: req.user.name,
        action: 'CREATE',
        resource: 'CATEGORY',
        details: `Created category "${newCategory.name}"`,
      });
    }

    res.status(201).json(newCategory);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let updated: Category | null = null;

    await db.saveState((state) => {
      const idx = state.categories.findIndex((c) => c.id === id);
      if (idx !== -1) {
        state.categories[idx] = { ...state.categories[idx], ...req.body, id };
        updated = state.categories[idx];
      }
    });

    if (!updated) {
      res.status(404).json({ error: 'Category not found' });
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
      state.categories = state.categories.filter((c) => c.id !== id);
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;