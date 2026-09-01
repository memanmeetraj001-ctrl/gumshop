import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { NavigationItem } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const items = [...state.navigationItems].sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const newItem: NavigationItem = {
      id: data.id || 'nav_' + Date.now().toString(36),
      label: data.label,
      url: data.url || '/',
      icon: data.icon || '',
      parentId: data.parentId || null,
      openNewTab: Boolean(data.openNewTab),
      visible: data.visible !== undefined  ? Boolean(data.visible) : true,
      sortOrder: Number(data.sortOrder) || 99,
      badge: data.badge || '',
    };

    await db.saveState((state) => {
      state.navigationItems.push(newItem);
    });

    res.status(201).json(newItem);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let updated: NavigationItem | null = null;

    await db.saveState((state) => {
      const idx = state.navigationItems.findIndex((n) => n.id === id);
      if (idx !== -1) {
        state.navigationItems[idx] = { ...state.navigationItems[idx], ...req.body, id };
        updated = state.navigationItems[idx];
      }
    });

    if (!updated) {
      res.status(404).json({ error: 'Item not found' });
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
      state.navigationItems = state.navigationItems.filter((n) => n.id !== id && n.parentId !== id);
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;