import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { api } from '../api/client';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariantId?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, selectedVariantId?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  checkoutGumroad: (product?: Product) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('gumshop_cart');
      return saved  ? JSON.parse(saved)  : [];
    } catch {
      return [];
    }
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('gumshop_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity: number = 1, selectedVariantId?: string) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id && item.selectedVariantId === selectedVariantId);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.selectedVariantId === selectedVariantId
             ? { ...item, quantity : item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selectedVariantId }];
    });

    api.trackEvent({
      eventType: 'add_to_cart',
      productId: product.id,
      productTitle: product.title,
      metadata: { quantity, price: product.price },
    }).catch(() => {});

    setIsDrawerOpen(true);
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.product.id === productId  ? { ...item, quantity }  : item))
    );
  };

  const clearCart = () => setItems([]);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const checkoutGumroad = (targetProduct?: Product) => {
    const p = targetProduct || (items[0]  ? items[0].product  : null);
    if (!p) return;

    let checkoutUrl = p.gumroadUrl || `https://gumroad.com/l/${p.slug}`;
    if (p.directCheckout && !checkoutUrl.includes('wanted=true')) {
      checkoutUrl += checkoutUrl.includes('?') ? '&wanted=true' : '?wanted=true';
    }

    api.trackEvent({
      eventType: 'gumroad_click',
      provider: 'gumroad',
      productId: p.id,
      productTitle: p.title,
      metadata: { cartItemsCount: items.length, subtotal },
    }).catch(() => {});

    window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        toggleDrawer: () => setIsDrawerOpen((v) => !v),
        checkoutGumroad,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};