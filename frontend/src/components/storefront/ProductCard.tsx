import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { formatPrice } from '../../utils/formatters';
import { ShoppingBag, ExternalLink, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem, checkoutGumroad } = useCart();
  const { currency } = useTheme();

  const discountPercent = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;

  const rating = product.averageRating || 4.9;
  const reviews = product.reviewCount || (product.reviews ? product.reviews.length : 14);

  return (
    <div className="group relative bg-[#14171F] border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-950/20 flex flex-col justify-between">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
        {product.bestseller && (
          <span className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-md shadow-md">
            Best Seller
          </span>
        )}
        {product.sale && discountPercent && (
          <span className="px-2.5 py-1 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider rounded-md shadow-md">
            Save {discountPercent}%
          </span>
        )}
        {product.newProduct && (
          <span className="px-2.5 py-1 bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider rounded-md shadow-md">
            New
          </span>
        )}
      </div>

      {/* Product Image */}
      <Link to={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden bg-black/40">
        <img
          src={product.thumbnail || product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {product.images[1] && (
          <img
            src={product.images[1]}
            alt={product.title}
            className="w-full h-full object-cover object-center absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            loading="lazy"
          />
        )}
      </Link>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1 text-amber-400 mb-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-[11px] text-gray-400 ml-1 font-bold">{rating}</span>
            <span className="text-[11px] text-gray-500">({reviews})</span>
          </div>

          <Link to={`/products/${product.slug}`} className="block">
            <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
              {product.title}
            </h3>
          </Link>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Pricing & Actions */}
        <div className="mt-4 pt-3 border-t border-white/5 space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-white">{formatPrice(product.price, currency)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs line-through text-gray-500 font-semibold">
                {formatPrice(product.compareAtPrice, currency)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addItem(product, 1)}
              className="py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </button>

            <button
              onClick={() => checkoutGumroad(product)}
              className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-900/30"
            >
              <span>Buy Now</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
