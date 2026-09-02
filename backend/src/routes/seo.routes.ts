import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

router.get('/sitemap.xml', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const baseUrl = state.siteSettings?.canonicalUrl || 'https://gumshop.online';

    const urls = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/about`, priority: '0.8', changefreq: 'monthly' },
      { loc: `${baseUrl}/contact`, priority: '0.8', changefreq: 'monthly' },
      { loc: `${baseUrl}/privacy`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${baseUrl}/terms`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${baseUrl}/cookies`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${baseUrl}/store/demo`, priority: '0.9', changefreq: 'daily' },
    ];

    // Add published multi-tenant stores
    (state.tenants || []).forEach((t) => {
      if (t.slug) {
        urls.push({ loc: `${baseUrl}/store/${t.slug}`, priority: '0.9', changefreq: 'daily' });
      }
    });

    // Add published products
    (state.products || []).forEach((p) => {
      if (p.status === 'published' && p.slug) {
        urls.push({ loc: `${baseUrl}/products/${p.slug}`, priority: '0.8', changefreq: 'weekly' });
      }
    });

    // Add collections
    (state.collections || []).forEach((c) => {
      if (c.slug) {
        urls.push({ loc: `${baseUrl}/collections/${c.slug}`, priority: '0.7', changefreq: 'weekly' });
      }
    });

    const entries = urls
      .map(
        (u) =>
          `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err: any) {
    res.status(500).send('Error generating sitemap');
  }
});

router.get('/robots.txt', async (req: Request, res: Response): Promise<void> => {
  const state = await db.getState();
  const baseUrl = state.siteSettings?.canonicalUrl || 'https://gumshop.online';
  const txt = `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
  res.header('Content-Type', 'text/plain');
  res.send(txt);
});

export default router;