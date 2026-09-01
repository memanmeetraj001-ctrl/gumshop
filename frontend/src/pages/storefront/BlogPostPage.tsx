import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { BlogPost } from '../../types';
import { formatDate } from '../../utils/formatters';
import { Clock, ArrowLeft, User } from 'lucide-react';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.getBlogPostBySlug(slug)
      .then(setPost)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#0A0C0F]">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-white mb-2">Article Not Found</h2>
        <Link to="/blog" className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl">
          Back to Guides
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C0F] text-gray-200 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/blog" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Journal & Guides</span>
        </Link>

        <h1 className="text-3xl sm:text-5xl font-black text-white font-heading leading-tight mb-4">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-xs text-gray-400 mb-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-red-400" />
            <span className="text-white font-bold">{post.author}</span>
          </div>
          <span>-</span>
          <span>{formatDate(post.publishedAt)}</span>
          <span>-</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-red-400" />
            {post.readTime}
          </span>
        </div>

        <div className="rounded-3xl overflow-hidden mb-10 border border-white/10 shadow-2xl">
          <img src={post.featuredImage} alt={post.title} className="w-full aspect-video object-cover" />
        </div>

        <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed space-y-6 text-base sm:text-lg">
          {post.content.split('\n\n').map((para, i) => {
            if (para.startsWith('## ')) {
              return <h2 key={i} className="text-2xl font-bold text-white mt-8 mb-3 font-heading">{para.replace('## ', '')}</h2>;
            }
            if (para.startsWith('### ')) {
              return <h3 key={i} className="text-xl font-bold text-white mt-6 mb-2 font-heading">{para.replace('### ', '')}</h3>;
            }
            return <p key={i}>{para}</p>;
          })}
        </div>
      </div>
    </div>
  );
};
