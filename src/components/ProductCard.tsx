import React from 'react';
import { ShoppingBag, Heart, Eye, Check } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

import { formatProductImageUrl, handleImageError } from '../utils/imageUrl';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart, isInWishlist, toggleWishlist } = useCart();
  const inWish = isInWishlist(product.id);
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  return (
    <div className="group bg-white rounded-2xl border border-[#E9E2D2] overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col h-full">
      {/* Product Image Frame */}
      <div className="relative aspect-4/3 bg-[#F6F2E9] overflow-hidden cursor-pointer" onClick={() => onSelect(product)}>
        <img
          src={formatProductImageUrl(product.imageUrls?.[0])}
          alt={product.name}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={(e) => handleImageError(e, '/images/home_decor_brass_vase_1791727457022.jpg')}
          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500 ease-out"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {discountPercent && (
            <span className="bg-[#1B4332] text-[#F9F6EE] text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase">
              Save {discountPercent}%
            </span>
          )}
          {product.bestseller && (
            <span className="bg-[#D4AF37] text-[#1B4332] text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase">
              Bestseller
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-xs transition-all ${
            inWish
              ? 'bg-rose-50 text-rose-600 shadow-xs'
              : 'bg-white/80 text-[#445648] hover:bg-white hover:text-[#1B4332]'
          }`}
          aria-label={inWish ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${inWish ? 'fill-current text-rose-600' : ''}`} />
        </button>

        {/* Quick View Overlay Button on Hover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="w-full py-2 bg-white/95 text-[#1B4332] text-xs font-semibold rounded-lg shadow-sm hover:bg-white flex items-center justify-center gap-1.5 backdrop-blur-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            Quick View
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Stock Metadata */}
          <div className="flex items-center justify-between text-xs text-[#6A7F70] mb-1">
            <span>{product.category}</span>
            {isOutOfStock ? (
              <span className="text-red-600 font-medium text-[11px]">Out of Stock</span>
            ) : isLowStock ? (
              <span className="text-amber-700 font-medium text-[11px]">Only {product.stockQuantity} left</span>
            ) : (
              <span className="text-emerald-700 text-[11px]">In Stock</span>
            )}
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelect(product)}
            className="text-sm font-semibold text-[#1B4332] line-clamp-2 hover:text-[#2D6A4F] cursor-pointer transition-colors"
          >
            {product.name}
          </h3>
        </div>

        {/* Price & Add to Cart Action */}
        <div className="mt-4 pt-3 border-t border-[#F2ECE0] flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-[#1B4332] font-mono tabular-nums">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-[#8A9C8F] line-through font-mono tabular-nums">
                ₹{product.compareAtPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            disabled={isOutOfStock}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 ${
              isOutOfStock
                ? 'bg-[#EAE4D7] text-[#91A296] cursor-not-allowed'
                : 'bg-[#1B4332] text-[#FAF7F0] hover:bg-[#143225] shadow-2xs'
            }`}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden xs:inline">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
