import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { MarketplaceLayout } from '@/layouts/MarketplaceLayout';
import { WorkspaceLayout } from '@/layouts/WorkspaceLayout';
import { HomePage } from '@/pages/HomePage';
import { ProductsPage } from '@/pages/ProductsPage';
import { CategoryPage } from '@/pages/CategoryPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { SearchPage } from '@/pages/SearchPage';
import { StoresPage } from '@/pages/StoresPage';
import { StorefrontPage } from '@/pages/StorefrontPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { AccountPage } from '@/pages/AccountPage';
import { SellerDashboardPage } from '@/pages/SellerDashboardPage';
import { SellerProductsPage } from '@/pages/SellerProductsPage';
import { SellerProductFormPage } from '@/pages/SellerProductFormPage';
import { SellerFinancePage } from '@/pages/SellerFinancePage';
import { SellerOrdersPage } from '@/pages/SellerOrdersPage';
import { SellerDisputesPage } from '@/pages/SellerDisputesPage';
import { SellerProfilePage } from '@/pages/SellerProfilePage';
import { SellerOnboardingPage } from '@/pages/SellerOnboardingPage';
import { SellerInventoryPage } from '@/pages/SellerInventoryPage';
import { SellerReviewsPage } from '@/pages/SellerReviewsPage';
import { SellerProductDetailPage } from '@/pages/SellerProductDetailPage';
import { InboxPage } from '@/pages/workspace/InboxPage';
import { AlertsPage } from '@/pages/workspace/AlertsPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { WishlistPage } from '@/pages/WishlistPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { AdminPage } from '@/pages/AdminPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { WhyTomboraPage } from '@/pages/WhyTomboraPage';
import { HowItWorksPage } from '@/pages/HowItWorksPage';
import { SellPage } from '@/pages/SellPage';
import { SourcingRequestPage } from '@/pages/SourcingRequestPage';
import { OnlineServicePage } from '@/pages/OnlineServicePage';
import { MobileAppPage } from '@/pages/MobileAppPage';
import { ImageSearchPage } from '@/pages/ImageSearchPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<WorkspaceLayout variant="seller" />}>
          <Route path="seller" element={<SellerDashboardPage />} />
          <Route path="seller/products" element={<SellerProductsPage />} />
          <Route path="seller/products/new" element={<SellerProductFormPage />} />
          <Route path="seller/products/:productId/edit" element={<SellerProductFormPage />} />
          <Route path="seller/products/:productId" element={<SellerProductDetailPage />} />
          <Route path="seller/inventory" element={<SellerInventoryPage />} />
          <Route path="seller/reviews" element={<SellerReviewsPage />} />
          <Route path="seller/finance" element={<SellerFinancePage />} />
          <Route path="seller/orders" element={<SellerOrdersPage />} />
          <Route path="seller/messages" element={<InboxPage basePath="/seller/messages" />} />
          <Route path="seller/messages/:threadId" element={<InboxPage basePath="/seller/messages" />} />
          <Route path="seller/disputes" element={<SellerDisputesPage />} />
          <Route path="seller/notifications" element={<AlertsPage />} />
          <Route path="seller/onboarding" element={<SellerOnboardingPage />} />
          <Route path="seller/profile" element={<SellerProfilePage />} />
        </Route>
        <Route element={<WorkspaceLayout variant="admin" />}>
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/messages" element={<InboxPage basePath="/admin/messages" scopeAll />} />
          <Route path="admin/messages/:threadId" element={<InboxPage basePath="/admin/messages" scopeAll />} />
          <Route path="admin/notifications" element={<AlertsPage />} />
          <Route path="admin/:section" element={<AdminPage />} />
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
        <Route element={<MarketplaceLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />
          <Route path="categories" element={<PlaceholderPage title="Categories" />} />
          <Route path="categories/:slug" element={<CategoryPage />} />
          <Route path="stores" element={<StoresPage />} />
          <Route path="stores/:slug" element={<StorefrontPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="deals" element={<PlaceholderPage title="Deals" />} />
          <Route path="new-arrivals" element={<PlaceholderPage title="New arrivals" />} />
          <Route path="best-sellers" element={<PlaceholderPage title="Best sellers" />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/:threadId" element={<MessagesPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="why-tombora" element={<WhyTomboraPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="help" element={<PlaceholderPage title="Help" />} />
          <Route path="about" element={<WhyTomboraPage />} />
          <Route path="contact" element={<PlaceholderPage title="Contact" />} />
          <Route path="terms" element={<PlaceholderPage title="Terms" />} />
          <Route path="privacy" element={<PlaceholderPage title="Privacy" />} />
          <Route path="returns" element={<PlaceholderPage title="Returns" />} />
          <Route path="sell" element={<SellPage />} />
          <Route path="sourcing-request" element={<SourcingRequestPage />} />
          <Route path="online-service" element={<OnlineServicePage />} />
          <Route path="app" element={<MobileAppPage />} />
          <Route path="image-search" element={<ImageSearchPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
