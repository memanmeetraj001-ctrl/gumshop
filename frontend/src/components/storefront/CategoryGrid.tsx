import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HomepageSection, Category } from '../../types';
import { api } from '../../api/client';
import { ArrowRight, Shield, Droplets, Zap, Sparkles, Layers } from 'lucide-react';

interface CategoryGridProps {
  section: HomepageSection;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ section }) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Shield': return <Shield className="w-6 h-6 text-red-500" />;
      case 'Droplets': return <Droplets className="w-6 h-6 text-blue-400" />;
      case 'Zap': return <Zap className="w-6 h-6 text-amber-400" />;
      case 'Sparkles': return <Sparkles className="w-6 h-6 text-purple-400" />;
      default: return <Layers className="w-6 h-6 text-red-400" />;
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-[#0A0C0F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          {section.subtitle && (
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1.5">
              {section.subtitle}
            </p>
          )}
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase font-heading">
            {section.title || 'Shop By Category'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/collections/${cat.slug}`}
              className="group relative bg-[#14171F] border border-white/10 hover:border-red-500/50 rounded-2xl overflow-hidden p-6 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-red-600/10 transition-colors">
                  {getIcon(cat.icon)}
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-red-400 group-hover:text-red-300">
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
