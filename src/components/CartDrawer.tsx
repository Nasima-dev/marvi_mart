import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Check, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatProductImageUrl, handleImageError } from '../utils/imageUrl';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    items,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
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

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  if (!isCartDrawerOpen) return null;

  const freeShippingThreshold = 999;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput);
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponError(null);
      setCouponInput('');
    } else {
      setCouponError(res.message);
      setCouponSuccess(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF7F0] flex flex-col shadow-2xl border-l border-[#E6DEC9]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#EAE3D2] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-[#1B4332]" />
              <h3 className="font-semibold text-[#1B4332] text-base">
                Your Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)})
              </h3>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-1.5 text-[#55695C] hover:text-[#1B4332] rounded-lg hover:bg-[#F3EED9] transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          <div className="bg-[#F4EFE6] px-5 py-3 border-b border-[#E5DCBE]">
            <div className="flex justify-between text-xs text-[#2A3F30] font-medium mb-1.5">
              {amountNeededForFreeShipping === 0 ? (
                <span className="text-[#1B4332] font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-[#1B4332]" /> You've unlocked FREE Shipping!
                </span>
              ) : (
                <span>Add ₹{amountNeededForFreeShipping} more for FREE shipping</span>
              )}
              <span className="font-mono tabular-nums">{progressPercent}%</span>
            </div>
            <div className="w-full bg-[#DFD6BF] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#1B4332] h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#EFE8D8] flex items-center justify-center text-[#788C7E]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-medium text-[#1B4332]">Your bag is currently empty</h4>
                <p className="text-xs text-[#6A7F70] max-w-xs mx-auto">
                  Explore our handcrafted home decor, brass vases, and wooden kitchen essentials.
                </p>
                <button
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-[#1B4332] text-white rounded-lg hover:bg-[#143225] transition-colors"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-3.5 p-3 bg-white rounded-xl border border-[#E7DFCD] shadow-xs"
                >
                  <img
                    src={formatProductImageUrl(product.imageUrls[0])}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImageError(e, '/images/home_decor_brass_vase_1791727457022.jpg')}
                    className="w-20 h-20 object-cover rounded-lg bg-[#F5F1E8] shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-[#1B4332] line-clamp-1">
                          {product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="text-[#96A89B] hover:text-red-700 p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-[#6A7F70] mt-0.5">{product.category}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F2ECE0]">
                      <div className="flex items-center border border-[#D5CBB5] rounded-md bg-[#FAF7F0]">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="p-1 text-[#455A4C] hover:text-[#1B4332] hover:bg-[#EFE8D8] rounded-l-md transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold font-mono tabular-nums text-[#1B4332]">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          disabled={quantity >= product.stockQuantity}
                          className="p-1 text-[#455A4C] hover:text-[#1B4332] hover:bg-[#EFE8D8] rounded-r-md transition-colors disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-[#1B4332] font-mono tabular-nums">
                          ₹{(product.price * quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#EAE3D2] bg-white space-y-3">
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8E9F92]" />
                    <input
                      type="text"
                      placeholder="Coupon: MARVI100 or WELCOME50"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full text-xs pl-8 pr-2 py-2 rounded-lg border border-[#D8CDB6] focus:outline-hidden focus:border-[#1B4332] uppercase bg-[#FBF9F4]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-2 bg-[#F3EED9] hover:bg-[#E5DCBE] text-[#1B4332] text-xs font-semibold rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[11px] text-red-600">{couponError}</p>}
                {couponSuccess && <p className="text-[11px] text-emerald-700">{couponSuccess}</p>}
                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 px-2 py-1 rounded border border-emerald-200">
                    <span>Code {appliedCoupon} active</span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs text-emerald-900 underline font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </form>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-[#445648] pt-2 border-t border-[#F2ECE0]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span className="font-mono tabular-nums">-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="font-mono tabular-nums">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-700 font-semibold">FREE</span>
                    ) : (
                      `₹${shippingFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#1B4332] pt-2 border-t border-[#F2ECE0]">
                  <span>Total Amount</span>
                  <span className="font-mono tabular-nums text-base">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  onProceedToCheckout();
                }}
                className="w-full py-3 bg-[#1B4332] hover:bg-[#143225] text-[#FAF7F0] font-semibold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-center text-[#7A8E80]">
                Cash on Delivery supported across India
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
