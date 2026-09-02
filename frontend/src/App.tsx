import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';

// Storefront components
import { AnnouncementBar } from './components/storefront/AnnouncementBar';
import { Header } from './components/storefront/Header';
import { Footer } from './components/storefront/Footer';
import { CartDrawer } from './components/storefront/CartDrawer';
import { SearchModal } from './components/storefront/SearchModal';

// SaaS Marketing & Auth Pages
import { LandingPage } from './pages/marketing/LandingPage';
import { SignupPage } from './pages/auth/SignupPage';

// Storefront pages
import { HomePage } from './pages/storefront/HomePage';
import { ProductDetailPage } from './pages/storefront/ProductDetailPage';
import { CollectionPage } from './pages/storefront/CollectionPage';
import { BundlesPage } from './pages/storefront/BundlesPage';
import { SearchPage } from './pages/storefront/SearchPage';
import { BlogListPage } from './pages/storefront/BlogListPage';
import { BlogPostPage } from './pages/storefront/BlogPostPage';
import { AboutPage } from './pages/storefront/AboutPage';
import { ContactPage } from './pages/storefront/ContactPage';
import { OrderTrackingPage } from './pages/storefront/OrderTrackingPage';
import { PrivacyPolicyPage } from './pages/storefront/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/storefront/TermsOfServicePage';
import { CookiePolicyPage } from './pages/storefront/CookiePolicyPage';

// Admin layout and pages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminGumroadSyncPage } from './pages/admin/AdminGumroadSyncPage';
import { AdminScraperPage } from './pages/admin/AdminScraperPage';
import { AdminGuidePage } from './pages/admin/AdminGuidePage';
import { AdminOnboardingPage } from './pages/admin/AdminOnboardingPage';
import { MasterAdminLayout } from './components/admin/MasterAdminLayout';
import { MasterStoresPage } from './pages/admin/MasterStoresPage';
import { MasterBillingPage } from './pages/admin/MasterBillingPage';
import { MasterSettingsPage } from './pages/admin/MasterSettingsPage';
import { CustomerAccountPage } from './pages/storefront/CustomerAccountPage';
import { SuperAdminDashboardPage } from './pages/admin/SuperAdminDashboardPage';
import { AdminHomepageBuilderPage } from './pages/admin/AdminHomepageBuilderPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminProductEditPage } from './pages/admin/AdminProductEditPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminCollectionsPage } from './pages/admin/AdminCollectionsPage';
import { AdminBundlesPage } from './pages/admin/AdminBundlesPage';
import { AdminNavigationPage } from './pages/admin/AdminNavigationPage';
import { AdminFooterPage } from './pages/admin/AdminFooterPage';
import { AdminAppearancePage } from './pages/admin/AdminAppearancePage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminPromotionsPage } from './pages/admin/AdminPromotionsPage';
import { AdminTestimonialsPage } from './pages/admin/AdminTestimonialsPage';
import { AdminBlogPage } from './pages/admin/AdminBlogPage';
import { AdminMediaPage } from './pages/admin/AdminMediaPage';
import { AdminSeoPage } from './pages/admin/AdminSeoPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { UpgradePage } from './pages/admin/UpgradePage';
import { BillingSuccessPage } from './pages/billing/BillingSuccessPage';
import { BillingCancelPage } from './pages/billing/BillingCancelPage';

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090B0E] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

const StorefrontLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { siteSettings } = useTheme();

  if (siteSettings?.maintenanceMode && !window.location.pathname.startsWith('/admin')) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center p-6 text-center text-gray-200">
        <h1 className="text-3xl font-black text-white uppercase font-heading">{siteSettings.maintenanceTitle}</h1>
        <p className="text-sm text-gray-400 mt-2 max-w-md">{siteSettings.maintenanceMessage}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0A0A0F]">
      <div>
        <AnnouncementBar />
        <Header onOpenSearch={() => setIsSearchOpen(true)} />
        <main>{children}</main>
      </div>
      <Footer />
      <CartDrawer />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* SaaS Marketing Landing Page */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Public Multi-Tenant Storefront Routes */}
              <Route path="/store/:slug" element={<StorefrontLayout><HomePage /></StorefrontLayout>} />
              <Route path="/store/:slug/products/:slug" element={<StorefrontLayout><ProductDetailPage /></StorefrontLayout>} />
              <Route path="/store/:slug/collections/:slug" element={<StorefrontLayout><CollectionPage /></StorefrontLayout>} />
              <Route path="/store/:slug/bundles" element={<StorefrontLayout><BundlesPage /></StorefrontLayout>} />

              {/* Standard Storefront Routes */}
              <Route path="/products/:slug" element={<StorefrontLayout><ProductDetailPage /></StorefrontLayout>} />
              <Route path="/collections/:slug" element={<StorefrontLayout><CollectionPage /></StorefrontLayout>} />
              <Route path="/bundles" element={<StorefrontLayout><BundlesPage /></StorefrontLayout>} />
              <Route path="/search" element={<StorefrontLayout><SearchPage /></StorefrontLayout>} />
              <Route path="/blog" element={<StorefrontLayout><BlogListPage /></StorefrontLayout>} />
              <Route path="/blog/:slug" element={<StorefrontLayout><BlogPostPage /></StorefrontLayout>} />
              <Route path="/about" element={<StorefrontLayout><AboutPage /></StorefrontLayout>} />
              <Route path="/contact" element={<StorefrontLayout><ContactPage /></StorefrontLayout>} />
              <Route path="/privacy" element={<StorefrontLayout><PrivacyPolicyPage /></StorefrontLayout>} />
              <Route path="/terms" element={<StorefrontLayout><TermsOfServicePage /></StorefrontLayout>} />
              <Route path="/cookies" element={<StorefrontLayout><CookiePolicyPage /></StorefrontLayout>} />
              <Route path="/track" element={<StorefrontLayout><OrderTrackingPage /></StorefrontLayout>} />
              <Route path="/account" element={<StorefrontLayout><CustomerAccountPage /></StorefrontLayout>} />
              <Route path="/store/:slug/account" element={<StorefrontLayout><CustomerAccountPage /></StorefrontLayout>} />
              <Route path="/store/:slug/track" element={<StorefrontLayout><OrderTrackingPage /></StorefrontLayout>} />
              <Route path="/store/:slug/privacy" element={<StorefrontLayout><PrivacyPolicyPage /></StorefrontLayout>} />
              <Route path="/store/:slug/terms" element={<StorefrontLayout><TermsOfServicePage /></StorefrontLayout>} />
              <Route path="/store/:slug/cookies" element={<StorefrontLayout><CookiePolicyPage /></StorefrontLayout>} />

              {/* Admin Auth Route */}
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Onboarding Wizard (Post-Signup) */}
              <Route
                path="/admin/onboarding"
                element={
                  <ProtectedAdminRoute>
                    <AdminOnboardingPage />
                  </ProtectedAdminRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout />
                  </ProtectedAdminRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="gumroad" element={<AdminGumroadSyncPage />} />
                <Route path="import" element={<AdminScraperPage />} />
                <Route path="guide" element={<AdminGuidePage />} />
                <Route path="homepage" element={<AdminHomepageBuilderPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="products/new" element={<AdminProductEditPage />} />
                <Route path="products/:id" element={<AdminProductEditPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="collections" element={<AdminCollectionsPage />} />
                <Route path="bundles" element={<AdminBundlesPage />} />
                <Route path="navigation" element={<AdminNavigationPage />} />
                <Route path="footer" element={<AdminFooterPage />} />
                <Route path="appearance" element={<AdminAppearancePage />} />
                <Route path="integrations" element={<Navigate to="/admin/integrations/payments" replace />} />
                <Route path="integrations/payments" element={<AdminPaymentsPage />} />
                <Route path="promotions" element={<AdminPromotionsPage />} />
                <Route path="testimonials" element={<AdminTestimonialsPage />} />
                <Route path="blog" element={<AdminBlogPage />} />
                <Route path="media" element={<AdminMediaPage />} />
                <Route path="seo" element={<AdminSeoPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="upgrade" element={<UpgradePage />} />
              </Route>

              {/* Gumroad Hosted Billing Return Routes */}
              <Route path="/billing/success" element={<BillingSuccessPage />} />
              <Route path="/billing/cancel" element={<BillingCancelPage />} />

              {/* Master Super Admin Platform */}
              <Route
                path="/super-admin"
                element={
                  <ProtectedAdminRoute>
                    <MasterAdminLayout />
                  </ProtectedAdminRoute>
                }
              >
                <Route index element={<SuperAdminDashboardPage />} />
                <Route path="stores" element={<MasterStoresPage />} />
                <Route path="billing" element={<MasterBillingPage />} />
                <Route path="users" element={<MasterStoresPage />} />
                <Route path="settings" element={<MasterSettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
