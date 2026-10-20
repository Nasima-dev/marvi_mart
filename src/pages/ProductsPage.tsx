import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, RotateCcw, X } from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { ProductCard } from '../components/ProductCard';

interface ProductsPageProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (category: ProductCategory | 'All') => void;
  onSelectProduct: (product: Product) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const CATEGORIES: (ProductCategory | 'All')[] = [
  'All',
  'Home Decor',
  'Kitchen Essentials',
  'Storage & Organization',
  'Bedroom Accessories',
  'Living Room Accessories',
  'Daily-Use Essentials',
  'Gifts & Lifestyle',
];

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  onSelectProduct,
  searchQuery,
  onSearchChange,
}) => {
  const [sortOption, setSortOption] = useState<'newest' | 'price-low' | 'price-high' | 'name' | 'bestseller'>('newest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(5000);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (!p.isActive) return false;
        if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
        if (inStockOnly && p.stockQuantity <= 0) return false;
        if (p.price > maxPriceFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const match =
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'price-low') return a.price - b.price;
        if (sortOption === 'price-high') return b.price - a.price;
        if (sortOption === 'name') return a.name.localeCompare(b.name);
        if (sortOption === 'bestseller') return (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0);
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }, [products, selectedCategory, inStockOnly, maxPriceFilter, searchQuery, sortOption]);

  const resetFilters = () => {
    onSelectCategory('All');
    onSearchChange('');
    setInStockOnly(false);
    setMaxPriceFilter(5000);
    setSortOption('newest');
  };

  const hasActiveFilters =
    selectedCategory !== 'All' || inStockOnly || maxPriceFilter < 5000 || searchQuery.trim() !== '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Page Title */}
      <div className="border-b border-[#EAE3D2] pb-6 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif-marvi">
          {selectedCategory === 'All' ? 'All Collections' : selectedCategory}
        </h1>
        <p className="text-xs sm:text-sm text-[#5C7061]">
          Explore curated home accessories, kitchen essentials, and artisanal organizers crafted for daily Indian living.
        </p>
      </div>

      {/* Control Bar: Categories, Search, Filters, and Sorting */}
      <div className="space-y-4">
        {/* Category Segmented Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#1B4332] text-[#FAF7F0] shadow-xs'
                  : 'bg-white text-[#3C4E40] border border-[#E0D7C3] hover:border-[#1B4332]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-[#E8E1CF] shadow-2xs">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[#7A8E80] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, material, category..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-[#DDD3BD] focus:outline-hidden focus:border-[#1B4332] bg-[#FAF8F3]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A8E80] hover:text-[#1B4332]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* In-Stock Toggle */}
            <label className="flex items-center gap-2 text-xs text-[#3C4E40] font-medium cursor-pointer select-none bg-[#FAF8F3] px-3 py-2 rounded-xl border border-[#DDD3BD]">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-[#1B4332] focus:ring-[#1B4332] accent-[#1B4332]"
              />
              <span className="whitespace-nowrap">In Stock Only</span>
            </label>

            {/* Sort Select */}
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e: any) => setSortOption(e.target.value)}
                className="text-xs bg-[#FAF8F3] border border-[#DDD3BD] text-[#3C4E40] font-medium rounded-xl px-3 py-2 outline-hidden focus:border-[#1B4332] cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="bestseller">Trending Bestsellers</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="p-2 text-xs text-[#8A7642] hover:text-[#1B4332] hover:bg-[#F3EED9] rounded-xl transition-colors flex items-center gap-1"
                title="Reset all filters"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden md:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Count & Active Filter Tags */}
      <div className="flex items-center justify-between text-xs text-[#6A7F70]">
        <span>
          Showing <strong className="text-[#1B4332] font-mono">{filteredProducts.length}</strong> items
        </span>
        {searchQuery && (
          <span>
            Search results for "<strong>{searchQuery}</strong>"
          </span>
        )}
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[#E9E2D2] p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#F4EFE6] flex items-center justify-center text-[#7F9284] mx-auto">
            <Filter className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-[#1B4332]">No matching items found</h3>
          <p className="text-xs text-[#6A7F70] max-w-sm mx-auto">
            Try adjusting your search keywords, clearing your category filter, or switching off the in-stock restriction.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-[#1B4332] text-white text-xs font-semibold rounded-xl hover:bg-[#143225] transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
};
