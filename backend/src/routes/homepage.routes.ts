import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { HomepageSection } from '../types';

const router = Router();

// Public: Get all enabled homepage sections (or all sections if admin)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const isAdmin = Boolean(req.headers.authorization);

    let sections = state.homepageSections;
    if (!isAdmin) {
      sections = sections.filter((s) => s.enabled);
    }
    sections.sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(sections);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update/reorder multiple sections at once
router.post('/reorder', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sectionIds } = req.body; // array of section IDs in new order
    if (!Array.isArray(sectionIds)) {
      res.status(400).json({ error: 'sectionIds array is required' });
      return;
    }

    await db.saveState((state) => {
      sectionIds.forEach((id, index) => {
        const sec = state.homepageSections.find((s) => s.id === id);
        if (sec) {
          sec.sortOrder = index + 1;
        }
      });
    });

    if (req.user) {
      await db.logActivity({
        userId: req.user.id,
        userName: req.user.name,
        action: 'REORDER',
        resource: 'HOMEPAGE',
        details: 'Reordered homepage layout sections',
      });
    }

    const state = await db.getState();
    res.json(state.homepageSections.sort((a, b) => a.sortOrder - b.sortOrder));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Add new homepage section
router.post('/', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const newSection: HomepageSection = {
      id: data.id || 'sec_' + Date.now().toString(36),
      type: data.type || 'rich_text',
      title: data.title || 'New Section',
      subtitle: data.subtitle || '',
      content: data.content || '',
      image: data.image || '',
      secondaryImage: data.secondaryImage || '',
      videoUrl: data.videoUrl || '',
      buttonText: data.buttonText || '',
      buttonUrl: data.buttonUrl || '',
      secondaryButtonText: data.secondaryButtonText || '',
      secondaryButtonUrl: data.secondaryButtonUrl || '',
      enabled: data.enabled !== undefined  ? Boolean(data.enabled) : true,
      sortOrder: Number(data.sortOrder) || 99,
      settingsJson: data.settingsJson || {},
    };

    await db.saveState((state) => {
      state.homepageSections.push(newSection);
    });

    res.status(201).json(newSection);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update section
router.put('/:id', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let updated: HomepageSection | null = null;

    await db.saveState((state) => {
      const idx = state.homepageSections.findIndex((s) => s.id === id);
      if (idx !== -1) {
        state.homepageSections[idx] = { ...state.homepageSections[idx], ...req.body, id };
        updated = state.homepageSections[idx];
      }
    });

    if (!updated) {
      res.status(404).json({ error: 'Section not found' });
      return;
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete section
router.delete('/:id', authenticate, requireRole(['superadmin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.saveState((state) => {
      state.homepageSections = state.homepageSections.filter((s) => s.id !== id);
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;