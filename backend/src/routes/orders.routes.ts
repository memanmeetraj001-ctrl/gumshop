import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Order } from '../types';

const router = Router();

function generateOrderNumber(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `GUM-${num}`;
}

// Public: Track Order Status by Order Number or Email
router.get('/track/:query', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.params;
    if (!query) {
      res.status(400).json({ error: 'Order Number or Email is required.' });
      return;
    }

    const state = await db.getState();
    const cleanQuery = query.trim().toLowerCase();

    const order = (state.orders || []).find(
      (o) =>
        o.orderNumber.toLowerCase() === cleanQuery ||
        o.customerEmail.toLowerCase() === cleanQuery ||
        o.id.toLowerCase() === cleanQuery ||
        (o.trackingNumber && o.trackingNumber.toLowerCase() === cleanQuery)
    );

    if (!order) {
      res.status(404).json({ error: 'No order found matching that number or email address.' });
      return;
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        status: order.status,
        items: order.items,
        totalAmount: order.totalAmount,
        currency: order.currency,
        shippingAddress: {
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          country: order.shippingAddress.country,
        },
        carrier: order.carrier || 'USPS / Global Express',
        trackingNumber: order.trackingNumber || '',
        trackingUrl: order.trackingUrl || '',
        shippedAt: order.shippedAt,
        createdAt: order.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Create order before Gumroad redirect
router.post('/create', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      totalAmount,
      currency,
      productId,
      discountCode,
      discountAmount,
      notes,
    } = req.body;

    if (!customerName || !customerEmail || !shippingAddress || !shippingAddress.addressLine1 || !shippingAddress.city) {
      res.status(400).json({ error: 'Name, email, and shipping address are required.' });
      return;
    }

    const state = await db.getState();
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const orderNumber = generateOrderNumber();

    let gumroadRedirectUrl = 'https://gumroad.com';
    let targetProduct = null;

    if (productId) {
      targetProduct = state.products.find((p) => p.id === productId || p.slug === productId);
    } else if (items && items.length > 0) {
      targetProduct = state.products.find((p) => p.id === items[0].productId || p.slug === items[0].productId);
    }

    if (targetProduct) {
      const defaultBase = process.env.GUMROAD_STORE_URL || 'https://manmeetraj6.gumroad.com';
      let base = targetProduct.gumroadUrl || `${defaultBase.replace(/\/$/, '')}/l/${targetProduct.slug}`;
      const params = new URLSearchParams();
      params.set('wanted', 'true');
      params.set('email', customerEmail.trim());
      if (items && items.length > 0 && items[0].quantity > 1) {
        params.set('quantity', items[0].quantity.toString());
      }
      gumroadRedirectUrl = `${base}${base.includes('?') ? '&' : '?'}${params.toString()}`;
    }

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone ? customerPhone.trim() : undefined,
      shippingAddress: {
        addressLine1: shippingAddress.addressLine1.trim(),
        addressLine2: shippingAddress.addressLine2 ? shippingAddress.addressLine2.trim() : undefined,
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        postalCode: shippingAddress.postalCode.trim(),
        country: shippingAddress.country ? shippingAddress.country.trim() : 'United States',
      },
      items: items || [],
      totalAmount: totalAmount || (targetProduct ? targetProduct.price : 0),
      discountCode: discountCode || undefined,
      discountAmount: discountAmount || 0,
      currency: currency || 'USD',
      status: 'pending_payment',
      gumroadRedirectUrl,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const orders = state.orders || [];
    orders.unshift(newOrder);

    await db.saveState((s) => {
      s.orders = orders;
    });

    await db.logEvent({
      eventType: 'checkout_click',
      productId: targetProduct?.id,
      productTitle: targetProduct?.title,
      metadata: {
        orderId,
        orderNumber,
        customerEmail: newOrder.customerEmail,
        totalAmount: newOrder.totalAmount,
      },
    });

    res.status(201).json({
      success: true,
      order: newOrder,
      redirectUrl: gumroadRedirectUrl,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all orders / leads
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    const state = await db.getState();
    let orders = state.orders || [];

    if (status && typeof status === 'string' && status !== 'all') {
      orders = orders.filter((o) => o.status === status);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q)
      );
    }

    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: 1-Click Abandoned Lead Recovery Trigger
router.post('/:id/recover', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { recoveryDiscount = 10 } = req.body;
    const state = await db.getState();

    const order = (state.orders || []).find((o) => o.id === id || o.orderNumber === id);
    if (!order) {
      res.status(404).json({ error: 'Order lead not found' });
      return;
    }

    order.recoveredAt = new Date().toISOString();
    await db.saveState((s) => {
      const idx = (s.orders || []).findIndex((o) => o.id === order.id);
      if (idx !== -1) s.orders[idx] = order;
    });

    const recoveryLink = `https://gumshop.online/store/demo?discount=RECOVER${recoveryDiscount}&email=${encodeURIComponent(order.customerEmail)}`;

    res.json({
      success: true,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      recoveryLink,
      message: `Recovery email generated with ${recoveryDiscount}% discount code for ${order.customerName}.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update Shipping & Fulfillment
router.patch('/:id/fulfillment', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { carrier, trackingNumber, trackingUrl, status = 'fulfilled' } = req.body;

    let updated: Order | null = null;
    await db.saveState((s) => {
      const target = (s.orders || []).find((o) => o.id === id || o.orderNumber === id);
      if (target) {
        target.carrier = carrier || target.carrier || 'FedEx Express';
        target.trackingNumber = trackingNumber || target.trackingNumber;
        target.trackingUrl = trackingUrl || (trackingNumber ? `https://www.google.com/search?q=${encodeURIComponent(trackingNumber)}` : target.trackingUrl);
        target.status = status;
        target.shippedAt = new Date().toISOString();
        target.updatedAt = new Date().toISOString();
        updated = target;
      }
    });

    if (!updated) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ success: true, order: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update Order Status
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    let updated: Order | null = null;
    await db.saveState((s) => {
      const target = (s.orders || []).find((o) => o.id === id || o.orderNumber === id);
      if (target) {
        if (status) target.status = status;
        if (notes !== undefined) target.notes = notes;
        target.updatedAt = new Date().toISOString();
        updated = target;
      }
    });

    if (!updated) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete Order
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.saveState((s) => {
      s.orders = (s.orders || []).filter((o) => o.id !== id && o.orderNumber !== id);
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
