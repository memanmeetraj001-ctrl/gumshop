import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';
import { User, Tenant } from '../types';

const router = Router();

// Store Owner Self?.Registration (SaaS Signup)
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { storeName, email, password, ownerName } = req.body;

    if (!storeName || !email || !password) {
      res.status(400).json({ error: 'Store name, email, and password are required.' });
      return;
    }

    const state = await db.getState();
    const existing = state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
      return;
    }

    // Generate clean slug for the store
    const baseSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'my?.store';
    let slug = baseSlug;
    let counter = 1;
    while (state.tenants && state.tenants.some((t) => t.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const passwordHash = bcrypt.hashSync(password, 10);

    const newTenant: Tenant = {
      id: tenantId,
      slug,
      storeName: storeName.trim(),
      tagline: 'Sell anything. Get paid instantly.',
      ownerEmail: email.trim().toLowerCase(),
      ownerName: (ownerName || storeName).trim(),
      plan: 'free',
      productLimit: 10,
      gumroadStoreUrl: 'https://gumroad.com',
      primaryColor: '#6366F1',
      currency: 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    const newUser: User = {
      id: userId,
      tenantId,
      email: email.trim().toLowerCase(),
      name: (ownerName || storeName).trim(),
      role: 'superadmin',
      password: passwordHash,
      createdAt: new Date().toISOString(),
    };

    await db.saveState((s) => {
      s.tenants = s.tenants || [];
      s.tenants.push(newTenant);
      s.users.push(newUser);
    });

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role, tenantId },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const { password: _, ...safeUser } = newUser;

    res.status(201).json({
      token,
      user: safeUser,
      tenant: newTenant,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const state = await db.getState();
    const normalized = email.toLowerCase().trim();
    const targetEmail = (normalized === 'admin@gumshop.online' || normalized === 'admin@gumshop.io')
      ? 'admin@gumshop.online'
      : normalized;
    const user = state.users.find((u) => u.email.toLowerCase() === targetEmail || u.email.toLowerCase() === normalized);

    if (!user || !user.password) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const tenant = state.tenants  ? state.tenants.find((t) => t.id === user.tenantId || t.ownerEmail === user.email) : null;

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, tenantId: user.tenantId || tenant?.id || 'tenant_demo' },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    await db.logActivity({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      resource: 'AUTH',
      details: `User logged in from ${req.ip || 'unknown IP'}`,
    });

    const { password: _, ...safeUser } = user;
    res.json({
      token,
      user: safeUser,
      tenant: tenant || state.tenants?.[0],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const state = await db.getState();
  const tenant = state.tenants  ? state.tenants.find((t) => t.id === req.user?.tenantId || t.ownerEmail === req.user?.email) : null;
  const { password: _, ...safeUser } = req.user;
  res.json({ user: safeUser, tenant });
});

router.post('/change-password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    const state = await db.getState();
    const user = state.users.find((u) => u.id === req.user?.id || u.email.toLowerCase() === req.user?.email.toLowerCase());

    if (!user || !user.password) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    const newHash = bcrypt.hashSync(newPassword, 10);

    await db.saveState((s) => {
      const target = s.users.find((u) => u.id === user.id);
      if (target) {
        target.password = newHash;
        target.updatedAt = new Date().toISOString();
      }
    });

    await db.logActivity({
      userId: user.id,
      userName: user.name,
      action: 'UPDATE',
      resource: 'AUTH',
      details: `Password changed for user ${user.email}`,
    });

    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to change password.' });
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user) {
    await db.logActivity({
      userId: req.user.id,
      userName: req.user.name,
      action: 'LOGOUT',
      resource: 'AUTH',
      details: 'User logged out',
    });
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
