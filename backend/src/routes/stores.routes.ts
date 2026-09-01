import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Public: Get Store by Slug
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const state = await db.getState();

    const tenant = (state.tenants || []).find((t) => t.slug === slug || t.id === slug);
    if (!tenant) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }

    const tenantProducts = state.products.filter((p) => (!p.tenantId && tenant.slug === 'demo') || p.tenantId === tenant.id);
    const tenantCategories = state.categories.filter((c) => (!c.tenantId && tenant.slug === 'demo') || c.tenantId === tenant.id);
    const tenantBundles = state.bundles.filter((b) => (!b.tenantId && tenant.slug === 'demo') || b.tenantId === tenant.id);

    res.json({
      store: {
        id: tenant.id,
        slug: tenant.slug,
        storeName: tenant.storeName,
        tagline: tenant.tagline,
        primaryColor: tenant.primaryColor || '#6366F1',
        currency: tenant.currency || 'USD',
        gumroadStoreUrl: tenant.gumroadStoreUrl,
        plan: tenant.plan,
        createdAt: tenant.createdAt,
      },
      productsCount: tenantProducts.length,
      categories: tenantCategories,
      bundles: tenantBundles,
      theme: state.themeSettings,
      siteSettings: state.siteSettings,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Get Products for Store Slug
router.get('/:slug/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const state = await db.getState();

    const tenant = (state.tenants || []).find((t) => t.slug === slug || t.id === slug);
    if (!tenant) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }

    const products = state.products
      .filter((p) => ((!p.tenantId && tenant.slug === 'demo') || p.tenantId === tenant.id) && p.status === 'published')
      .sort((a, b) => a.sortOrder - b.sortOrder);

    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Super-Admin: Get all tenants / stores overview
router.get('/super/all', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const tenants = state.tenants || [];

    const stats = tenants.map((t) => {
      const prods = state.products.filter((p) => p.tenantId === t.id || (!p.tenantId && t.slug === 'demo'));
      const ords = (state.orders || []).filter((o) => o.tenantId === t.id);
      const rev = ords.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

      return {
        ...t,
        productCount: prods.length,
        orderCount: ords.length,
        totalRevenue: rev,
      };
    });

    res.json({
      totalStores: tenants.length,
      totalProducts: state.products.length,
      totalOrders: (state.orders || []).length,
      stores: stats,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Super-Admin: Update Tenant Plan
router.patch('/super/:id/plan', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { plan, productLimit } = req.body;

    await db.saveState((s) => {
      const target = (s.tenants || []).find((t) => t.id === id || t.slug === id);
      if (target) {
        if (plan) target.plan = plan;
        if (productLimit !== undefined) target.productLimit = productLimit;
        target.updatedAt = new Date().toISOString();
      }
    });

    res.json({ success: true, message: 'Tenant plan updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Super-Admin: Toggle Store Active Status
router.patch('/super/:id/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let newStatus = true;

    await db.saveState((s) => {
      const target = (s.tenants || []).find((t) => t.id === id || t.slug === id);
      if (target) {
        target.isActive = target.isActive === false ? true : false;
        newStatus = target.isActive;
        target.updatedAt = new Date().toISOString();
      }
    });

    res.json({ success: true, isActive: newStatus });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
