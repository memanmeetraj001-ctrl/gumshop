import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Product } from '../../types';
import { ProductCard } from '../../components/storefront/ProductCard';
import { Search } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getProducts({ search: query })
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="min-h-screen bg-[#0A0C0F] py-12 text-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-2xl sm:text-4xl font-black text-white uppercase font-heading">
            Search Results for "{query}"
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">
            Found {products.length} matching products
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-[#14171F] rounded-2xl border border-white/10">
            <Search className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white">No products found matching your search.</h2>
            <p className="text-xs text-gray-400 mt-1">Try checking your spelling or searching for broader terms like "swivel" or "foam".</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
