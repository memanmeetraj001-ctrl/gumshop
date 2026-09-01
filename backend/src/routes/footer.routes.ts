import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { FooterColumn } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const columns = [...state.footerColumns].sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(columns);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { columns } = req.body;
    if (!Array.isArray(columns)) {
      res.status(400).json({ error: 'columns array required' });
      return;
    }

    await db.saveState((state) => {
      state.footerColumns = columns;
    });

    res.json(columns);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;