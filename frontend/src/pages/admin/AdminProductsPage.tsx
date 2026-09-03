import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Product, Category } from '../../types';
import { formatPrice } from '../../utils/formatters';
import {
  Plus,
  Edit2,
  Copy,
  Trash2,
  ExternalLink,
  Search,
  Package,
  RefreshCw,
  ChevronDown,
  Eye,
  EyeOff,
  Star,
  Tag,
  LayoutGrid,
  LayoutList,
  Filter,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react';

type ViewMode = 'table' | 'grid';
type StatusFilter = 'all' | 'published' | 'draft';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.getProducts({ status: 'all' }),
      api.getCategories(),
    ])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.shortDescription || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchCat = categoryFilter === 'all' || p.categoryId === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const handleToggleStatus = async (product: Product) => {
    setTogglingId(product.id);
    try {
      const newStatus = product.status === 'published'  ? 'draft'  : 'published';
      const updated = await api.updateProduct(product.id, { status: newStatus });
      setProducts((prev) => prev.map((p) => (p.id === product.id  ? updated  : p)));
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleFlag = async (product: Product, flag: 'featured' | 'bestseller' | 'sale') => {
    try {
      const updated = await api.updateProduct(product.id, { [flag]: !product[flag] });
      setProducts((prev) => prev.map((p) => (p.id === product.id  ? updated  : p)));
    } catch {}
  };

  const handleDuplicate = async (product: Product) => {
    setDuplicatingId(product.id);
    try {
      const dup = await api.duplicateProduct(product.id);
      setProducts((prev) => [dup, ...prev]);
    } catch (err: any) {
      alert('Duplicate failed: ' + err.message);
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Permanently delete "${product.title}"-\n\nThis cannot be undone.`)) return;
    setDeletingId(product.id);
    try {
      await api.deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setSelectedIds((prev) => { const s = new Set(prev); s.delete(product.id); return s; });
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      s.has(id)  ? s.delete(id)  : s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected products permanently-`)) return;
    setBulkDeleting(true);
    for (const id of Array.from(selectedIds)) {
      try { await api.deleteProduct(id); } catch {}
    }
    setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    setBulkDeleting(false);
  };

  const handleBulkStatus = async (newStatus: 'published' | 'draft') => {
    for (const id of Array.from(selectedIds)) {
      try {
        const updated = await api.updateProduct(id, { status: newStatus });
        setProducts((prev) => prev.map((p) => (p.id === id  ? updated  : p)));
      } catch {}
    }
    setSelectedIds(new Set());
  };

  const getCategoryName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name || catId;

  const statsPublished = products.filter((p) => p.status === 'published').length;
  const statsDraft = products.filter((p) => p.status === 'draft').length;
  const statsFeatured = products.filter((p) => p.featured).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
            <Package className="w-5 h-5 text-red-500" />
            Products Catalog
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {products.length} total products  - manage pricing, images, specs, and Gumroad checkout links
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl border border-white/10 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/admin/import"
            className="px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Zap className="w-4 h-4" />
            <span>1-Click Importer</span>
          </Link>
          <Link
            to="/admin/products/new"
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-red-900/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: products.length, color: 'text-white' },
          { label: 'Published', value: statsPublished, color: 'text-emerald-400' },
          { label: 'Draft', value: statsDraft, color: 'text-amber-400' },
          { label: 'Featured', value: statsFeatured, color: 'text-blue-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#14171F] border border-white/10 rounded-2xl p-4">
            <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">{stat.label}</p>
            <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 10-Product Free Tier Progress Bar */}
      <div className="bg-[#14141E] border border-indigo-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black text-sm">
            {products.length}/10
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Starter Free Tier Inventory</h4>
            <p className="text-[11px] text-gray-400">
              You have used {products.length} of 10 free product slots. {Math.max(0, 10 - products.length)} slots available.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-32 sm:w-48 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${products.length >= 10  ? 'bg-amber-500'  : 'bg-indigo-500'}`}
              style={{ width: `${Math.min(100, (products.length / 10) * 100)}%` }}
            />
          </div>
          <Link
            to="/admin/settings"
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl shadow-md transition-all ml-2 whitespace-nowrap"
          >
             🚀 Upgrade (50 Products)
          </Link>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 bg-[#14171F] border border-white/10 rounded-2xl p-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, SKU, or description..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0F1115] border border-white/10 text-white text-xs focus:outline-none focus:border-red-500 placeholder:text-gray-600"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="appearance-none bg-[#0F1115] border border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs text-white focus:outline-none focus:border-red-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none bg-[#0F1115] border border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs text-white focus:outline-none focus:border-red-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#0F1115] border border-white/10 rounded-xl p-1">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table'  ? 'bg-red-600 text-white'  : 'text-gray-400 hover:text-white'}`}
            title="Table view"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid'  ? 'bg-red-600 text-white'  : 'text-gray-400 hover:text-white'}`}
            title="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3.5 bg-red-600/10 border border-red-500/30 rounded-2xl">
          <span className="text-xs font-bold text-red-400">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => handleBulkStatus('published')}
              className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl hover:bg-emerald-600/30 transition-colors"
            >
              Publish Selected
            </button>
            <button
              onClick={() => handleBulkStatus('draft')}
              className="px-3 py-1.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl hover:bg-amber-600/30 transition-colors"
            >
              Draft Selected
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl hover:bg-red-600/30 transition-colors disabled:opacity-50"
            >
              {bulkDeleting  ? 'Deleting...'  : 'Delete Selected'}
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="text-gray-400 hover:text-white text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Filter className="w-3.5 h-3.5" />
        <span>Showing <strong className="text-white">{filtered.length}</strong> of {products.length} products</span>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="bg-[#14171F] border border-white/10 rounded-3xl p-16 text-center flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400 font-semibold">Loading all products...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#14171F] border border-white/10 rounded-3xl p-16 text-center">
          <Package className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-white">No products found</p>
          <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filters</p>
          <Link to="/admin/products/new" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl">
            <Plus className="w-3.5 h-3.5" /> Add First Product
          </Link>
        </div>
      ) : viewMode === 'table' ? (

        /* ---- TABLE VIEW ---- */
        <div className="bg-[#14171F] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#0F1115] border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <tr>
                  <th className="py-4 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="accent-red-500 w-3.5 h-3.5"
                    />
                  </th>
                  <th className="py-4 px-4">Product</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Price</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Flags</th>
                  <th className="py-4 px-4">Gumroad</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-white/[0.025] transition-colors ${selectedIds.has(product.id)  ? 'bg-red-500/5'  : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="accent-red-500 w-3.5 h-3.5"
                      />
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={product.thumbnail || product.images?.[0]}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded-xl bg-black/40 shrink-0 border border-white/5"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9-auto=format&fit=crop&w=100&q=60'; }}
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/admin/products/${product.id}`}
                            className="font-bold text-white hover:text-red-400 transition-colors block truncate max-w-[200px]"
                          >
                            {product.title}
                          </Link>
                          <p className="text-[10px] font-mono text-gray-500 mt-0.5">{product.sku}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] text-gray-400 bg-white/5 px-2 py-1 rounded-lg">
                        {getCategoryName(product.categoryId)}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-black text-white text-sm">{formatPrice(product.price)}</span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="text-[10px] line-through text-gray-500 block">{formatPrice(product.compareAtPrice)}</span>
                        )}
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(product)}
                        disabled={togglingId === product.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${
                          product.status === 'published'
                             ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20'
                        } disabled:opacity-50`}
                        title={`Click to ${product.status === 'published'  ? 'unpublish'  : 'publish'}`}
                      >
                        {togglingId === product.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : product.status === 'published' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        <span>{product.status}</span>
                      </button>
                    </td>

                    {/* Flag Toggles */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleFlag(product, 'featured')}
                          title="Toggle Featured"
                          className={`p-1.5 rounded-lg transition-colors text-xs ${product.featured  ? 'bg-blue-500/20 text-blue-400'  : 'bg-white/5 text-gray-600 hover:text-gray-300'}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleFlag(product, 'bestseller')}
                          title="Toggle Bestseller"
                          className={`p-1.5 rounded-lg transition-colors ${product.bestseller  ? 'bg-amber-500/20 text-amber-400'  : 'bg-white/5 text-gray-600 hover:text-gray-300'}`}
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleFlag(product, 'sale')}
                          title="Toggle Sale"
                          className={`p-1.5 rounded-lg transition-colors ${product.sale  ? 'bg-red-500/20 text-red-400'  : 'bg-white/5 text-gray-600 hover:text-gray-300'}`}
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Gumroad URL */}
                    <td className="py-3.5 px-4">
                      {product.gumroadUrl ? (
                        <a
                          href={product.gumroadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 font-bold bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20"
                        >
                          <Zap className="w-3 h-3" />
                          Linked
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-gray-600 italic">Not linked</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/products/${product.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                          title="Preview on Storefront"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                        <Link
                          to={`/admin/products/${product.id}`}
                          className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(product)}
                          disabled={duplicatingId === product.id}
                          className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
                          title="Duplicate Product"
                        >
                          {duplicatingId === product.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          disabled={deletingId === product.id}
                          className="p-2 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
                          title="Delete Product"
                        >
                          {deletingId === product.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      ) : (

        /* ---- GRID VIEW ---- */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className={`bg-[#14171F] border rounded-2xl overflow-hidden hover:border-white/20 transition-all group ${
                selectedIds.has(product.id)  ? 'border-red-500/50 bg-red-500/5'  : 'border-white/10'
              }`}
            >
              {/* Image */}
              <div className="relative aspect-square bg-black/30 overflow-hidden">
                <img
                  src={product.thumbnail || product.images?.[0]}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9-auto=format&fit=crop&w=400&q=60'; }}
                />
                {/* Checkbox overlay */}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="accent-red-500 w-4 h-4"
                  />
                </div>
                {/* Status badge */}
                <div className="absolute top-2 right-2">
                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                    product.status === 'published'
                       ? 'bg-emerald-500 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {product.status}
                  </span>
                </div>
                {/* Flag badges */}
                <div className="absolute bottom-2 left-2 flex gap-1">
                  {product.bestseller && (
                    <span className="text-[8px] bg-amber-500 text-black font-black px-1.5 py-0.5 rounded uppercase">Hot</span>
                  )}
                  {product.featured && (
                    <span className="text-[8px] bg-blue-500 text-white font-black px-1.5 py-0.5 rounded uppercase">Featured</span>
                  )}
                  {product.sale && (
                    <span className="text-[8px] bg-red-500 text-white font-black px-1.5 py-0.5 rounded uppercase">Sale</span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-3.5 space-y-2.5">
                <div>
                  <Link
                    to={`/admin/products/${product.id}`}
                    className="text-xs font-bold text-white hover:text-red-400 transition-colors line-clamp-2 leading-tight"
                  >
                    {product.title}
                  </Link>
                  <p className="text-[10px] font-mono text-gray-500 mt-0.5">{product.sku}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-black text-white">{formatPrice(product.price)}</span>
                    {product.compareAtPrice && (
                      <span className="text-[10px] line-through text-gray-500 ml-1.5">{formatPrice(product.compareAtPrice)}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-lg">
                    {getCategoryName(product.categoryId).split(' ')[0]}
                  </span>
                </div>

                {/* Grid Actions */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
                  <Link
                    to={`/admin/products/${product.id}`}
                    className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </Link>
                  <button
                    onClick={() => handleToggleStatus(product)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      product.status === 'published'
                         ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
                    }`}
                    title={product.status === 'published'  ? 'Unpublish'  : 'Publish'}
                  >
                    {product.status === 'published'  ? <Eye className="w-3.5 h-3.5" />  : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDuplicate(product)}
                    className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="p-1.5 bg-white/5 hover:bg-red-500/15 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
