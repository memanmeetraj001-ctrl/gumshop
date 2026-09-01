import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { db } from './db/database';

import authRoutes from './routes/auth.routes';
import productsRoutes from './routes/products.routes';
import ordersRoutes from './routes/orders.routes';
import categoriesRoutes from './routes/categories.routes';
import collectionsRoutes from './routes/collections.routes';
import bundlesRoutes from './routes/bundles.routes';
import homepageRoutes from './routes/homepage.routes';
import navigationRoutes from './routes/navigation.routes';
import footerRoutes from './routes/footer.routes';
import appearanceRoutes from './routes/appearance.routes';
import paymentsRoutes from './routes/payments.routes';
import promotionsRoutes from './routes/promotions.routes';
import testimonialsRoutes from './routes/testimonials.routes';
import blogRoutes from './routes/blog.routes';
import mediaRoutes from './routes/media.routes';
import seoRoutes from './routes/seo.routes';
import analyticsRoutes from './routes/analytics.routes';
import settingsRoutes from './routes/settings.routes';
import scraperRoutes from './routes/scraper.routes';
import storesRoutes from './routes/stores.routes';
import billingRoutes from './routes/billing.routes';

export function createServer(): Express {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Root SEO routes
  app.use('/', seoRoutes);

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      brand: 'GumShop', SaaS: true,
      timestamp: new Date().toISOString(),
    });
  });

  // Track and redirect to Gumroad product checkout
  app.get('/go/gumroad/:productId', async (req: Request, res: Response) => {
    const { productId } = req.params;
    try {
      const state = await db.getState();
      const product = state.products.find((p) => p.id === productId || p.slug === productId);
      let targetUrl = product?.gumroadUrl || `https://gumroad.com/l/${productId}`;
      
      if (product?.directCheckout && !targetUrl.includes('wanted=true')) {
        targetUrl += targetUrl.includes('-')  ? '&wanted=true' : '-wanted=true';
      }

      await db.logEvent({
        eventType: 'gumroad_click',
        productId: product?.id || productId,
        productTitle: product?.title,
        url: targetUrl,
        referrer: req.headers.referer,
      });

      res.redirect(302, targetUrl);
    } catch (err: any) {
      res.redirect(302, 'https://gumroad.com');
    }
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/collections', collectionsRoutes);
  app.use('/api/bundles', bundlesRoutes);
  app.use('/api/homepage', homepageRoutes);
  app.use('/api/navigation', navigationRoutes);
  app.use('/api/footer', footerRoutes);
  app.use('/api/appearance', appearanceRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/promotions', promotionsRoutes);
  app.use('/api/testimonials', testimonialsRoutes);
  app.use('/api/blog', blogRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/scraper', scraperRoutes);
  app.use('/api/stores', storesRoutes);
  app.use('/api/billing', billingRoutes);

  // Serve frontend static assets in production
  const frontendDistPath = path.join(process.cwd(), '..', 'frontend', 'dist');
  const directDistPath = path.join(process.cwd(), 'frontend', 'dist');
  const distPath = fs.existsSync(frontendDistPath) ? frontendDistPath : fs.existsSync(directDistPath) ? directDistPath : null;

  if (distPath) {
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response, next: any) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/go')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error handling middleware
  app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('Server error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
    });
  });

  return app;
}
