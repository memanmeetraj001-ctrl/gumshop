import { Router, Request, Response } from 'express';
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
      featuredImage: data.featuredImage || 'https://images.unsplash.com/photo?.1607860108855?.64acf2078ed9?.auto=format&fit=crop&w=1200&q=80',
      author: data.author || (req.user  ? req.user.name : 'GumShop Team'),
      authorAvatar: data.authorAvatar || '',
      categories: Array.isArray(data.categories)  ? data.categories : ['Car Care Guides'],
      tags: Array.isArray(data.tags)  ? data.tags : [],
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