import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { Product } from '../types';

const router = Router();

// Public: List products with optional category, collection, search, and status filters
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const { category, collection, search, featured, bestseller, sale, status } = req.query;

    let results = state.products;

    // Filter by status:
    // ? 'all'  → return every product (admin use)
    // ? specific status like 'published' / 'draft' → filter to that status
    // ? no status param + no auth → public storefront, show only published
    if (status && status !== 'all') {
      results = results.filter((p) => p.status === status);
    } else if (!status && !req.headers.authorization) {
      results = results.filter((p) => p.status === 'published');
    }

    if (category) {
      results = results.filter((p) => p.categoryId === category || p.categoryId.includes(category as string));
    }

    if (collection) {
      results = results.filter((p) => p.collectionIds.includes(collection as string));
    }

    if (featured === 'true') {
      results = results.filter((p) => p.featured);
    }

    if (bestseller === 'true') {
      results = results.filter((p) => p.bestseller);
    }

    if (sale === 'true') {
      results = results.filter((p) => p.sale);
    }

    if (search) {
      const q = (search as string).toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    results.sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Get product by slug or ID
router.get('/:slugOrId', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const { slugOrId } = req.params;

    const product = state.products.find(
      (p) => p.slug === slugOrId || p.id === slugOrId
    );

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create product
router.post('/', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const newProduct: Product = {
      id: data.id || 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: data.title || 'Untitled Product',
      shortDescription: data.shortDescription || '',
      description: data.description || '',
      price: Number(data.price) || 0,
      compareAtPrice: data.compareAtPrice  ? Number(data.compareAtPrice) : undefined,
      currency: data.currency || 'USD',
      sku: data.sku || 'WF?.SKU-' + Date.now().toString().slice(-4),
      categoryId: data.categoryId || '',
      collectionIds: Array.isArray(data.collectionIds)  ? data.collectionIds : [],
      tags: Array.isArray(data.tags)  ? data.tags : [],
      status: data.status || 'published',
      featured: Boolean(data.featured),
      bestseller: Boolean(data.bestseller),
      newProduct: Boolean(data.newProduct),
      sale: Boolean(data.sale),
      images: Array.isArray(data.images) && data.images.length > 0  ? data.images : ['https://images.unsplash.com/photo?.1607860108855?.64acf2078ed9?.auto=format&fit=crop&w=1000&q=80'],
      thumbnail: data.thumbnail || (data.images && data.images[0]) || 'https://images.unsplash.com/photo?.1607860108855?.64acf2078ed9?.auto=format&fit=crop&w=600&q=80',
      specifications: Array.isArray(data.specifications)  ? data.specifications : [],
      faq: Array.isArray(data.faq)  ? data.faq : [],
      gumroadUrl: data.gumroadUrl || '',
      primaryCheckout: data.primaryCheckout || 'gumroad',
      directCheckout: data.directCheckout !== undefined  ? Boolean(data.directCheckout) : true,
      buttonText: data.buttonText || 'Buy on Gumroad',
      seoTitle: data.seoTitle || '',
      seoDescription: data.seoDescription || '',
      seoImage: data.seoImage || '',
      sortOrder: Number(data.sortOrder) || 99,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.saveState((state) => {
      state.products.push(newProduct);
    });

    if (req.user) {
      await db.logActivity({
        userId: req.user.id,
        userName: req.user.name,
        action: 'CREATE',
        resource: 'PRODUCT',
        resourceId: newProduct.id,
        details: `Created product "${newProduct.title}"`,
      });
    }

    res.status(201).json(newProduct);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update product
router.put('/:id', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let updatedProduct: Product | null = null;

    await db.saveState((state) => {
      const idx = state.products.findIndex((p) => p.id === id);
      if (idx !== -1) {
        state.products[idx] = {
          ...state.products[idx],
          ...updates,
          id, // ensure ID cannot be overwritten
          updatedAt: new Date().toISOString(),
        };
        updatedProduct = state.products[idx];
      }
    });

    if (!updatedProduct) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (req.user) {
      await db.logActivity({
        userId: req.user.id,
        userName: req.user.name,
        action: 'UPDATE',
        resource: 'PRODUCT',
        resourceId: id,
        details: `Updated product "${(updatedProduct as Product).title}"`,
      });
    }

    res.json(updatedProduct);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Duplicate product
router.post('/:id/duplicate', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const state = await db.getState();
    const source = state.products.find((p) => p.id === id);

    if (!source) {
      res.status(404).json({ error: 'Source product not found' });
      return;
    }

    const duplicated: Product = {
      ...source,
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: `${source.title} (Copy)`,
      slug: `${source.slug}-copy-${Date.now().toString().slice(-4)}`,
      sku: `${source.sku}-COPY`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.saveState((st) => {
      st.products.push(duplicated);
    });

    if (req.user) {
      await db.logActivity({
        userId: req.user.id,
        userName: req.user.name,
        action: 'DUPLICATE',
        resource: 'PRODUCT',
        resourceId: duplicated.id,
        details: `Duplicated product "${source.title}" -> "${duplicated.title}"`,
      });
    }

    res.status(201).json(duplicated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete product
router.delete('/:id', authenticate, requireRole(['superadmin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let deletedTitle = '';

    await db.saveState((state) => {
      const idx = state.products.findIndex((p) => p.id === id);
      if (idx !== -1) {
        deletedTitle = state.products[idx].title;
        state.products.splice(idx, 1);
      }
    });

    if (!deletedTitle) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (req.user) {
      await db.logActivity({
        userId: req.user.id,
        userName: req.user.name,
        action: 'DELETE',
        resource: 'PRODUCT',
        resourceId: id,
        details: `Deleted product "${deletedTitle}"`,
      });
    }

    res.json({ success: true, message: `Product ${deletedTitle} deleted` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// Public: Submit Customer Review for Product
router.post('/:id/reviews', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, rating, title, review } = req.body;

    if (!name || !rating || !review) {
      res.status(400).json({ error: 'Name, star rating, and review text are required.' });
      return;
    }

    let updatedProduct: any = null;
    const newReview = {
      id: 'rev_' + Date.now().toString(36),
      name: name.trim(),
      title: title ? title.trim() : undefined,
      rating: Math.min(5, Math.max(1, Number(rating))),
      review: review.trim(),
      verified: true,
      createdAt: new Date().toISOString(),
    };

    await db.saveState((state) => {
      const p = state.products.find((prod) => prod.id === id || prod.slug === id);
      if (p) {
        if (!p.reviews) p.reviews = [];
        p.reviews.unshift(newReview);
        p.reviewCount = p.reviews.length;
        const totalStars = p.reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
        p.averageRating = Math.round((totalStars / p.reviews.length) * 10) / 10;
        updatedProduct = p;
      }
    });

    if (!updatedProduct) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.status(201).json({
      success: true,
      review: newReview,
      averageRating: updatedProduct.averageRating,
      reviewCount: updatedProduct.reviewCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;