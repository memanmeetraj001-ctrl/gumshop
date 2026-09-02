import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { PaymentIntegration } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    res.json(state.paymentIntegrations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, requireRole(['superadmin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let updated: PaymentIntegration | null = null;

    await db.saveState((state) => {
      const idx = state.paymentIntegrations.findIndex((p) => p.id === id);
      if (idx !== -1) {
        state.paymentIntegrations[idx] = { ...state.paymentIntegrations[idx], ...req.body, id };
        updated = state.paymentIntegrations[idx];
      }
    });

    if (!updated) {
      res.status(404).json({ error: 'Payment integration not found' });
      return;
    }

    if (req.user) {
      await db.logActivity({
        userId: req.user.id,
        userName: req.user.name,
        action: 'UPDATE',
        resource: 'PAYMENTS',
        details: `Updated payment settings for ${id}`,
      });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Test Gumroad Access Token
router.post('/gumroad/test', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      res.status(400).json({ error: 'Access token is required.' });
      return;
    }

    // Call Gumroad User endpoint
    const response = await fetch('https://api.gumroad.com/v2/user', {
      headers: {
        'Authorization': `Bearer ${accessToken.trim()}`,
      },
    });

    const data: any = await response.json();
    if (response.ok && data.success) {
      res.json({
        success: true,
        user: {
          name: data.user.name,
          email: data.user.email,
          url: data.user.url,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: data.message || 'Invalid Gumroad Access Token. Please check your token in Gumroad Settings > Advanced > Applications.',
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Connection test failed.' });
  }
});

// Sync Catalog to Gumroad (Supports All, Selected, or Single Product)
router.post('/gumroad/sync', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { accessToken, storeUrl, productIds } = req.body;
    if (!accessToken) {
      res.status(400).json({ error: 'Gumroad Access Token is required to sync.' });
      return;
    }

    const state = await db.getState();
    const allProducts = state.products || [];
    
    // Determine target subset
    const targetIds = Array.isArray(productIds) && productIds.length > 0 ? productIds : null;
    const productsToSync = targetIds 
      ? allProducts.filter((p) => targetIds.includes(p.id)) 
      : allProducts;

    if (productsToSync.length === 0) {
      res.status(400).json({ error: 'No matching products found to sync.' });
      return;
    }

    const results: Array<{ productId: string; title: string; status: 'created' | 'linked' | 'failed'; gumroadUrl?: string; error?: string }> = [];

    // First: fetch existing Gumroad products to avoid creating duplicates
    let existingGumroadProducts: any[] = [];
    try {
      const listRes = await fetch('https://api.gumroad.com/v2/products', {
        headers: { 'Authorization': `Bearer ${accessToken.trim()}` },
      });
      const listData: any = await listRes.json();
      if (listData.success && Array.isArray(listData.products)) {
        existingGumroadProducts = listData.products;
      }
    } catch {
      // Continue anyway — may still be able to create
    }

    for (const prod of productsToSync) {
      try {
        // Check if product already exists on Gumroad by name or slug
        const matched = existingGumroadProducts.find(
          (gp) => gp.name?.toLowerCase() === prod.title.toLowerCase() || gp.custom_permalink === prod.slug
        );

        if (matched && matched.short_url) {
          prod.gumroadUrl = matched.short_url;
          results.push({
            productId: prod.id,
            title: prod.title,
            status: 'linked',
            gumroadUrl: matched.short_url,
          });
          continue;
        }

        // Create new product on Gumroad API
        const priceCents = Math.round(prod.price * 100);
        const description = (prod.shortDescription || prod.description || prod.title).substring(0, 2000);
        const params = new URLSearchParams();
        params.append('name', prod.title);
        params.append('price', priceCents.toString());
        params.append('description', description);
        params.append('currency', 'usd');
        params.append('custom_permalink', prod.slug);

        const createRes = await fetch('https://api.gumroad.com/v2/products', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken.trim()}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        const createData: any = await createRes.json();
        if (createRes.ok && createData.success && createData.product) {
          const generatedUrl = createData.product.short_url || createData.product.url;
          prod.gumroadUrl = generatedUrl;
          results.push({
            productId: prod.id,
            title: prod.title,
            status: 'created',
            gumroadUrl: generatedUrl,
          });
        } else {
          // Fallback: construct a direct store link using the slug
          const baseUrl = (storeUrl || 'https://gumroad.com').replace(/\/$/, '');
          const fallbackUrl = `${baseUrl}/l/${prod.slug}`;
          prod.gumroadUrl = fallbackUrl;
          results.push({
            productId: prod.id,
            title: prod.title,
            status: 'linked',
            gumroadUrl: fallbackUrl,
            error: createData?.message,
          });
        }
      } catch (err: any) {
        results.push({
          productId: prod.id,
          title: prod.title,
          status: 'failed',
          error: err.message,
        });
      }
    }

    // Persist updated gumroadUrls in database state
    await db.saveState((s) => {
      s.products = (s.products || []).map((p) => {
        const matched = productsToSync.find((item) => item.id === p.id);
        return matched || p;
      });
      const gumroadSetting = s.paymentIntegrations.find((p) => p.provider === 'gumroad');
      if (gumroadSetting) {
        gumroadSetting.settingsJson = {
          ...gumroadSetting.settingsJson,
          accessToken: accessToken.trim(),
          lastSyncedAt: new Date().toISOString(),
        };
        if (storeUrl) gumroadSetting.storeUrl = storeUrl;
      }
    });

    if (req.user) {
      await db.logActivity({
        userId: req.user.id,
        userName: req.user.name,
        action: 'SYNC',
        resource: 'GUMROAD',
        details: `Synced ${results.filter((r) => r.status !== 'failed').length}/${productsToSync.length} products with Gumroad API`,
      });
    }

    res.json({
      success: true,
      totalProducts: productsToSync.length,
      syncedCount: results.filter((r) => r.status !== 'failed').length,
      results,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gumroad sync failed.' });
  }
});

export default router;
