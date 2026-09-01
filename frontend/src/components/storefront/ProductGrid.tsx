import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HomepageSection, Product } from '../../types';
import { api } from '../../api/client';
import { ProductCard } from './ProductCard';
import { ArrowRight } from 'lucide-react';

interface ProductGridProps {
  section: HomepageSection;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ section }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const colSlug = section.settingsJson?.collectionSlug || 'best-sellers';
    const limit = section.settingsJson?.limit || 4;

    api.getProducts({ collection: colSlug })
      .then((res) => {
        setProducts(res.slice(0, limit));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [section]);

  return (
    <section className="py-16 sm:py-24 bg-[#0A0C0F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            {section.subtitle && (
              <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1.5">
                {section.subtitle}
              </p>
            )}
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase font-heading">
              {section.title}
            </h2>
            {section.content && (
              <p className="text-sm text-gray-400 mt-2 max-w-xl">
                {section.content}
              </p>
            )}
          </div>

          {section.buttonText && (
            <Link
              to={section.buttonUrl || '/collections/all'}
              className="inline-flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider group"
            >
              <span>{section.buttonText}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
