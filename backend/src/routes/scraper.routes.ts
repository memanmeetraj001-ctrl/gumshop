import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Product } from '../types';

const router = Router();

// Helper to normalize and get base origin URL
function getBaseUrl(rawUrl: string): { origin: string; clean: string; isSingleProduct: boolean } {
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  url = url.replace(/\/+$/, '');

  try {
    const parsed = new URL(url);
    const isSingleProduct = parsed.pathname.includes('/products/') || parsed.pathname.includes('/product/');
    return { origin: parsed.origin, clean: url, isSingleProduct };
  } catch {
    return { origin: url, clean: url, isSingleProduct: false };
  }
}

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// 1. Detect Platform from URL
router.post('/detect', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: 'URL is required.' });
      return;
    }

    const { origin, clean, isSingleProduct } = getBaseUrl(url);

    // 1A. If single Shopify product URL, check .json
    if (isSingleProduct) {
      try {
        const singleJsonUrl = clean.replace(/\?.*$/, '') + '.json';
        const singleRes = await fetch(singleJsonUrl, { headers: DEFAULT_HEADERS, signal: AbortSignal.timeout(5000) });
        if (singleRes.ok) {
          const data = await singleRes.json();
          if (data && data.product) {
            res.json({
              platform: 'shopify',
              detected: true,
              message: 'Shopify Single Product detected! Ready for 1-click import.',
              baseUrl: clean,
            });
            return;
          }
        }
      } catch {}
    }

    // 1B. Try checking Shopify catalog (/products.json) on origin
    try {
      const shopifyRes = await fetch(`${origin}/products.json?limit=1`, {
        headers: DEFAULT_HEADERS,
        signal: AbortSignal.timeout(5000),
      });
      if (shopifyRes.ok) {
        const data = await shopifyRes.json();
        if (data && Array.isArray(data.products)) {
          res.json({
            platform: 'shopify',
            detected: true,
            message: 'Shopify Store detected! Full product catalog available via 1-click import.',
            baseUrl: origin,
          });
          return;
        }
      }
    } catch {}

    // 1C. Try checking WooCommerce endpoint
    try {
      const wcRes = await fetch(`${origin}/wp-json/wc/v3`, { headers: DEFAULT_HEADERS, signal: AbortSignal.timeout(4000) });
      if (wcRes.ok || wcRes.status === 401) {
        res.json({
          platform: 'woocommerce',
          detected: true,
          message: 'WooCommerce store detected! (API keys may be required for full access, or generic HTML scrape will be used).',
          baseUrl: origin,
        });
        return;
      }
    } catch {}

    // 1D. Fallback to generic HTML
    res.json({
      platform: 'html',
      detected: true,
      message: 'Web page detected. Visual and metadata HTML extractor will be used.',
      baseUrl: clean,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Detection failed' });
  }
});

// 2. Scrape Shopify Store or Single Product
router.post('/shopify', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { url, limit = 50 } = req.body;
    if (!url) {
      res.status(400).json({ error: 'Shopify Store or Product URL is required.' });
      return;
    }

    const { origin, clean, isSingleProduct } = getBaseUrl(url);

    // If a single product URL was provided, try fetching that single item first
    if (isSingleProduct) {
      try {
        const singleJsonUrl = clean.replace(/\?.*$/, '') + '.json';
        const singleRes = await fetch(singleJsonUrl, { headers: DEFAULT_HEADERS, signal: AbortSignal.timeout(6000) });
        if (singleRes.ok) {
          const singleData = await singleRes.json();
          if (singleData && singleData.product) {
            const p = singleData.product;
            const firstVariant = p.variants?.[0] || {};
            const rawPrice = parseFloat(firstVariant.price) || 0;
            const compareAtPrice = firstVariant.compare_at_price ? parseFloat(firstVariant.compare_at_price) : (rawPrice > 0 ? rawPrice * 2 : undefined);
            const images = (p.images || []).map((img: any) => typeof img === 'string' ? img : img.src);

            const singleProduct = {
              title: p.title || 'Untitled Product',
              slug: p.handle || p.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              shortDescription: (p.body_html || '').replace(/<[^>]*>/gm, '').slice(0, 180) + '...',
              description: p.body_html || '',
              price: rawPrice,
              compareAtPrice,
              sku: firstVariant.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
              tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? p.tags.split(',').map((t: string) => t.trim()) : []),
              images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
              thumbnail: images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
              selected: true,
            };

            res.json({
              success: true,
              count: 1,
              platform: 'shopify',
              products: [singleProduct],
            });
            return;
          }
        }
      } catch {}
    }

    // Otherwise fetch catalog from origin /products.json
    const apiUrl = `${origin}/products.json?limit=${limit}`;
    const response = await fetch(apiUrl, { headers: DEFAULT_HEADERS, signal: AbortSignal.timeout(10000) });

    if (!response.ok) {
      res.status(400).json({ error: `Failed to access Shopify products (HTTP ${response.status}). Ensure the store URL is public.` });
      return;
    }

    const data = await response.json();
    const rawProducts = data.products || [];

    const products = rawProducts.map((p: any) => {
      const firstVariant = p.variants?.[0] || {};
      const rawPrice = parseFloat(firstVariant.price) || 0;
      const compareAtPrice = firstVariant.compare_at_price ? parseFloat(firstVariant.compare_at_price) : (rawPrice > 0 ? rawPrice * 2 : undefined);
      const images = (p.images || []).map((img: any) => typeof img === 'string' ? img : img.src);

      return {
        title: p.title || 'Untitled Product',
        slug: p.handle || p.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        shortDescription: (p.body_html || '').replace(/<[^>]*>/gm, '').slice(0, 180) + '...',
        description: p.body_html || '',
        price: rawPrice,
        compareAtPrice,
        sku: firstVariant.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? p.tags.split(',').map((t: string) => t.trim()) : []),
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
        thumbnail: images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
        selected: true,
      };
    });

    res.json({
      success: true,
      count: products.length,
      platform: 'shopify',
      products,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to scrape Shopify store.' });
  }
});

// 3. Scrape WooCommerce Store
router.post('/woocommerce', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { url, consumerKey, consumerSecret, limit = 50 } = req.body;
    if (!url) {
      res.status(400).json({ error: 'WooCommerce Store URL is required.' });
      return;
    }

    const { origin } = getBaseUrl(url);
    const apiUrl = `${origin}/wp-json/wc/v3/products?per_page=${limit}`;
    const headers: Record<string, string> = { ...DEFAULT_HEADERS };

    if (consumerKey && consumerSecret) {
      const authHeader = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${authHeader}`;
    }

    const response = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      res.status(400).json({ error: `WooCommerce API returned HTTP ${response.status}. Please check API keys or use HTML scraper.` });
      return;
    }

    const rawProducts = await response.json();
    if (!Array.isArray(rawProducts)) {
      res.status(400).json({ error: 'Unexpected response from WooCommerce API.' });
      return;
    }

    const products = rawProducts.map((p: any) => {
      const price = parseFloat(p.price || p.regular_price) || 0;
      const compareAtPrice = p.regular_price && p.sale_price ? parseFloat(p.regular_price) : (price > 0 ? price * 2 : undefined);
      const images = (p.images || []).map((img: any) => img.src);

      return {
        title: p.name || 'Untitled Product',
        slug: p.slug || p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        shortDescription: (p.short_description || p.description || '').replace(/<[^>]*>/gm, '').slice(0, 180),
        description: p.description || '',
        price,
        compareAtPrice,
        sku: p.sku || `WC-${Math.floor(1000 + Math.random() * 9000)}`,
        tags: (p.tags || []).map((t: any) => t.name),
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
        thumbnail: images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
        selected: true,
      };
    });

    res.json({
      success: true,
      count: products.length,
      platform: 'woocommerce',
      products,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to scrape WooCommerce.' });
  }
});

// 4. Scrape Generic HTML Page
router.post('/html', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: 'Web page URL is required.' });
      return;
    }

    const { clean } = getBaseUrl(url);
    const response = await fetch(clean, {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      res.status(400).json({ error: `Could not fetch page (HTTP ${response.status}).` });
      return;
    }

    const html = await response.text();

    // Heuristics: extract JSON-LD, OpenGraph, Title, Price, Image
    let title = '';
    let price = 0;
    let description = '';
    let image = '';

    // Check JSON-LD
    const jsonLdMatch = html.match(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch && jsonLdMatch[1]) {
      try {
        const ld = JSON.parse(jsonLdMatch[1]);
        const productObj = Array.isArray(ld) ? ld.find((x) => x['@type'] === 'Product') : (ld['@type'] === 'Product' ? ld : null);
        if (productObj) {
          title = productObj.name || '';
          description = productObj.description || '';
          image = Array.isArray(productObj.image) ? productObj.image[0] : (productObj.image || '');
          if (productObj.offers) {
            const offer = Array.isArray(productObj.offers) ? productObj.offers[0] : productObj.offers;
            price = parseFloat(offer.price || offer.lowPrice) || 0;
          }
        }
      } catch {}
    }

    // Fallback: OpenGraph tags
    if (!title) {
      const ogTitle = html.match(/<meta property=["']og:title["'] content=["']([^"']+)["']/i);
      if (ogTitle) title = ogTitle[1];
    }
    if (!title) {
      const docTitle = html.match(/<title>([^<]+)<\/title>/i);
      if (docTitle) title = docTitle[1].replace(/[-|?].*$/, '').trim();
    }
    if (!image) {
      const ogImg = html.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i);
      if (ogImg) image = ogImg[1];
    }
    if (!description) {
      const ogDesc = html.match(/<meta property=["']og:description["'] content=["']([^"']+)["']/i);
      if (ogDesc) description = ogDesc[1];
    }
    if (!price) {
      const priceMatch = html.match(/\$\s*([0-9]+(?:\.[0-9]{2})?)/);
      if (priceMatch) price = parseFloat(priceMatch[1]) || 0;
    }

    const fallbackImg = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';
    const finalImage = image && image.startsWith('http') ? image : fallbackImg;

    const singleProduct = {
      title: title || 'Scraped Product',
      slug: (title || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      shortDescription: description ? description.slice(0, 180) : 'Extracted from web page.',
      description: description ? `<p>${description}</p>` : '<p>Imported product.</p>',
      price: price || 29.99,
      compareAtPrice: price ? price * 2 : 59.99,
      sku: `WEB-${Math.floor(1000 + Math.random() * 9000)}`,
      tags: ['imported'],
      images: [finalImage],
      thumbnail: finalImage,
      selected: true,
    };

    res.json({
      success: true,
      count: 1,
      platform: 'html',
      products: [singleProduct],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to extract HTML.' });
  }
});

// 5. Bulk Import Scraped Products into Store (Enforcing Product Limit)
router.post('/import', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { products = [], categoryId, discountPercent = 0, status = 'published' } = req.body;
    const tenantId = req.user?.tenantId || 'tenant_demo';

    if (!Array.isArray(products) || products.length === 0) {
      res.status(400).json({ error: 'No products provided for import.' });
      return;
    }

    const state = await db.getState();
    const tenant = (state.tenants || []).find((t) => t.id === tenantId);
    const productLimit = tenant?.productLimit || 10;
    const currentProducts = state.products.filter((p) => p.tenantId === tenantId || (!p.tenantId && tenantId === 'tenant_demo'));

    const availableSlots = Math.max(0, productLimit - currentProducts.length);
    if (availableSlots === 0) {
      res.status(400).json({
        error: `Inventory limit reached! Your ${tenant?.plan || 'Free'} plan allows up to ${productLimit} products. Please upgrade to Pro for 50 slots.`,
      });
      return;
    }

    const productsToImport = products.slice(0, availableSlots);
    const skippedCount = Math.max(0, products.length - availableSlots);

    const newProductObjects: Product[] = productsToImport.map((p, idx) => {
      const originalPrice = typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0;
      let finalPrice = originalPrice;
      let compareAtPrice = p.compareAtPrice ? parseFloat(p.compareAtPrice) : (originalPrice > 0 ? originalPrice * 2 : 0);

      if (discountPercent > 0 && originalPrice > 0) {
        compareAtPrice = originalPrice;
        finalPrice = Math.round(originalPrice * (1 - discountPercent / 100) * 100) / 100;
      }

      return {
        id: 'prod_' + Date.now().toString(36) + '_' + idx,
        tenantId,
        slug: (p.slug || p.title || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(100 + Math.random() * 900),
        title: p.title || 'Untitled Product',
        shortDescription: p.shortDescription || '',
        description: p.description || `<p>${p.title || 'Product details'}</p>`,
        price: finalPrice,
        compareAtPrice: compareAtPrice || undefined,
        currency: 'USD',
        sku: p.sku || `IMP-${Math.floor(1000 + Math.random() * 9000)}`,
        categoryId: categoryId || state.categories[0]?.id || 'cat_all',
        collectionIds: ['col_all'],
        tags: p.tags || ['imported'],
        status: status || 'published',
        featured: false,
        bestseller: false,
        newProduct: true,
        sale: discountPercent > 0,
        images: p.images && p.images.length > 0 ? p.images : [p.thumbnail || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
        thumbnail: p.thumbnail || p.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
        specifications: [],
        faq: [],
        primaryCheckout: 'gumroad',
        directCheckout: true,
        buttonText: 'Buy Now - Free Shipping',
        sortOrder: currentProducts.length + idx + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    await db.saveState((s) => {
      s.products.push(...newProductObjects);
    });

    await db.logActivity({
      userId: req.user?.id || 'admin',
      userName: req.user?.email || 'Admin',
      action: 'SCRAPER_IMPORT',
      resource: 'PRODUCTS',
      details: `Imported ${newProductObjects.length} products via 1-Click Importer.`,
    });

    res.json({
      success: true,
      importedCount: newProductObjects.length,
      skippedCount,
      limit: productLimit,
      totalNow: currentProducts.length + newProductObjects.length,
      products: newProductObjects,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Import failed.' });
  }
});

export default router;
