import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Product, Collection, Category, BlogPost } from '../../types';
import { Search, X, ArrowRight, Tag, BookOpen, Layers } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      Promise.all([
        api.getProducts(),
        api.getCollections(),
        api.getCategories(),
        api.getBlogPosts(),
      ]).then(([p, col, cat, b]) => {
        setProducts(p);
        setCollections(col);
        setCategories(cat);
        setBlogPosts(b);
      }).catch(() => {});
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : document.querySelector<HTMLButtonElement>('[aria-label="Search"]')?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const filteredProducts = q ? products.filter((p) => p.title.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q))).slice(0, 4) : [];
  const filteredCollections = q ? collections.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)).slice(0, 3) : [];
  const filteredCategories = q ? categories.filter((cat) => cat.name.toLowerCase().includes(q)).slice(0, 3) : [];
  const filteredPosts = q ? blogPosts.filter((b) => b.title.toLowerCase().includes(q) || b.excerpt.toLowerCase().includes(q)).slice(0, 2) : [];

  const hasResults = filteredProducts.length > 0 || filteredCollections.length > 0 || filteredCategories.length > 0 || filteredPosts.length > 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q) {
      api.trackEvent({ eventType: 'search', metadata: { query: q } }).catch(() => {});
      onClose();
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#14171F] border border-white/15 rounded-2xl shadow-2xl overflow-hidden text-gray-200">
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center px-6 py-4 border-b border-white/10">
          <Search className="w-6 h-6 text-gray-400 mr-4 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search headphones, keyboards, leather wallets, bottles, guides..."
            className="w-full bg-transparent text-lg text-white placeholder-gray-500 focus:outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-white mr-2">
              <X className="w-5 h-5" />
            </button>
          )}
          <button type="button" onClick={onClose} className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-2.5 py-1 rounded">
            ESC
          </button>
        </form>

        {/* Results Container */}
        <div className="max-h-[65vh] overflow-y-auto p-6 space-y-6">
          {q && !hasResults && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-base font-semibold">No results found for "{query}"</p>
              <p className="text-sm mt-1 text-gray-500">Try searching for "headphones", "keyboard", "wallet", or "bottle".</p>
            </div>
          )}

          {/* Products Result */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Products ({filteredProducts.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProducts.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group"
                  >
                    <img src={p.thumbnail || p.images[0]} alt={p.title} className="w-14 h-14 object-cover rounded-lg bg-black/40 shrink-0" />
                    <div className="overflow-hidden">
                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 truncate transition-colors">
                        {p.title}
                      </h4>
                      <p className="text-xs text-indigo-400 font-extrabold mt-1">{formatPrice(p.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Search Chips */}
          {!q && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
                Popular Searches
              </span>
              <div className="flex flex-wrap gap-2">
                {['Wireless Headphones', 'Mechanical Keyboard', 'Leather Wallet', 'Insulated Bottle'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
