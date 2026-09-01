import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Public: Track click/view event (Gumroad checkout, product view)
router.post('/track', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventType, provider, productId, productTitle, url, referrer, metadata } = req.body;
    if (!eventType) {
      res.status(400).json({ error: 'eventType required' });
      return;
    }

    const event = await db.logEvent({
      eventType,
      provider: provider || undefined,
      productId: productId || undefined,
      productTitle: productTitle || undefined,
      url: url || req.headers.referer || undefined,
      referrer: referrer || req.headers.referer || undefined,
      userAgent: req.headers['user-agent'] as string,
      metadata: metadata || {},
    });

    res.status(201).json({ success: true, eventId: event.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Analytics dashboard statistics
router.get('/summary', authenticate, requireRole(['superadmin', 'marketing', 'editor', 'viewer']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const events = state.analyticsEvents || [];

    const totalProducts = state.products.length;
    const activeProducts = state.products.filter((p) => p.status === 'published').length;
    const draftProducts = totalProducts - activeProducts;

    const gumroadClicks = events.filter((e) => e.eventType === 'gumroad_click' || (e.eventType === 'checkout_click' && e.provider === 'gumroad')).length;
        const totalCheckoutClicks = gumroadClicks;
    const productViews = events.filter((e) => e.eventType === 'product_view').length;
    const newsletterSignups = events.filter((e) => e.eventType === 'newsletter_signup').length;

    // Top products by clicks/views
    const productCounts: Record<string, { title: string; clicks: number; views: number }> = {};
    events.forEach((e) => {
      if (e.productId) {
        if (!productCounts[e.productId]) {
          const p = state.products.find((prod) => prod.id === e.productId);
          productCounts[e.productId] = {
            title: p  ? p.title : (e.productTitle || e.productId),
            clicks: 0,
            views: 0,
          };
        }
        if (e.eventType.includes('click')) productCounts[e.productId].clicks++;
        if (e.eventType === 'product_view') productCounts[e.productId].views++;
      }
    });

    const topProducts = Object.entries(productCounts)
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    // 7-day timeline
    const now = Date.now();
    const sevenDaysTimeline: Array<{ date: string; gumroadClicks: number; views: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const dayEvents = events.filter((e) => e.timestamp.startsWith(dateStr));
      sevenDaysTimeline.push({
        date: dateStr,
        gumroadClicks: dayEvents.filter((e) => e.eventType === 'gumroad_click' || e.provider === 'gumroad').length,
                views: dayEvents.filter((e) => e.eventType === 'product_view' || e.eventType === 'page_view').length,
      });
    }

    res.json({
      metrics: {
        totalProducts,
        activeProducts,
        draftProducts,
        totalCheckoutClicks,
        gumroadClicks,
                productViews,
        newsletterSignups,
      },
      topProducts,
      sevenDaysTimeline,
      recentActivity: (state.adminActivity || []).slice(0, 10),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;