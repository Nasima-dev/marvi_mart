import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight, Home as HomeIcon } from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { formatProductImageUrl, handleImageError } from '../utils/imageUrl';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onViewAllResults: (query: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onViewAllResults,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.getProducts({ search: query, limit: 6 });
        setResults(data.products);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const popularSearches = ['Brass Vase', 'Spice Box', 'Jute Basket', 'Linen Cushion', 'Teak Coasters'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex justify-center items-start">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative bg-[#FAF7F0] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#E6DEC9] overflow-hidden z-10">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-[#EAE3D2] flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-[#1B4332]" />
          <input
            type="text"
            autoFocus
            placeholder="Search home decor, brass vases, spice boxes, organizers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm sm:text-base outline-hidden text-[#1B4332] placeholder:text-[#8FA194]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#8FA194] hover:text-[#1B4332]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold px-2.5 py-1 text-[#5E7264] hover:text-[#1B4332] rounded bg-[#F4EFE6]"
          >
            ESC
          </button>
        </div>

        {/* Quick Suggestion Pills if no query */}
        {!query && (
          <div className="p-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-[#667A6B] uppercase tracking-wider mb-2">
                Popular Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white text-[#2C3E30] border border-[#E0D7C3] hover:border-[#1B4332] transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {query && (
          <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto space-y-3">
            {loading ? (
              <div className="text-center py-8 text-xs text-[#6A7F70]">Searching catalog...</div>
            ) : results.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-sm font-medium text-[#1B4332]">No products found for "{query}"</p>
                <p className="text-xs text-[#6A7F70]">Try searching for "brass", "wood", "basket", or "decor"</p>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold text-[#667A6B] uppercase tracking-wider mb-2">
                  Matching Products ({results.length})
                </p>
                <div className="space-y-2">
                  {results.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        onSelectProduct(product);
                        onClose();
                      }}
                      className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-[#E8E1CF] hover:border-[#1B4332] cursor-pointer transition-all hover:shadow-2xs"
                    >
                      <img
                        src={formatProductImageUrl(product.imageUrls?.[0])}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => handleImageError(e, '/images/home_decor_brass_vase_1791727457022.jpg')}
                        className="w-14 h-14 object-cover rounded-lg bg-[#F5F1E8]"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-[#1B4332] truncate">
                          {product.name}
                        </h4>
                        <p className="text-[11px] text-[#6A7F70]">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#1B4332] font-mono tabular-nums">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#EAE3D2] text-center">
                  <button
                    onClick={() => {
                      onViewAllResults(query);
                      onClose();
                    }}
                    className="text-xs font-semibold text-[#1B4332] hover:underline inline-flex items-center gap-1"
                  >
                    <span>View all matching products</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
