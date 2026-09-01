import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Collection, Category, Product } from '../../types';
import { ProductCard } from '../../components/storefront/ProductCard';
import { Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export const CollectionPage: React.FC = () => {
  const { slug = 'all' } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getCollectionBySlug(slug),
      api.getCategories(),
    ])
      .then(([colRes, catRes]) => {
        setCollection(colRes.collection);
        setProducts(colRes.products);
        setCategories(catRes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  let filtered = products;
  if (selectedCategory !== 'all') {
    filtered = filtered.filter((p) => p.categoryId === selectedCategory || p.categoryId.includes(selectedCategory));
  }

  // Sorting
  if (sortBy === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'bestseller') {
    filtered.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));
  }

  return (
    <div className="min-h-screen bg-[#0A0C0F] py-12 text-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 p-8 sm:p-14 mb-12 bg-gradient-to-r from-[#14171F] to-[#0F1115]">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-5xl font-black text-white uppercase font-heading">
              {collection?.title || 'Shop All Essentials'}
            </h1>
            <p className="text-sm sm:text-base text-gray-300 mt-3 leading-relaxed">
              {collection?.description || 'Browse curated wireless audio, mechanical keyboards, front-pocket leather wallets, and hydration gear.'}
            </p>
          </div>
        </div>

        {/* Filter Pills & Sort Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors ${
                selectedCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-[#14171F] text-gray-300 hover:bg-white/10'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors ${
                  selectedCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-[#14171F] text-gray-300 hover:bg-white/10'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#14171F] border border-white/10 text-xs font-bold text-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="featured">Featured First</option>
              <option value="bestseller">Best Sellers</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="text-center py-24 text-gray-500">
            <p className="text-lg font-bold text-white">No products found in this category</p>
            <p className="text-xs mt-1">Try selecting another category pill or view All Products.</p>
          </div>
        )}
      </div>
    </div>
  );
};
