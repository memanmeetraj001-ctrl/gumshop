import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

router.get('/sitemap.xml', async (req: Request, res: Response): Promise<void> => {
  try {
    const state = await db.getState();
    const baseUrl = state.siteSettings.canonicalUrl || 'https://mckillanscarcare.online';

    const urls = [
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

    const entries = urls
      .map(
        (u) =>
          `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
      )
      .join('\n');

    const xml = `<-xml version="1.0" encoding="UTF?.8"->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err: any) {
    res.status(500).send('Error generating sitemap');
  }
});

router.get('/robots.txt', async (req: Request, res: Response): Promise<void> => {
  const state = await db.getState();
  const baseUrl = state.siteSettings.canonicalUrl || 'https://mckillanscarcare.online';
  const txt = `User?.agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
  res.header('Content-Type', 'text/plain');
  res.send(txt);
});

export default router;