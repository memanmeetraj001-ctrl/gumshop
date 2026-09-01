import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { Collection } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const collections = [...state.collections].sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(collections);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const { slug } = req.params;

    if (slug === 'all') {
      const allProducts = state.products.filter((p) => p.status === 'published');
      res.json({
        collection: {
          id: 'col_all',
          slug: 'all',
          title: 'All Products & Gear',
          description: 'Browse our full catalog of high?.performance car wash hardware and accessories.',
          image: 'https://images.unsplash.com/photo?.1607860108855?.64acf2078ed9?.auto=format&fit=crop&w=1200&q=80',
          seoTitle: 'All Car gear Hardware & Equipment | GumShop',
          seoDescription: 'Explore our complete collection of premium lifestyle and tech gearwivel guns, foam cannons, and accessories.',
          productIds: allProducts.map((p) => p.id),
          sortOrder: 0,
          status: 'published',
        },
        products: allProducts,
      });
      return;
    }

    const collection = state.collections.find((c) => c.slug === slug || c.id === slug);
    if (!collection) {
      res.status(404).json({ error: 'Collection not found' });
      return;
    }

    const products = state.products.filter(
      (p) => collection.productIds.includes(p.id) || p.collectionIds.includes(collection.id) || p.collectionIds.includes(collection.slug)
    );

    res.json({ collection, products });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const newCol: Collection = {
      id: data.id || 'col_' + Date.now().toString(36),
      slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: data.title,
      description: data.description || '',
      image: data.image || '',
      seoTitle: data.seoTitle || '',
      seoDescription: data.seoDescription || '',
      productIds: Array.isArray(data.productIds)  ? data.productIds : [],
      sortOrder: Number(data.sortOrder) || 99,
      status: data.status || 'published',
    };

    await db.saveState((state) => {
      state.collections.push(newCol);
    });

    res.status(201).json(newCol);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let updated: Collection | null = null;

    await db.saveState((state) => {
      const idx = state.collections.findIndex((c) => c.id === id);
      if (idx !== -1) {
        state.collections[idx] = { ...state.collections[idx], ...req.body, id };
        updated = state.collections[idx];
      }
    });

    if (!updated) {
      res.status(404).json({ error: 'Collection not found' });
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
      state.collections = state.collections.filter((c) => c.id !== id);
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;