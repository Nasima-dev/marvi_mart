import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { SearchModal } from './components/SearchModal';
import { CartProvider } from './context/CartContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { WishlistPage } from './pages/WishlistPage';
import { StaticPages } from './pages/StaticPages';
import { AdminDashboard } from './pages/AdminDashboard';
import { Product, ProductCategory, Order } from './types';
import { api } from './services/api';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { formatProductImageUrl } from './utils/imageUrl';

function resolveViewFromLocation(): string {
  try {
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    if (hash) {
      if (hash === 'admin' || hash.startsWith('admin/')) return 'admin';
      return hash;
    }
    const path = window.location.pathname.replace(/^\//, '').trim();
    if (path === 'admin' || path.startsWith('admin/')) return 'admin';
    if (path === 'products') return 'products';
    if (path === 'cart') return 'cart';
    if (path === 'checkout') return 'checkout';
    if (path === 'track-order') return 'track-order';
    if (path === 'wishlist') return 'wishlist';
    if (['about', 'contact', 'shipping-policy', 'return-policy', 'privacy-policy', 'terms', 'cod-info', 'cod'].includes(path)) {
      return path;
    }
  } catch {
    // Graceful fallback for non-browser/SSR runtimes
  }
  return 'home';
}

export default function App() {
  const [currentView, setCurrentView] = useState<string>(() => resolveViewFromLocation());
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [trackRef, setTrackRef] = useState<string>('');

  // Synchronize browser history and URL popstate
  useEffect(() => {
    const handleLocationChange = () => {
      const view = resolveViewFromLocation();
      setCurrentView(view);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Load authoritative catalog from REST API
  useEffect(() => {
    api
      .getProducts({ limit: 100 })
      .then((data) => {
        if (data.products && data.products.length > 0) {
          const normalized = data.products.map((p) => ({
            ...p,
            imageUrls: (p.imageUrls || []).map((u) => formatProductImageUrl(u)),
          }));
          setProducts(normalized);
        }
      })
      .catch((err) => {
        console.warn('Using initial product dataset fallback:', err);
      });
  }, []);

  const navigate = (view: string, params?: any) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView(view);
    if (params?.reference) {
      setTrackRef(params.reference);
    }
    try {
      const targetPath = view === 'home' ? '/' : `/${view}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    } catch {
      window.location.hash = view === 'home' ? '' : view;
    }
  };

  const handleSelectProduct = (product: Product) => {
    const normalized = {
      ...product,
      imageUrls: (product.imageUrls || []).map((u) => formatProductImageUrl(u)),
    };
    setSelectedProduct(normalized);
    navigate('product-detail');
  };

  const handleSelectCategory = (category: ProductCategory | 'All') => {
    setSelectedCategory(category);
    navigate('products');
  };

  const handleSearchTrigger = (query: string) => {
    setSearchQuery(query);
    navigate('products');
  };

  const handleOrderSuccess = (order: Order) => {
    setConfirmedOrder(order);
    // Refresh product stock in state
    api.getProducts({ limit: 100 }).then((data) => setProducts(data.products));
    navigate('order-confirmed');
  };

  return (
    <AdminAuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-[#FBF8F3] text-[#1F2922]">
        {/* Header (hidden in admin mode for clean dedicated workspace) */}
        {currentView !== 'admin' && (
          <Header
            currentView={currentView}
            onNavigate={navigate}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1">
          {currentView === 'home' && (
            <HomePage
              products={products}
              onSelectProduct={handleSelectProduct}
              onNavigate={navigate}
              onSelectCategory={handleSelectCategory}
            />
          )}

          {currentView === 'products' && (
            <ProductsPage
              products={products}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              onSelectProduct={handleSelectProduct}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}

          {currentView === 'product-detail' && selectedProduct && (
            <ProductDetailPage
              product={selectedProduct}
              allProducts={products}
              onBack={() => navigate('products')}
              onSelectProduct={handleSelectProduct}
              onDirectCheckout={() => navigate('checkout')}
            />
          )}

          {currentView === 'cart' && (
            <CartPage
              onNavigate={navigate}
              onProceedToCheckout={() => navigate('checkout')}
            />
          )}

          {currentView === 'checkout' && (
            <CheckoutPage
              onBackToCart={() => navigate('cart')}
              onOrderSuccess={handleOrderSuccess}
            />
          )}

          {currentView === 'order-confirmed' && confirmedOrder && (
            <OrderConfirmationPage
              order={confirmedOrder}
              onNavigateHome={() => navigate('home')}
              onTrackOrder={(ref) => {
                setTrackRef(ref);
                navigate('track-order', { reference: ref });
              }}
            />
          )}

          {currentView === 'track-order' && (
            <TrackOrderPage
              initialReference={trackRef}
              onNavigateHome={() => navigate('home')}
            />
          )}

          {currentView === 'wishlist' && (
            <WishlistPage
              products={products}
              onSelectProduct={handleSelectProduct}
              onNavigateHome={() => navigate('home')}
            />
          )}

          {/* Static Policies & Company Pages */}
          {['about', 'contact', 'shipping-policy', 'return-policy', 'privacy-policy', 'terms', 'cod-info', 'cod'].includes(
            currentView
          ) && (
            <StaticPages
              pageType={
                currentView === 'shipping-policy'
                  ? 'shipping'
                  : currentView === 'return-policy'
                  ? 'returns'
                  : currentView === 'privacy-policy'
                  ? 'privacy'
                  : currentView === 'cod-info' || currentView === 'cod'
                  ? 'cod'
                  : (currentView as any)
              }
              onNavigateHome={() => navigate('home')}
            />
          )}

          {/* Admin Dashboard */}
          {currentView === 'admin' && (
            <AdminDashboard onExit={() => navigate('home')} />
          )}
        </main>

        {/* Footer (hidden in admin) */}
        {currentView !== 'admin' && (
          <Footer
            onNavigate={navigate}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {/* Global Cart Slide-Over Drawer */}
        <CartDrawer
          onProceedToCheckout={() => navigate('checkout')}
        />

        {/* Global Search Modal */}
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectProduct={handleSelectProduct}
          onViewAllResults={handleSearchTrigger}
        />
      </div>
    </CartProvider>
  </AdminAuthProvider>
);
}
