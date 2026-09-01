import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { ThemeSettings } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    res.json(state.themeSettings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updates = req.body;
    let updatedTheme: ThemeSettings | null = null;

    await db.saveState((state) => {
      state.themeSettings = {
        ...state.themeSettings,
        ...updates,
      };
      updatedTheme = state.themeSettings;
    });

    if (req.user) {
      await db.logActivity({
        userId: req.user.id,
        userName: req.user.name,
        action: 'UPDATE',
        resource: 'APPEARANCE',
        details: 'Updated theme branding and color settings',
      });
    }

    res.json(updatedTheme);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;