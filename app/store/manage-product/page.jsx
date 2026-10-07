'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Edit3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  RefreshCw, 
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

function ManageProductsContent() {
  const searchParams = useSearchParams();
  const storeParam = searchParams.get('store');

  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Product Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formQuantity, setFormQuantity] = useState('100');
  const [formCategory, setFormCategory] = useState('General');
  const [formImage, setFormImage] = useState('');
  const [formGumroadUrl, setFormGumroadUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Load stores first
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch('/api/stores');
        const data = await res.json();
        if (data.success && Array.isArray(data.stores)) {
          setStores(data.stores);
          if (data.stores.length > 0) {
            const current = storeParam 
              ? data.stores.find(s => s.slug === storeParam || s.id === storeParam) || data.stores[0]
              : data.stores[0];
            setSelectedStore(current);
          }
        }
      } catch (e) {
        toast.error('Failed to load stores');
      }
    };
    fetchStores();
  }, [storeParam]);

  // Load products when selected store changes
  useEffect(() => {
    if (!selectedStore) {
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?store_id=${selectedStore.id}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      } catch (e) {
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedStore]);

  // Calculations for Margin Summary Cards
  const totalProducts = products.length;
  const inventoryValue = products.reduce((acc, p) => acc + (p.price * (p.inventory_quantity || 1)), 0);
  const outOfStockCount = products.filter(p => !p.is_active || p.inventory_quantity <= 0).length;
  
  const avgMargin = totalProducts > 0 
    ? (products.reduce((acc, p) => {
        const price = p.price || 0;
        const cost = p.cost_of_goods || 0;
        const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
        return acc + margin;
      }, 0) / totalProducts).toFixed(1)
    : '0.0';

  // Toggle Live Stock Switch
  const handleToggleStock = async (product) => {
    const newStatus = !product.is_active;
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          updates: { is_active: newStatus }
        })
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: newStatus } : p));
        toast.success(`Product ${newStatus ? 'activated' : 'hidden'}`);
      }
    } catch {
      toast.error('Failed to update stock status');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id, title) => {
    if (!confirm(`Delete product "${title}"?`)) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.filter(p => p.id !== id));
        toast.success('Product removed');
      }
    } catch {
      toast.error('Error deleting product');
    }
  };

  // Open modal for new or editing
  const handleOpenModal = (prod = null) => {
    if (prod) {
      setEditingProduct(prod);
      setFormTitle(prod.title);
      setFormPrice(prod.price.toString());
      setFormCost(prod.cost_of_goods ? prod.cost_of_goods.toString() : '');
      setFormQuantity((prod.inventory_quantity || 100).toString());
      setFormCategory(prod.category || 'General');
      setFormImage(prod.images?.[0] || '');
      setFormGumroadUrl(prod.gumroad_url || '');
    } else {
      setEditingProduct(null);
      setFormTitle('');
      setFormPrice('');
      setFormCost('');
      setFormQuantity('100');
      setFormCategory('General');
      setFormImage('');
      setFormGumroadUrl('');
    }
    setModalOpen(true);
  };

  // Save product (Create or Edit)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!selectedStore) {
      toast.error('Please create or select a store first');
      return;
    }
    if (!formTitle.trim() || !formPrice) {
      toast.error('Title and price are required');
      return;
    }

    setSaving(true);
    const priceNum = parseFloat(formPrice) || 0;
    const costNum = parseFloat(formCost) || parseFloat((priceNum * 0.45).toFixed(2));

    try {
      if (editingProduct) {
        // Update
        const res = await fetch('/api/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingProduct.id,
            updates: {
              title: formTitle.trim(),
              price: priceNum,
              cost_of_goods: costNum,
              inventory_quantity: parseInt(formQuantity) || 100,
              category: formCategory.trim(),
              images: formImage ? [formImage.trim()] : [],
              gumroad_url: formGumroadUrl.trim()
            }
          })
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Product updated');
          setProducts(prev => prev.map(p => p.id === editingProduct.id ? {
            ...p,
            title: formTitle,
            price: priceNum,
            cost_of_goods: costNum,
            inventory_quantity: parseInt(formQuantity) || 100,
            category: formCategory,
            images: formImage ? [formImage] : [],
            gumroad_url: formGumroadUrl
          } : p));
          setModalOpen(false);
        }
      } else {
        // Create
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            store_id: selectedStore.id,
            title: formTitle.trim(),
            price: priceNum,
            cost_of_goods: costNum,
            inventory_quantity: parseInt(formQuantity) || 100,
            category: formCategory.trim(),
            images: formImage ? [formImage.trim()] : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80"],
            gumroad_url: formGumroadUrl.trim()
          })
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Product added to catalog');
          setProducts(prev => [data.product, ...prev]);
          setModalOpen(false);
        }
      }
    } catch (e) {
      toast.error('Error saving: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Filter products by search query
  const filteredProducts = products.filter(p => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar 
        stores={stores} 
        activeStore={selectedStore} 
        onStoreChange={(s) => setSelectedStore(s)} 
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span>Product Catalog & Profit Margins</span>
              {selectedStore && (
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {selectedStore.name}
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your inventory, prices, Gumroad checkout links, and monitor real-time profit margins.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleOpenModal()}
              disabled={!selectedStore}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>
        </div>

        {/* Profit Metrics Cards Matching Mockup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Average Margin</div>
            <div className="text-3xl font-black text-slate-900 flex items-center gap-2">
              <span>{avgMargin}%</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">↗ Net</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Products</div>
            <div className="text-3xl font-black text-slate-900">{totalProducts}</div>
            <div className="text-xs text-slate-400 mt-1">In active store catalog</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Inventory Value</div>
            <div className="text-3xl font-black text-slate-900">${inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-xs text-slate-400 mt-1">Retail catalog value</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Out of Stock</div>
            <div className="text-3xl font-black text-slate-900">{outOfStockCount}</div>
            <div className="text-xs text-slate-400 mt-1">Hidden from storefront</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products or category..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {selectedStore && (
              <>
                <a
                  href={`/shop/${selectedStore.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  <span>Preview Storefront</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
                <a
                  href={`/creator/${selectedStore.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition"
                >
                  <span>Preview Link-in-Bio</span>
                  <ExternalLink className="w-3 h-3 text-purple-500" />
                </a>
              </>
            )}
          </div>
        </div>

        {/* Product Table */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-indigo-600 mb-3" />
            <p className="text-xs font-semibold">Loading product catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No products in this store</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              Add individual products or use the Store Cloner to scrape an entire catalog in 1 click.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Product</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Product</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Cost of Goods</th>
                    <th className="py-3.5 px-4">Net Margin</th>
                    <th className="py-3.5 px-4">Live Stock</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const price = parseFloat(p.price) || 0;
                    const cost = parseFloat(p.cost_of_goods) || 0;
                    const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : '0.0';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                              {p.images?.[0] ? (
                                <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <Package className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate max-w-xs">{p.title}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{p.category || 'General'}</span>
                                {p.gumroad_url && (
                                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Gumroad Linked
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-900">
                          ${price.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-medium">
                          ${cost.toFixed(2)}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            parseFloat(margin) >= 40 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {margin}%
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleStock(p)}
                            className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                              p.is_active 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${p.is_active ? 'bg-indigo-600' : 'bg-slate-400'}`} />
                            <span>{p.is_active ? `In Stock (${p.inventory_quantity || 100})` : 'Hidden'}</span>
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenModal(p)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                              title="Edit product"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.title)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Add or Edit Product */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 relative">
              <button 
                onClick={() => setModalOpen(false)}
                className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-slate-900 mb-1">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-xs text-slate-500 mb-5">
                Automatically calculates real-time profit margin & syncs to storefront.
              </p>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Apex 1/16 Brushless Drift Car"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Selling Price ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="49.99"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Cost of Goods ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formCost}
                      onChange={(e) => setFormCost(e.target.value)}
                      placeholder="22.50"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="Vehicles, Merch, Digital"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Inventory Count
                    </label>
                    <input
                      type="number"
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value)}
                      placeholder="100"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gumroad Product Checkout Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={formGumroadUrl}
                    onChange={(e) => setFormGumroadUrl(e.target.value)}
                    placeholder="https://gumroad.com/l/your-product"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Used to open inframe checkout directly on click. If left blank, a dynamic checkout link is generated automatically.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingProduct ? 'Save Changes' : 'Add to Catalog'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function ManageProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading catalog...</div>}>
      <ManageProductsContent />
    </Suspense>
  );
}
