import React, { useState } from 'react';
import { ShoppingBag, ArrowLeft, ArrowRight, Trash2, Plus, Minus, Tag, ShieldCheck, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatProductImageUrl, handleImageError } from '../utils/imageUrl';

interface CartPageProps {
  onNavigate: (view: string) => void;
  onProceedToCheckout: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate, onProceedToCheckout }) => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    subtotal,
    shippingFee,
    discountAmount,
    total,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; success: boolean } | null>(null);

  const freeShippingThreshold = 999;
  const amountNeeded = Math.max(0, freeShippingThreshold - subtotal);
  const percent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const res = applyCoupon(couponCode);
    setCouponMessage({ text: res.message, success: res.success });
    if (res.success) setCouponCode('');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-[#F3EED9] text-[#1B4332] rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-[#1B4332] font-serif-marvi">
          Your Shopping Cart is Empty
        </h1>
        <p className="text-sm text-[#5E7264] max-w-sm mx-auto">
          You haven't added any home decor or everyday essentials yet. Explore our curated collections.
        </p>
        <button
          onClick={() => onNavigate('products')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B4332] text-white text-xs font-semibold rounded-xl hover:bg-[#143225] transition-all"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="border-b border-[#EAE3D2] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif-marvi">
            Shopping Cart
          </h1>
          <p className="text-xs text-[#5E7264] mt-1">
            Review your chosen home essentials before proceeding to checkout.
          </p>
        </div>
        <button
          onClick={() => onNavigate('products')}
          className="text-xs font-semibold text-[#1B4332] hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>
      </div>

      {/* Free Shipping Bar */}
      <div className="bg-[#F4EFE6] p-4 rounded-2xl border border-[#E5DCBE] space-y-2">
        <div className="flex justify-between text-xs font-medium text-[#2A3F30]">
          {amountNeeded === 0 ? (
            <span className="text-emerald-800 font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-700" />
              You've unlocked FREE Delivery across India!
            </span>
          ) : (
            <span>Add ₹{amountNeeded} more to get FREE Standard Delivery</span>
          )}
          <span className="font-mono tabular-nums">{percent}%</span>
        </div>
        <div className="w-full bg-[#DED6BF] h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#1B4332] h-full transition-all duration-300 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E1CF] shadow-2xs flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <img
                  src={formatProductImageUrl(product.imageUrls[0])}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => handleImageError(e, '/images/home_decor_brass_vase_1791727457022.jpg')}
                  className="w-20 h-20 object-cover rounded-xl bg-[#F4EFE6] shrink-0"
                />
                <div>
                  <span className="text-[11px] font-medium text-[#7D9082] uppercase tracking-wider block">
                    {product.category}
                  </span>
                  <h3 className="text-sm font-semibold text-[#1B4332]">{product.name}</h3>
                  <p className="text-xs text-[#5E7264] mt-0.5 font-mono tabular-nums">
                    ₹{product.price.toLocaleString('en-IN')} each
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#F2ECE0]">
                {/* Quantity Stepper */}
                <div className="flex items-center border border-[#D5CBB5] rounded-xl bg-[#FAF8F3]">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="p-1.5 text-[#445648] hover:text-[#1B4332] transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold font-mono tabular-nums text-[#1B4332]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    disabled={quantity >= product.stockQuantity}
                    className="p-1.5 text-[#445648] hover:text-[#1B4332] disabled:opacity-30 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtotal */}
                <span className="text-sm font-bold text-[#1B4332] font-mono tabular-nums w-24 text-right">
                  ₹{(product.price * quantity).toLocaleString('en-IN')}
                </span>

                {/* Remove */}
                <button
                  onClick={() => removeFromCart(product.id)}
                  className="p-2 text-[#98A99D] hover:text-red-700 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E8E1CF] shadow-2xs space-y-6">
          <h2 className="text-base font-bold text-[#1B4332] font-serif-marvi">
            Order Summary
          </h2>

          {/* Coupon */}
          <form onSubmit={handleApplyCoupon} className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-[#7E9083] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Coupon: MARVI100"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full text-xs pl-8 pr-2 py-2 rounded-xl border border-[#D5CBB5] bg-[#FAF8F3] uppercase focus:outline-hidden focus:border-[#1B4332]"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-[#F3EED9] hover:bg-[#E5DCBE] text-[#1B4332] font-semibold text-xs rounded-xl transition-colors"
              >
                Apply
              </button>
            </div>
            {couponMessage && (
              <p
                className={`text-xs ${
                  couponMessage.success ? 'text-emerald-800' : 'text-red-600'
                }`}
              >
                {couponMessage.text}
              </p>
            )}
            {appliedCoupon && (
              <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-200">
                <span>Code <strong>{appliedCoupon}</strong> active</span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="underline font-semibold"
                >
                  Remove
                </button>
              </div>
            )}
          </form>

          {/* Price Breakdown */}
          <div className="space-y-2 text-xs text-[#445648] pt-2 border-t border-[#F2ECE0]">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-mono tabular-nums">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Coupon Discount</span>
                <span className="font-mono tabular-nums">-₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Standard Shipping</span>
              <span className="font-mono tabular-nums">
                {shippingFee === 0 ? <strong className="text-emerald-800">FREE</strong> : `₹${shippingFee}`}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#1B4332] pt-3 border-t border-[#F2ECE0]">
              <span>Final Total</span>
              <span className="font-mono tabular-nums">₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={onProceedToCheckout}
            className="w-full py-3.5 bg-[#1B4332] hover:bg-[#143225] text-[#FAF7F0] font-semibold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
          </button>

          <div className="pt-2 text-[11px] text-[#6A7F70] space-y-1 text-center">
            <p className="flex items-center justify-center gap-1.5 font-medium text-[#1B4332]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              Safe & Verified Cash on Delivery
            </p>
            <p>Pay comfortably when your package arrives at your doorstep.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
