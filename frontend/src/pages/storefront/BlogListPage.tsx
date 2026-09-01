import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { BlogPost } from '../../types';
import { formatDate } from '../../utils/formatters';
import { BookOpen, ArrowRight, Clock } from 'lucide-react';

export const BlogListPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBlogPosts().then(setPosts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0C0F] py-12 text-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-1.5 rounded-full inline-block mb-3">
            WORKSPACE &amp; GEAR JOURNAL
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase font-heading">
            Design, Desk Setups &amp; EDC Guides
          </h1>
          <p className="text-sm sm:text-base text-gray-400 mt-3">
            Expert breakdowns on mechanical keyboards, acoustic tuning, everyday carry optimization, and workspace ergonomics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group bg-[#14171F] border border-white/10 hover:border-indigo-500/50 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="aspect-video overflow-hidden bg-black">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="p-8 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                    <span>{formatDate(post.publishedAt)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      {post.readTime}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-300 mt-2 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center text-xs font-bold text-indigo-400 gap-1.5 group-hover:translate-x-1 transition-transform">
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
