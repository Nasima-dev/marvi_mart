import React from 'react';
import { Heart, ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';

interface WishlistPageProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigateHome: () => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  products,
  onSelectProduct,
  onNavigateHome,
}) => {
  const { wishlist } = useCart();
  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-[#EAE3D2] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif-marvi">
            Your Wishlist ({wishlistedProducts.length})
          </h1>
          <p className="text-xs text-[#5E7264] mt-1">
            Saved items you love. Add them to your bag anytime.
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="text-xs font-semibold text-[#1B4332] hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>
      </div>

      {wishlistedProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#E8E1CF] p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FAF7F0] flex items-center justify-center text-[#7F9284] mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-[#1B4332]">Your wishlist is empty</h3>
          <p className="text-xs text-[#6A7F70] max-w-sm mx-auto">
            Click the heart icon on any brass vase, wood organizer, or home essential to save it here for later.
          </p>
          <button
            onClick={onNavigateHome}
            className="px-5 py-2.5 bg-[#1B4332] text-white text-xs font-semibold rounded-xl hover:bg-[#143225] transition-colors"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {wishlistedProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
};
