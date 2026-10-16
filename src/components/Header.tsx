import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Heart, 
  Menu, 
  X, 
  ShieldCheck, 
  Truck, 
  PackageCheck,
  Home as HomeIcon,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ProductCategory } from '../types';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: ProductCategory | 'All') => void;
  onOpenSearch?: () => void;
}

const CATEGORIES: ProductCategory[] = [
  'Clothing',
  'Home Decor',
  'Kitchen Essentials',
  'Lighting',
  'Storage & Organization',
  'Bedroom Accessories',
  'Living Room Accessories',
  'Daily-Use Essentials',
  'Gifts & Lifestyle',
];

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  selectedCategory = 'All',
  onSelectCategory,
  onOpenSearch,
}) => {
  const { totalItemsCount, setIsCartDrawerOpen, wishlist } = useCart();
  const { isAuthenticated, role, logout } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#EAE3D2] transition-colors">
      {/* Top Announcement Bar */}
      <div className="bg-[#1B4332] text-[#F3EED9] text-xs font-medium py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-4">
        <span className="flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Free delivery across India on orders over ₹999</span>
        </span>
        <span className="hidden sm:inline text-[#84A98C]">·</span>
        <span className="hidden sm:flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Cash on Delivery available</span>
        </span>
      </div>

      {/* Main Top Bar (Three-Zone Architecture) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4 sm:gap-8">
          {/* Zone 1: Brand Wordmark with Home Symbol */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 text-left group"
              aria-label="Marvi Mart Home"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1B4332] flex items-center justify-center text-[#FAF7F0] shadow-sm group-hover:bg-[#143225] transition-all">
                <HomeIcon className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#1B4332] font-serif-marvi block leading-none">
                  Marvi Mart
                </span>
                <span className="text-[10px] text-[#65786A] tracking-wider uppercase font-medium mt-1 block">
                  Everyday Essentials
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Clean single-line prose) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#2C3E30]">
            <button
              onClick={() => onNavigate('home')}
              className={`hover:text-[#1B4332] transition-colors pb-1 border-b-2 whitespace-nowrap ${
                currentView === 'home'
                  ? 'border-[#1B4332] text-[#1B4332] font-semibold'
                  : 'border-transparent text-[#445648]'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('products')}
              className={`hover:text-[#1B4332] transition-colors pb-1 border-b-2 whitespace-nowrap ${
                currentView === 'products'
                  ? 'border-[#1B4332] text-[#1B4332] font-semibold'
                  : 'border-transparent text-[#445648]'
              }`}
            >
              All Products
            </button>
            <button
              onClick={() => onNavigate('track-order')}
              className={`hover:text-[#1B4332] transition-colors pb-1 border-b-2 whitespace-nowrap ${
                currentView === 'track-order'
                  ? 'border-[#1B4332] text-[#1B4332] font-semibold'
                  : 'border-transparent text-[#445648]'
              }`}
            >
              Track Order
            </button>
            <button
              onClick={() => onNavigate('about')}
              className={`hover:text-[#1B4332] transition-colors pb-1 border-b-2 whitespace-nowrap ${
                currentView === 'about'
                  ? 'border-[#1B4332] text-[#1B4332] font-semibold'
                  : 'border-transparent text-[#445648]'
              }`}
            >
              Our Story
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className={`hover:text-[#1B4332] transition-colors pb-1 border-b-2 whitespace-nowrap ${
                currentView === 'contact'
                  ? 'border-[#1B4332] text-[#1B4332] font-semibold'
                  : 'border-transparent text-[#445648]'
              }`}
            >
              Contact
            </button>
          </nav>

          {/* Zone 3: Interactive Affordances (Search, Wishlist, Cart, Admin) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="p-2 sm:px-3 sm:py-2 text-[#2C3E30] hover:text-[#1B4332] hover:bg-[#EFE8D8] rounded-lg transition-colors flex items-center gap-2 text-sm"
              title="Search products"
              aria-label="Search products"
            >
              <Search className="w-5 h-5 text-[#2C3E30]" />
              <span className="hidden md:inline text-xs text-[#65786A]">Search...</span>
            </button>

            {/* Wishlist */}
            <button
              onClick={() => onNavigate('wishlist')}
              className="p-2 text-[#2C3E30] hover:text-[#1B4332] hover:bg-[#EFE8D8] rounded-lg transition-colors relative"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#C59B27] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Bag Button */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="px-3.5 py-2 bg-[#1B4332] hover:bg-[#143225] text-[#FAF7F0] rounded-xl flex items-center gap-2.5 transition-all shadow-sm hover:shadow active:scale-95"
              aria-label={`Shopping Cart with ${totalItemsCount} items`}
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#D4AF37] text-[#1B4332] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {totalItemsCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold hidden sm:inline">Cart</span>
            </button>

            {/* Authenticated Admin Portal Shortcut - ONLY visible to verified owner/admin */}
            {isAuthenticated && role === 'admin' && (
              <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-[#E0D7C3]">
                <button
                  onClick={() => onNavigate('admin')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] bg-[#EAE3D2] hover:bg-[#D4AF37]/25 px-2.5 py-1.5 rounded-lg border border-[#D4AF37] transition-all shadow-xs"
                  title="Store Management Portal"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1B4332]" />
                  <span>Admin Portal</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    onNavigate('home');
                  }}
                  className="p-1.5 text-[#65786A] hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sign Out of Admin"
                  aria-label="Sign Out of Admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 lg:hidden text-[#2C3E30] hover:bg-[#EFE8D8] rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Category Horizontal Quick Strip */}
        <div className="py-2.5 border-t border-[#EAE3D2] overflow-x-auto scrollbar-none flex items-center gap-2 sm:gap-3 text-xs">
          <button
            onClick={() => {
              if (onSelectCategory) onSelectCategory('All');
              onNavigate('products');
            }}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'All'
                ? 'bg-[#1B4332] text-[#FAF7F0] shadow-xs'
                : 'bg-white/80 text-[#3B4D3F] border border-[#E2D9C5] hover:bg-[#EFE8D8]'
            }`}
          >
            All Collections
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                if (onSelectCategory) onSelectCategory(cat);
                onNavigate('products');
              }}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#1B4332] text-[#FAF7F0] shadow-xs'
                  : 'bg-white/80 text-[#3B4D3F] border border-[#E2D9C5] hover:bg-[#EFE8D8]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E0D7C3] bg-[#FAF7F0] px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#E0D7C3]">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-sm font-medium rounded-lg text-[#1B4332] hover:bg-[#EFE8D8]"
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigate('products');
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-sm font-medium rounded-lg text-[#1B4332] hover:bg-[#EFE8D8]"
            >
              All Products
            </button>
            <button
              onClick={() => {
                onNavigate('track-order');
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-sm font-medium rounded-lg text-[#1B4332] hover:bg-[#EFE8D8]"
            >
              Track Order
            </button>
            <button
              onClick={() => {
                onNavigate('about');
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-sm font-medium rounded-lg text-[#1B4332] hover:bg-[#EFE8D8]"
            >
              Our Story
            </button>
            <button
              onClick={() => {
                onNavigate('contact');
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-sm font-medium rounded-lg text-[#1B4332] hover:bg-[#EFE8D8]"
            >
              Contact
            </button>
          </div>

          {/* Authenticated Owner Mobile Bar - ONLY visible when admin is authenticated */}
          {isAuthenticated && role === 'admin' && (
            <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-center justify-between shadow-xs">
              <button
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 text-xs font-bold text-[#1B4332]"
              >
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>Admin Dashboard (Active)</span>
              </button>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  onNavigate('home');
                }}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          <div className="pt-1">
            <span className="text-[11px] font-semibold text-[#65786A] uppercase tracking-wider block mb-2">
              Browse Categories
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    if (onSelectCategory) onSelectCategory(cat);
                    onNavigate('products');
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs px-2.5 py-1 rounded bg-white text-[#2C3E30] border border-[#E0D7C3]"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
