import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { HomepageSection } from '../../types';
import { HeroSection } from '../../components/storefront/HeroSection';
import { SocialProofBar } from '../../components/storefront/SocialProofBar';
import { ProductGrid } from '../../components/storefront/ProductGrid';
import { BundleSection } from '../../components/storefront/BundleSection';
import { CategoryGrid } from '../../components/storefront/CategoryGrid';
import { BenefitsSection } from '../../components/storefront/BenefitsSection';
import { TestimonialsSection } from '../../components/storefront/TestimonialsSection';
import { CommunityGallery } from '../../components/storefront/CommunityGallery';
import { FaqSection } from '../../components/storefront/FaqSection';
import { NewsletterSection } from '../../components/storefront/NewsletterSection';

export const HomePage: React.FC = () => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHomepageSections()
      .then(setSections)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#0A0C0F]">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C0F]">
      {sections.map((section) => {
        switch (section.type) {
          case 'hero':
            return <HeroSection key={section.id} section={section} />;
          case 'social_proof':
            return <SocialProofBar key={section.id} section={section} />;
          case 'product_grid':
            return <ProductGrid key={section.id} section={section} />;
          case 'bundle_grid':
            return <BundleSection key={section.id} section={section} />;
          case 'category_grid':
            return <CategoryGrid key={section.id} section={section} />;
          case 'benefits':
            return <BenefitsSection key={section.id} section={section} />;
          case 'testimonials':
            return <TestimonialsSection key={section.id} section={section} />;
          case 'community':
            return <CommunityGallery key={section.id} section={section} />;
          case 'faq':
            return <FaqSection key={section.id} section={section} />;
          case 'newsletter':
            return <NewsletterSection key={section.id} section={section} />;
          default:
            return null;
        }
      })}
    </div>
  );
};
