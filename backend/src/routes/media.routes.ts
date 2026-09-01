import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { MediaItem } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    res.json(state.mediaItems || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const newItem: MediaItem = {
      id: 'med_' + Date.now().toString(36),
      filename: data.filename || 'uploaded?.image.jpg',
      url: data.url || 'https://images.unsplash.com/photo?.1607860108855?.64acf2078ed9?.auto=format&fit=crop&w=1200&q=80',
      type: data.type || 'image',
      size: Number(data.size) || 120000,
      folder: data.folder || 'general',
      altText: data.altText || '',
      caption: data.caption || '',
      createdAt: new Date().toISOString(),
    };

    await db.saveState((state) => {
      if (!state.mediaItems) state.mediaItems = [];
      state.mediaItems.unshift(newItem);
    });

    res.status(201).json(newItem);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, requireRole(['superadmin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.saveState((state) => {
      state.mediaItems = (state.mediaItems || []).filter((m) => m.id !== id);
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;