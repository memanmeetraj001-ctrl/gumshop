import React from 'react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/formatters';
import { ShoppingBag, ExternalLink } from 'lucide-react';

interface StickyBuyBarProps {
  product: Product;
  onBuyNow?: () => void;
}

export const StickyBuyBar: React.FC<StickyBuyBarProps> = ({ product, onBuyNow }) => {
  const { addItem, checkoutGumroad } = useCart();

  const handleBuyNow = () => {
    if (onBuyNow) {
      onBuyNow();
    } else {
      checkoutGumroad(product);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#14171F]/95 backdrop-blur-md border-t border-white/15 py-3 px-4 sm:hidden flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom duration-200">
      <div className="flex-1 mr-3 min-w-0">
        <p className="text-xs font-bold text-white truncate">{product.title}</p>
        <span className="text-sm font-extrabold text-red-400">{formatPrice(product.price)}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => addItem(product, 1)}
          className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl"
          aria-label="Add to cart"
        >
          <ShoppingBag className="w-4 h-4" />
        </button>

        <button
          onClick={handleBuyNow}
          className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-lg"
        >
          <span>Buy Now</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
