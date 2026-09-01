import os

def write_file(filename, content):
    path = os.path.join("backend", "src", "routes", filename)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip())
    print(f"Created {filename}")

# 1. products.routes.ts
products_code = '''import { Router, Request, Response } from 'express';
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

    // Filter by status (public storefront only sees published by default)
    if (status) {
      results = results.filter((p) => p.status === status);
    } else if (!req.headers.authorization) {
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
      compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : undefined,
      currency: data.currency || 'USD',
      sku: data.sku || 'WF-SKU-' + Date.now().toString().slice(-4),
      categoryId: data.categoryId || '',
      collectionIds: Array.isArray(data.collectionIds) ? data.collectionIds : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      status: data.status || 'published',
      featured: Boolean(data.featured),
      bestseller: Boolean(data.bestseller),
      newProduct: Boolean(data.newProduct),
      sale: Boolean(data.sale),
      images: Array.isArray(data.images) && data.images.length > 0 ? data.images : ['https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1000&q=80'],
      thumbnail: data.thumbnail || (data.images && data.images[0]) || 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=600&q=80',
      specifications: Array.isArray(data.specifications) ? data.specifications : [],
      faq: Array.isArray(data.faq) ? data.faq : [],
      gumroadUrl: data.gumroadUrl || '',
      buyMeACoffeeUrl: data.buyMeACoffeeUrl || '',
      primaryCheckout: data.primaryCheckout || 'gumroad',
      directCheckout: data.directCheckout !== undefined ? Boolean(data.directCheckout) : true,
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

export default router;
'''
write_file("products.routes.ts", products_code)

# 2. categories.routes.ts
categories_code = '''import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { Category } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const categories = [...state.categories].sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const newCategory: Category = {
      id: data.id || 'cat_' + Date.now().toString(36),
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: data.name,
      description: data.description || '',
      image: data.image || '',
      icon: data.icon || 'Sparkles',
      sortOrder: Number(data.sortOrder) || 99,
      status: data.status || 'active',
    };

    await db.saveState((state) => {
      state.categories.push(newCategory);
    });

    if (req.user) {
      await db.logActivity({
        userId: req.user.id,
        userName: req.user.name,
        action: 'CREATE',
        resource: 'CATEGORY',
        details: `Created category "${newCategory.name}"`,
      });
    }

    res.status(201).json(newCategory);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let updated: Category | null = null;

    await db.saveState((state) => {
      const idx = state.categories.findIndex((c) => c.id === id);
      if (idx !== -1) {
        state.categories[idx] = { ...state.categories[idx], ...req.body, id };
        updated = state.categories[idx];
      }
    });

    if (!updated) {
      res.status(404).json({ error: 'Category not found' });
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
      state.categories = state.categories.filter((c) => c.id !== id);
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
'''
write_file("categories.routes.ts", categories_code)

# 3. collections.routes.ts
collections_code = '''import { Router, Request, Response } from 'express';
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
          description: 'Browse our full catalog of high-performance car wash hardware and accessories.',
          image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=80',
          seoTitle: 'All Car Detailing Hardware & Equipment | WashForge',
          seoDescription: 'Explore the complete line of professional detailing swivel guns, foam cannons, and accessories.',
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
      productIds: Array.isArray(data.productIds) ? data.productIds : [],
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
'''
write_file("collections.routes.ts", collections_code)

# 4. bundles.routes.ts
bundles_code = '''import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { Bundle } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const bundles = [...state.bundles].sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(bundles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const bundle = state.bundles.find((b) => b.slug === req.params.slug || b.id === req.params.slug);
    if (!bundle) {
      res.status(404).json({ error: 'Bundle not found' });
      return;
    }
    const products = state.products.filter((p) => bundle.productIds.includes(p.id));
    res.json({ bundle, products });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const newBundle: Bundle = {
      id: data.id || 'bundle_' + Date.now().toString(36),
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: data.name,
      description: data.description || '',
      image: data.image || '',
      productIds: Array.isArray(data.productIds) ? data.productIds : [],
      price: Number(data.price) || 0,
      compareAtPrice: Number(data.compareAtPrice) || 0,
      badge: data.badge || '',
      ctaText: data.ctaText || 'Buy Bundle on Gumroad',
      gumroadUrl: data.gumroadUrl || '',
      status: data.status || 'published',
      sortOrder: Number(data.sortOrder) || 99,
    };

    await db.saveState((state) => {
      state.bundles.push(newBundle);
    });

    res.status(201).json(newBundle);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let updated: Bundle | null = null;

    await db.saveState((state) => {
      const idx = state.bundles.findIndex((b) => b.id === id);
      if (idx !== -1) {
        state.bundles[idx] = { ...state.bundles[idx], ...req.body, id };
        updated = state.bundles[idx];
      }
    });

    if (!updated) {
      res.status(404).json({ error: 'Bundle not found' });
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
      state.bundles = state.bundles.filter((b) => b.id !== id);
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
'''
write_file("bundles.routes.ts", bundles_code)
# 5. homepage.routes.ts
homepage_code = '''import { Router, Request, Response } from 'express';
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
      enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
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
'''
write_file("homepage.routes.ts", homepage_code)

# 6. navigation.routes.ts
navigation_code = '''import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { NavigationItem } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const items = [...state.navigationItems].sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const newItem: NavigationItem = {
      id: data.id || 'nav_' + Date.now().toString(36),
      label: data.label,
      url: data.url || '/',
      icon: data.icon || '',
      parentId: data.parentId || null,
      openNewTab: Boolean(data.openNewTab),
      visible: data.visible !== undefined ? Boolean(data.visible) : true,
      sortOrder: Number(data.sortOrder) || 99,
      badge: data.badge || '',
    };

    await db.saveState((state) => {
      state.navigationItems.push(newItem);
    });

    res.status(201).json(newItem);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let updated: NavigationItem | null = null;

    await db.saveState((state) => {
      const idx = state.navigationItems.findIndex((n) => n.id === id);
      if (idx !== -1) {
        state.navigationItems[idx] = { ...state.navigationItems[idx], ...req.body, id };
        updated = state.navigationItems[idx];
      }
    });

    if (!updated) {
      res.status(404).json({ error: 'Item not found' });
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
      state.navigationItems = state.navigationItems.filter((n) => n.id !== id && n.parentId !== id);
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
'''
write_file("navigation.routes.ts", navigation_code)

# 7. footer.routes.ts
footer_code = '''import { Router, Request, Response } from 'express';
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
'''
write_file("footer.routes.ts", footer_code)

# 8. appearance.routes.ts
appearance_code = '''import { Router, Request, Response } from 'express';
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
'''
write_file("appearance.routes.ts", appearance_code)

# 9. payments.routes.ts
payments_code = '''import { Router, Request, Response } from 'express';
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
        details: `Updated payment integration settings for ${id}`,
      });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
'''
write_file("payments.routes.ts", payments_code)

# 10. promotions.routes.ts
promotions_code = '''import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { Promotion } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const isAdmin = Boolean(req.headers.authorization);
    let promos = state.promotions;
    if (!isAdmin) {
      promos = promos.filter((p) => p.enabled);
    }
    res.json(promos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireRole(['superadmin', 'marketing', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const newPromo: Promotion = {
      id: data.id || 'promo_' + Date.now().toString(36),
      type: data.type || 'banner',
      title: data.title,
      description: data.description || '',
      ctaText: data.ctaText || '',
      ctaUrl: data.ctaUrl || '',
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
      discountCode: data.discountCode || '',
      settingsJson: data.settingsJson || {},
    };

    await db.saveState((state) => {
      state.promotions.push(newPromo);
    });

    res.status(201).json(newPromo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, requireRole(['superadmin', 'marketing', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let updated: Promotion | null = null;

    await db.saveState((state) => {
      const idx = state.promotions.findIndex((p) => p.id === id);
      if (idx !== -1) {
        state.promotions[idx] = { ...state.promotions[idx], ...req.body, id };
        updated = state.promotions[idx];
      }
    });

    if (!updated) {
      res.status(404).json({ error: 'Promotion not found' });
      return;
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, requireRole(['superadmin', 'marketing']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.saveState((state) => {
      state.promotions = state.promotions.filter((p) => p.id !== id);
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
'''
write_file("promotions.routes.ts", promotions_code)

# 11. testimonials.routes.ts
testimonials_code = '''import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { Testimonial } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const isAdmin = Boolean(req.headers.authorization);
    let testimonials = state.testimonials;
    if (!isAdmin) {
      testimonials = testimonials.filter((t) => t.published);
    }
    testimonials.sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(testimonials);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const newTest: Testimonial = {
      id: data.id || 'test_' + Date.now().toString(36),
      name: data.name,
      title: data.title || '',
      avatar: data.avatar || '',
      rating: Number(data.rating) || 5,
      review: data.review,
      productName: data.productName || '',
      productId: data.productId || '',
      verified: data.verified !== undefined ? Boolean(data.verified) : true,
      published: data.published !== undefined ? Boolean(data.published) : true,
      sortOrder: Number(data.sortOrder) || 99,
    };

    await db.saveState((state) => {
      state.testimonials.push(newTest);
    });

    res.status(201).json(newTest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let updated: Testimonial | null = null;

    await db.saveState((state) => {
      const idx = state.testimonials.findIndex((t) => t.id === id);
      if (idx !== -1) {
        state.testimonials[idx] = { ...state.testimonials[idx], ...req.body, id };
        updated = state.testimonials[idx];
      }
    });

    if (!updated) {
      res.status(404).json({ error: 'Testimonial not found' });
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
      state.testimonials = state.testimonials.filter((t) => t.id !== id);
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
'''
write_file("testimonials.routes.ts", testimonials_code)

# 12. blog.routes.ts
blog_code = '''import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { BlogPost } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const isAdmin = Boolean(req.headers.authorization);
    let posts = state.blogPosts;
    if (!isAdmin) {
      posts = posts.filter((p) => p.status === 'published');
    }
    posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    res.json(posts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const post = state.blogPosts.find((p) => p.slug === req.params.slug || p.id === req.params.slug);
    if (!post) {
      res.status(404).json({ error: 'Blog post not found' });
      return;
    }
    res.json(post);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const newPost: BlogPost = {
      id: data.id || 'post_' + Date.now().toString(36),
      slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: data.title,
      excerpt: data.excerpt || '',
      content: data.content || '',
      featuredImage: data.featuredImage || 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=80',
      author: data.author || (req.user ? req.user.name : 'WashForge Team'),
      authorAvatar: data.authorAvatar || '',
      categories: Array.isArray(data.categories) ? data.categories : ['Car Care Guides'],
      tags: Array.isArray(data.tags) ? data.tags : [],
      readTime: data.readTime || '4 min read',
      status: data.status || 'published',
      publishedAt: data.publishedAt || new Date().toISOString(),
      seoTitle: data.seoTitle || '',
      seoDescription: data.seoDescription || '',
    };

    await db.saveState((state) => {
      state.blogPosts.push(newPost);
    });

    res.status(201).json(newPost);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, requireRole(['superadmin', 'editor']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let updated: BlogPost | null = null;

    await db.saveState((state) => {
      const idx = state.blogPosts.findIndex((p) => p.id === id);
      if (idx !== -1) {
        state.blogPosts[idx] = { ...state.blogPosts[idx], ...req.body, id };
        updated = state.blogPosts[idx];
      }
    });

    if (!updated) {
      res.status(404).json({ error: 'Post not found' });
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
      state.blogPosts = state.blogPosts.filter((p) => p.id !== id);
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
'''
write_file("blog.routes.ts", blog_code)

# 13. media.routes.ts
media_code = '''import { Router, Request, Response } from 'express';
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
      filename: data.filename || 'uploaded-image.jpg',
      url: data.url || 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=80',
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
'''
write_file("media.routes.ts", media_code)

# 14. seo.routes.ts
seo_code = '''import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

router.get('/sitemap.xml', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const baseUrl = state.siteSettings.canonicalUrl || 'https://mckillanscarcare.online';

    let urls = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/collections/all`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/bundles`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${baseUrl}/blog`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${baseUrl}/about`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${baseUrl}/support`, priority: '0.6', changefreq: 'monthly' },
    ];

    state.products.forEach((p) => {
      if (p.status === 'published') {
        urls.push({ loc: `${baseUrl}/products/${p.slug}`, priority: '0.9', changefreq: 'weekly' });
      }
    });

    state.collections.forEach((c) => {
      urls.push({ loc: `${baseUrl}/collections/${c.slug}`, priority: '0.8', changefreq: 'weekly' });
    });

    state.blogPosts.forEach((b) => {
      if (b.status === 'published') {
        urls.push({ loc: `${baseUrl}/blog/${b.slug}`, priority: '0.7', changefreq: 'monthly' });
      }
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err: any) {
    res.status(500).send('Error generating sitemap');
  }
});

router.get('/robots.txt', async (req: Request, res: Response): Promise<void> => {
  const state = await db.getState();
  const baseUrl = state.siteSettings.canonicalUrl || 'https://mckillanscarcare.online';
  const txt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
  res.header('Content-Type', 'text/plain');
  res.send(txt);
});

export default router;
'''
write_file("seo.routes.ts", seo_code)

# 15. analytics.routes.ts
analytics_code = '''import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Public: Track click/view event (Gumroad checkout, BMAC support, product view)
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
      userAgent: req.headers['user-agent'],
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
    const bmacClicks = events.filter((e) => e.eventType === 'bmac_click' || (e.eventType === 'checkout_click' && e.provider === 'buymeacoffee')).length;
    const totalCheckoutClicks = gumroadClicks + bmacClicks;
    const productViews = events.filter((e) => e.eventType === 'product_view').length;
    const newsletterSignups = events.filter((e) => e.eventType === 'newsletter_signup').length;

    // Top products by clicks/views
    const productCounts: Record<string, { title: string; clicks: number; views: number }> = {};
    events.forEach((e) => {
      if (e.productId) {
        if (!productCounts[e.productId]) {
          const p = state.products.find((prod) => prod.id === e.productId);
          productCounts[e.productId] = {
            title: p ? p.title : (e.productTitle || e.productId),
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
    const sevenDaysTimeline: Array<{ date: string; gumroadClicks: number; bmacClicks: number; views: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const dayEvents = events.filter((e) => e.timestamp.startsWith(dateStr));
      sevenDaysTimeline.push({
        date: dateStr,
        gumroadClicks: dayEvents.filter((e) => e.eventType === 'gumroad_click' || e.provider === 'gumroad').length,
        bmacClicks: dayEvents.filter((e) => e.eventType === 'bmac_click' || e.provider === 'buymeacoffee').length,
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
        bmacClicks,
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
'''
write_file("analytics.routes.ts", analytics_code)

# 16. settings.routes.ts
settings_code = '''import { Router, Request, Response } from 'express';
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
'''
write_file("settings.routes.ts", settings_code)
