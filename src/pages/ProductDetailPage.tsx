import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Heart, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Check, 
  Plus, 
  Minus, 
  Share2, 
  Info,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  X,
  Camera,
  Layers
} from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';
import { formatProductImageUrl, handleImageError } from '../utils/imageUrl';

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onDirectCheckout: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts,
  onBack,
  onSelectProduct,
  onDirectCheckout,
}) => {
  const { addToCart, isInWishlist, toggleWishlist } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);
  const [addedToast, setAddedToast] = useState(false);

  // Normalize imageUrls to production-safe public paths
  const rawImages = (product.imageUrls && product.imageUrls.length > 0)
    ? product.imageUrls
    : ['/images/home_decor_brass_vase_1791727457022.jpg'];
  const images = rawImages.map((img) => formatProductImageUrl(img));
  const safeIndex = selectedImage < images.length ? selectedImage : 0;
  const currentImageUrl = images[safeIndex];

  // Derive human-friendly view label for each image angle
  const getViewLabel = (url: string, index: number): string => {
    if (url.includes('_angle')) return 'Side Angle View';
    if (url.includes('_detail')) return 'Craft & Material Detail';
    if (url.includes('_context')) return 'In-Room Setting';
    switch (index) {
      case 0: return 'Front View';
      case 1: return 'Side Angle View';
      case 2: return 'Close-up Detail';
      case 3: return 'Setting / Context';
      default: return `Angle ${index + 1}`;
    }
  };

  const currentLabel = getViewLabel(currentImageUrl, safeIndex);

  // Keyboard navigation for gallery & lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
      } else if (e.key === 'ArrowRight') {
        setSelectedImage((prev) => (prev + 1) % images.length);
      } else if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
        setLightboxZoom(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, isLightboxOpen]);

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const inWish = isInWishlist(product.id);
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    onDirectCheckout();
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pincodeInput.replace(/\D/g, '');
    if (clean.length !== 6) {
      setPincodeStatus('Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    const days = 3 + (Number(clean.charAt(0)) % 3);
    const date = new Date();
    date.setDate(date.getDate() + days);
    const formatted = date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    setPincodeStatus(`Standard delivery to ${clean} by ${formatted} (Cash on Delivery Available)`);
  };

  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center justify-between text-xs text-[#6A7F70]">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 font-medium text-[#1B4332] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </button>
        <span className="hidden sm:inline">
          Home / {product.category} / <span className="text-[#1B4332] font-semibold">{product.name}</span>
        </span>
      </div>

      {/* Main Product Layout (Contiguous PDP) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Upgraded Multi-Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Large Product Frame */}
          <div 
            onClick={() => {
              setIsLightboxOpen(true);
              setLightboxZoom(1);
            }}
            className="group relative aspect-4/3 rounded-3xl overflow-hidden bg-[#F4EFE6] border border-[#E9E2D2] shadow-2xs cursor-zoom-in select-none"
            title="Click to zoom in or view in larger gallery"
          >
            <img
              src={currentImageUrl}
              alt={`${product.name} - ${currentLabel}`}
              referrerPolicy="no-referrer"
              onError={(e) => handleImageError(e, images[0] || '/images/home_decor_brass_vase_1791727457022.jpg')}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
            />

            {/* Save / Discount Badge */}
            {discountPercent && (
              <span className="absolute top-4 left-4 bg-[#1B4332] text-white text-xs font-bold px-3 py-1 rounded-md tracking-wider uppercase shadow-xs">
                Save {discountPercent}%
              </span>
            )}

            {/* Top Right Action Overlay (Zoom & Wishlist) */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLightboxOpen(true);
                  setLightboxZoom(1);
                }}
                className="p-2.5 rounded-full bg-white/90 hover:bg-white text-[#1B4332] shadow-xs backdrop-blur-xs transition-transform hover:scale-105 cursor-pointer"
                title="Click to view larger zoom gallery"
                aria-label="Zoom image"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(product.id);
                }}
                className={`p-2.5 rounded-full backdrop-blur-xs transition-colors cursor-pointer ${
                  inWish
                    ? 'bg-rose-50 text-rose-600 shadow-sm'
                    : 'bg-white/90 text-[#445648] hover:text-[#1B4332]'
                }`}
                aria-label="Wishlist toggle"
              >
                <Heart className={`w-5 h-5 ${inWish ? 'fill-current text-rose-600' : ''}`} />
              </button>
            </div>

            {/* Left & Right Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-[#1B4332] flex items-center justify-center shadow-md backdrop-blur-xs transition-all opacity-80 group-hover:opacity-100 hover:scale-110 cursor-pointer"
                  aria-label="Previous product image"
                  title="Previous image (Left arrow)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-[#1B4332] flex items-center justify-center shadow-md backdrop-blur-xs transition-all opacity-80 group-hover:opacity-100 hover:scale-110 cursor-pointer"
                  aria-label="Next product image"
                  title="Next image (Right arrow)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Bottom Floating View Badge & Counter */}
            <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B4332]/85 backdrop-blur-md text-[#F4EFE6] text-[11px] font-medium shadow-xs">
                <Camera className="w-3 h-3 text-[#D4AF37]" />
                <span>{currentLabel}</span>
              </span>

              {images.length > 1 && (
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-mono tracking-wider font-semibold">
                  {safeIndex + 1} / {images.length}
                </span>
              )}
            </div>
          </div>

          {/* Interactive Thumbnails Row (below main image) */}
          {images.length > 1 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#6A7F70] px-1">
                <span className="font-medium flex items-center gap-1 text-[#1B4332]">
                  <Layers className="w-3 h-3 text-[#D4AF37]" />
                  <span>360° Perspectives & Details ({images.length} views)</span>
                </span>
                <span className="hidden sm:inline text-[#8A9C8F]">
                  Click thumbnail or use arrows to switch
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                {images.map((img, idx) => {
                  const label = getViewLabel(img, idx);
                  const isSelected = safeIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(idx)}
                      className={`group relative rounded-2xl overflow-hidden border-2 p-0.5 transition-all text-left cursor-pointer bg-[#F8F5EE] ${
                        isSelected
                          ? 'border-[#1B4332] ring-2 ring-[#D4AF37] ring-offset-1 shadow-sm scale-102'
                          : 'border-[#E2D8C3] opacity-75 hover:opacity-100 hover:border-[#1B4332]/60'
                      }`}
                      title={label}
                    >
                      <div className="aspect-4/3 w-full rounded-xl overflow-hidden bg-[#FAF7F0]">
                        <img
                          src={img}
                          alt={label}
                          referrerPolicy="no-referrer"
                          onError={(e) => handleImageError(e, images[0] || '/images/home_decor_brass_vase_1791727457022.jpg')}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="p-1 sm:p-1.5 text-center">
                        <span className={`block text-[10px] sm:text-[11px] font-semibold truncate leading-tight ${
                          isSelected ? 'text-[#1B4332]' : 'text-[#5C7062]'
                        }`}>
                          {label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5 space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-[#E9E2D2] shadow-2xs">
          <div>
            <span className="text-xs font-semibold text-[#8A7642] uppercase tracking-wider block mb-1">
              {product.category}
            </span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1B4332] font-serif-marvi leading-snug">
              {product.name}
            </h1>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 pb-4 border-b border-[#F2ECE0]">
            <span className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-mono tabular-nums">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <>
                <span className="text-sm text-[#8A9C8F] line-through font-mono tabular-nums">
                  ₹{product.compareAtPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Save ₹{(product.compareAtPrice - product.price).toLocaleString('en-IN')}
                </span>
              </>
            )}
            <span className="text-[11px] text-[#788C7E] ml-auto">Inclusive of all taxes</span>
          </div>

          {/* Stock Availability */}
          <div className="flex items-center gap-2 text-xs">
            {isOutOfStock ? (
              <span className="text-red-600 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600" /> Currently Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="text-amber-800 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Only {product.stockQuantity} pieces remaining in Jaipur hub
              </span>
            ) : (
              <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" /> In Stock & Ready to Dispatch
              </span>
            )}
          </div>

          {/* Quantity Controls & Add to Cart */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-[#445648]">Quantity:</span>
              <div className="flex items-center border border-[#D5CBB5] rounded-xl bg-[#FAF8F3]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-2 text-[#445648] hover:text-[#1B4332] disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-xs font-bold font-mono tabular-nums text-[#1B4332]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  disabled={quantity >= product.stockQuantity || isOutOfStock}
                  className="p-2 text-[#445648] hover:text-[#1B4332] disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="py-3.5 px-4 bg-[#1B4332] hover:bg-[#143225] text-[#FAF7F0] font-semibold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-98"
              >
                <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                <span>Add to Bag</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="py-3.5 px-4 bg-[#D4AF37] hover:bg-[#C59B27] text-[#1B4332] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-98"
              >
                <span>Buy Now (COD)</span>
              </button>
            </div>
            {addedToast && (
              <p className="text-xs text-center text-emerald-800 font-semibold bg-emerald-50 py-1.5 rounded-lg border border-emerald-200">
                ✓ Added to your shopping bag!
              </p>
            )}
          </div>

          {/* Delivery PIN Code Checker */}
          <div className="pt-4 border-t border-[#F2ECE0] space-y-2">
            <span className="text-xs font-semibold text-[#1B4332] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> Check Delivery in Your City
            </span>
            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit PIN code (e.g. 560001)"
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value)}
                className="text-xs flex-1 px-3 py-2 rounded-xl border border-[#D5CBB5] bg-[#FAF8F3] focus:outline-hidden focus:border-[#1B4332]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-semibold bg-[#FAF8F3] hover:bg-[#EFE8D8] text-[#1B4332] border border-[#D5CBB5] rounded-xl transition-colors"
              >
                Check
              </button>
            </form>
            {pincodeStatus && (
              <p className="text-xs text-[#2A3F30] font-medium bg-[#F5EFE3] p-2 rounded-lg border border-[#E3D9C4]">
                {pincodeStatus}
              </p>
            )}
          </div>

          {/* Product Specifications */}
          <div className="pt-4 border-t border-[#F2ECE0] space-y-3 text-xs">
            <h4 className="font-semibold text-[#1B4332] uppercase tracking-wider text-[11px]">
              Craft & Material Details
            </h4>
            <div className="space-y-1.5 text-[#445648]">
              {product.material && (
                <div className="flex justify-between py-1 border-b border-[#F5EFE3]">
                  <span className="text-[#7A8E80]">Material</span>
                  <span className="font-medium text-[#1B4332] text-right">{product.material}</span>
                </div>
              )}
              {product.dimensions && (
                <div className="flex justify-between py-1 border-b border-[#F5EFE3]">
                  <span className="text-[#7A8E80]">Dimensions</span>
                  <span className="font-medium text-[#1B4332] text-right">{product.dimensions}</span>
                </div>
              )}
              {product.careInstructions && (
                <div className="flex justify-between py-1 border-b border-[#F5EFE3]">
                  <span className="text-[#7A8E80]">Care Guide</span>
                  <span className="font-medium text-[#1B4332] text-right">{product.careInstructions}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="pt-3 border-t border-[#F2ECE0] space-y-2">
            <h4 className="text-xs font-semibold text-[#1B4332] uppercase tracking-wider text-[11px]">
              About this item
            </h4>
            <p className="text-xs text-[#445648] leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-[#EAE3D2] space-y-6">
          <h3 className="text-xl font-bold text-[#1B4332] font-serif-marvi">
            You May Also Like in {product.category}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        </div>
      )}
      {/* Fullscreen Zoom & Multi-Angle Gallery Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-fadeIn select-none"
          onClick={() => {
            setIsLightboxOpen(false);
            setLightboxZoom(1);
          }}
        >
          {/* Top Bar: Title, View Label, Zoom Controls, Close */}
          <div 
            className="flex items-center justify-between text-white pb-3 border-b border-white/15 gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-[#D4AF37] tracking-wider uppercase block">
                {product.category} · {currentLabel}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white truncate font-serif-marvi">
                {product.name}
              </h3>
            </div>

            {/* Zoom & Action Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}
                disabled={lightboxZoom <= 1}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-colors cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono font-medium text-white/90 min-w-12 text-center">
                {Math.round(lightboxZoom * 100)}%
              </span>

              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                disabled={lightboxZoom >= 3}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-colors cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {lightboxZoom > 1 && (
                <button
                  type="button"
                  onClick={() => setLightboxZoom(1)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-mono text-white transition-colors cursor-pointer"
                  title="Reset Zoom (1:1)"
                >
                  Reset
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setLightboxZoom(1);
                }}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/30 text-white transition-colors cursor-pointer ml-2"
                title="Close Lightbox (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Central Main High-Res Canvas */}
          <div 
            className="relative flex-1 flex items-center justify-center overflow-auto my-2 p-2"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsLightboxOpen(false);
                setLightboxZoom(1);
              }
            }}
          >
            {/* Left Navigation Arrow */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-2 sm:left-4 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 shadow-xl transition-transform hover:scale-110 cursor-pointer"
                aria-label="Previous view"
                title="Previous view (Left arrow)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Zoomable Image Container */}
            <div 
              className="max-w-4xl max-h-[75vh] flex items-center justify-center transition-transform duration-200 ease-out"
              style={{ transform: `scale(${lightboxZoom})`, transformOrigin: 'center center' }}
              onClick={(e) => {
                e.stopPropagation();
                // Toggle zoom on click
                setLightboxZoom((z) => (z === 1 ? 1.75 : 1));
              }}
            >
              <img
                src={currentImageUrl}
                alt={`${product.name} - ${currentLabel}`}
                referrerPolicy="no-referrer"
                onError={(e) => handleImageError(e, images[0] || '/images/home_decor_brass_vase_1791727457022.jpg')}
                className={`max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl transition-all ${
                  lightboxZoom > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'
                }`}
              />
            </div>

            {/* Right Navigation Arrow */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-2 sm:right-4 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 shadow-xl transition-transform hover:scale-110 cursor-pointer"
                aria-label="Next view"
                title="Next view (Right arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Bar: Thumbnails & Keyboard Hint */}
          <div 
            className="pt-3 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
              {images.map((img, idx) => {
                const label = getViewLabel(img, idx);
                const isSelected = safeIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImage(idx);
                      setLightboxZoom(1);
                    }}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'border-[#D4AF37] ring-2 ring-white/60 scale-105'
                        : 'border-white/30 opacity-60 hover:opacity-100'
                    }`}
                    title={label}
                  >
                    <img
                      src={img}
                      alt={label}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e, images[0] || '/images/home_decor_brass_vase_1791727457022.jpg')}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center py-0.5 truncate px-0.5">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-white/60 flex items-center gap-3 shrink-0">
              <span className="font-mono text-white/80">
                {safeIndex + 1} of {images.length} views
              </span>
              <span className="hidden md:inline">
                • Use ← / → keys to switch · Esc to close · Click image to zoom
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
