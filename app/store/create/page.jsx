'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Store, ArrowLeft, Sparkles, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateStorePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [themeColor, setThemeColor] = useState('#4f46e5');
  const [submitting, setSubmitting] = useState(false);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error('Store name and URL slug are required');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Creating store in Supabase PostgreSQL...');
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          theme: { primary: themeColor, mode: 'dark' }
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Store "${name}" created successfully!`, { id: toastId });
        router.push(`/store/manage-product?store=${slug}`);
      } else {
        toast.error('Failed to create store: ' + (data.error || 'Server error'), { id: toastId });
      }
    } catch (err) {
      toast.error('Error creating store: ' + err.message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Master Dashboard</span>
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Create New Store</h1>
              <p className="text-xs text-slate-500 mt-0.5">Launches an isolated storefront & creator link-in-bio presence</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Store Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Apex Drift Club, Lumina Apparel"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Store URL Handle / Slug *
              </label>
              <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                <span className="bg-slate-100 text-slate-500 px-3 py-2.5 text-xs font-mono flex items-center border-r border-slate-200">
                  gumshop.online/shop/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                  placeholder="apex-drift-club"
                  className="flex-1 px-3 py-2.5 text-sm font-mono focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Also creates your creator bio page at <code className="text-indigo-600">gumshop.online/creator/{slug || '...'}</code>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Store Bio & Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Curated high-performance gear, digital downloads, and exclusive creator merch."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Brand Accent Color
              </label>
              <div className="flex items-center gap-3">
                {['#4f46e5', '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setThemeColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-8 h-8 rounded-full border-2 transition ${
                      themeColor === color ? 'border-slate-900 scale-110 shadow-md' : 'border-white'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Create & Launch Store</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
