import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { SiteSettings } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    res.json(state.siteSettings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', authenticate, requireRole(['superadmin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updates = req.body;
    let updatedSettings: SiteSettings | null = null;

    await db.saveState((state) => {
      state.siteSettings = {
        ...state.siteSettings,
        ...updates,
      };
      updatedSettings = state.siteSettings;
    });

    if (req.user) {
      await db.logActivity({
        userId: req.user.id,
        userName: req.user.name,
        action: 'UPDATE',
        resource: 'SETTINGS',
        details: 'Updated global site settings & maintenance mode',
      });
    }

    res.json(updatedSettings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Newsletter subscription public endpoint
router.post('/newsletter', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Valid email required' });
      return;
    }

    await db.logEvent({
      eventType: 'newsletter_signup',
      url: req.headers.referer || '/',
      metadata: { email },
    });

    const state = await db.getState();
    res.json({
      success: true,
      message: state.siteSettings.newsletterSuccessMsg || 'Thank you for subscribing!',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;