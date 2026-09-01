import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Product, Category, Collection } from '../../types';
import { Save, ArrowLeft, Check } from 'lucide-react';

export const AdminProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new' || !id;

  const [product, setProduct] = useState<Partial<Product>>({
    title: '',
    slug: '',
    shortDescription: '',
    description: '',
    price: 49.99,
    compareAtPrice: 59.99,
    currency: 'USD',
    sku: 'WF-SKU-' + Math.floor(Math.random() * 9000 + 1000),
    categoryId: 'cat_guns_wands',
    collectionIds: ['col_best_sellers'],
    tags: ['car care', 'hardware'],
    status: 'published',
    featured: true,
    bestseller: false,
    newProduct: true,
    sale: false,
    images: ['https://images.unsplash.com/photo-1607860108855-64acf2078ed9-auto=format&fit=crop&w=1000&q=80'],
    thumbnail: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9-auto=format&fit=crop&w=600&q=80',
    specifications: [
      { key: 'Max Pressure', value: '5,000 PSI' },
      { key: 'Inlet Fitting', value: '3/8" Stainless QC' },
    ],
    faq: [
      { question: 'Does this include a warranty?', answer: 'Yes, every product includes a 2-year manufacturer guarantee.' },
    ],
    gumroadUrl: 'https://gumroad.com/l/demo-product',
    primaryCheckout: 'gumroad',
    directCheckout: true,
    buttonText: 'Buy on Gumroad',
    seoTitle: '',
    seoDescription: '',
    sortOrder: 1,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    api.getCategories().then(setCategories);
    if (!isNew && id) {
      api.getProductBySlug(id).then(setProduct).catch(() => {});
    }
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isNew) {
        await api.createProduct(product);
      } else if (id) {
        await api.updateProduct(id, product);
      }
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        navigate('/admin/products');
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/admin/products')}
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </button>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl">
              <Check className="w-4 h-4" /> Saved Successfully
            </span>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Product</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#14171F] border border-white/10 rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white uppercase font-heading">General Information</h3>

            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Product Title</label>
              <input
                required
                value={product.title || ''}
                onChange={(e) => setProduct({ ...product, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 font-bold uppercase mb-1">Slug</label>
                <input
                  value={product.slug || ''}
                  onChange={(e) => setProduct({ ...product, slug: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 font-bold uppercase mb-1">SKU</label>
                <input
                  value={product.sku || ''}
                  onChange={(e) => setProduct({ ...product, sku: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Short Description</label>
              <textarea
                rows={2}
                value={product.shortDescription || ''}
                onChange={(e) => setProduct({ ...product, shortDescription: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Full Description (Markdown)</label>
              <textarea
                rows={6}
                value={product.description || ''}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono"
              />
            </div>
          </div>

          <div className="bg-[#14171F] border border-white/10 rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white uppercase font-heading">Pricing & External Checkout (Gumroad)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 font-bold uppercase mb-1">Price ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={product.price || 0}
                  onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-gray-400 font-bold uppercase mb-1">Compare At Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={product.compareAtPrice || ''}
                  onChange={(e) => setProduct({ ...product, compareAtPrice: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Gumroad Product URL</label>
              <input
                value={product.gumroadUrl || ''}
                onChange={(e) => setProduct({ ...product, gumroadUrl: e.target.value })}
                placeholder="https://gumroad.com/l/product-name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 font-bold uppercase mb-1">CTA Button Label</label>
                <input
                  value={product.buttonText || ''}
                  onChange={(e) => setProduct({ ...product, buttonText: e.target.value })}
                  placeholder="Buy on Gumroad"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.directCheckout}
                    onChange={(e) => setProduct({ ...product, directCheckout: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600"
                  />
                  <span className="text-white font-bold">Direct Checkout (?wanted=true)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 text-xs">
          <div className="bg-[#14171F] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase font-heading">Visibility & Category</h3>

            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Status</label>
              <select
                value={product.status || 'published'}
                onChange={(e) => setProduct({ ...product, status: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Category</label>
              <select
                value={product.categoryId || ''}
                onChange={(e) => setProduct({ ...product, categoryId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={product.bestseller}
                  onChange={(e) => setProduct({ ...product, bestseller: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600"
                />
                <span className="text-white font-bold">Best Seller Badge</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={product.sale}
                  onChange={(e) => setProduct({ ...product, sale: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600"
                />
                <span className="text-white font-bold">On Sale Badge</span>
              </label>
            </div>
          </div>

          <div className="bg-[#14171F] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase font-heading">Product Image URL</h3>
            <input
              value={product.thumbnail || (product.images && product.images[0]) || ''}
              onChange={(e) => setProduct({ ...product, thumbnail: e.target.value, images: [e.target.value] })}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
            />
            {product.thumbnail && (
              <img src={product.thumbnail} alt="Preview" className="w-full aspect-square object-cover rounded-xl border border-white/10 mt-2" />
            )}
          </div>
        </div>
      </div>
    </form>
  );
};
