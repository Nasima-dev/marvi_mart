import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Truck, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Lock,
  CreditCard,
  Banknote,
  Building,
  Info
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { CustomerAddress, Order } from '../types';
import { api } from '../services/api';
import { formatProductImageUrl, handleImageError } from '../utils/imageUrl';

interface CheckoutPageProps {
  onBackToCart: () => void;
  onOrderSuccess: (order: Order) => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi (NCT)',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Chandigarh',
  'Jammu & Kashmir',
];

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBackToCart, onOrderSuccess }) => {
  const { items, subtotal, shippingFee, discountAmount, total, appliedCoupon, clearCart } = useCart();

  const [formData, setFormData] = useState<CustomerAddress>({
    fullName: '',
    phone: '',
    email: '',
    flatHouse: '',
    streetArea: '',
    landmark: '',
    city: '',
    state: 'Rajasthan',
    pincode: '',
    addressType: 'Home',
  });

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cod' | 'phonepe'>('cod');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInputChange = (field: keyof CustomerAddress, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMessage(null);
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return false;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      return false;
    }

    if (formData.email && formData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        setErrorMessage('Please enter a valid email address or leave it blank.');
        return false;
      }
    }

    if (!formData.flatHouse.trim()) {
      setErrorMessage('Please enter your House / Flat / Apartment details.');
      return false;
    }

    if (!formData.streetArea.trim()) {
      setErrorMessage('Please enter your Street / Area / Locality.');
      return false;
    }

    if (!formData.city.trim()) {
      setErrorMessage('Please enter your City / District.');
      return false;
    }

    const cleanPin = formData.pincode.replace(/\D/g, '');
    if (!/^[1-9]\d{5}$/.test(cleanPin)) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN code (cannot start with 0).');
      return false;
    }

    return true;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!validateForm()) return;
    if (items.length === 0) {
      setErrorMessage('Your cart is empty. Please add items before checking out.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const cleanPhone = formData.phone.replace(/\D/g, '');
    const cleanPin = formData.pincode.replace(/\D/g, '');

    try {
      const orderPayload = {
        customer: {
          ...formData,
          fullName: formData.fullName.trim(),
          phone: cleanPhone,
          email: formData.email?.trim() || undefined,
          flatHouse: formData.flatHouse.trim(),
          streetArea: formData.streetArea.trim(),
          landmark: formData.landmark?.trim() || undefined,
          city: formData.city.trim(),
          state: formData.state,
          pincode: cleanPin,
          addressType: formData.addressType,
        },
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        couponCode: appliedCoupon || undefined,
        paymentMethod: 'Cash on Delivery' as const,
      };

      const response = await api.createOrder(orderPayload);
      if (response.success && response.order) {
        clearCart();
        onOrderSuccess(response.order);
      } else {
        setErrorMessage(response.message || 'Failed to place order.');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Security Note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAE3D2] gap-2">
        <button
          onClick={onBackToCart}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Cart</span>
        </button>
        <div className="flex items-center gap-2 text-xs text-[#526657]">
          <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>256-Bit SSL Encrypted & Verified Checkout</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Customer & Address Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E1CF] shadow-2xs space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1B4332] font-serif-marvi">
              Delivery Address & Details
            </h1>
            <p className="text-xs text-[#5E7264] mt-1">
              Please enter your accurate contact and doorstep delivery address in India.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmitOrder} className="space-y-4">
            {/* Contact Details */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider">
                1. Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#3A4E3E] mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D5CBB5] bg-[#FAF8F3] focus:outline-hidden focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#3A4E3E] mb-1">
                    Mobile Number (+91) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#667A6B]">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
                      className="w-full text-xs pl-12 pr-3 py-2.5 rounded-xl border border-[#D5CBB5] bg-[#FAF8F3] focus:outline-hidden focus:border-[#1B4332]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3A4E3E] mb-1">
                  Email Address <span className="text-[#849788] font-normal">(Optional, for tracking updates)</span>
                </label>
                <input
                  type="email"
                  placeholder="priya@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D5CBB5] bg-[#FAF8F3] focus:outline-hidden focus:border-[#1B4332]"
                />
              </div>
            </div>

            {/* Address Details */}
            <div className="space-y-3 pt-4 border-t border-[#F2ECE0]">
              <h2 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider">
                2. Shipping Address
              </h2>

              <div>
                <label className="block text-xs font-medium text-[#3A4E3E] mb-1">
                  Flat, House No., Building, Apartment <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 302, Royal Palms Apartments"
                  value={formData.flatHouse}
                  onChange={(e) => handleInputChange('flatHouse', e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D5CBB5] bg-[#FAF8F3] focus:outline-hidden focus:border-[#1B4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3A4E3E] mb-1">
                  Area, Colony, Street, Sector <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 14th Main, Indiranagar"
                  value={formData.streetArea}
                  onChange={(e) => handleInputChange('streetArea', e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D5CBB5] bg-[#FAF8F3] focus:outline-hidden focus:border-[#1B4332]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#3A4E3E] mb-1">
                    PIN Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 560038"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value.replace(/\D/g, ''))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D5CBB5] bg-[#FAF8F3] focus:outline-hidden focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#3A4E3E] mb-1">
                    City / District <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bengaluru"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D5CBB5] bg-[#FAF8F3] focus:outline-hidden focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#3A4E3E] mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#D5CBB5] bg-[#FAF8F3] focus:outline-hidden focus:border-[#1B4332] cursor-pointer"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3A4E3E] mb-1">
                  Landmark <span className="text-[#849788] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Metro Station / Behind Central Bank"
                  value={formData.landmark}
                  onChange={(e) => handleInputChange('landmark', e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D5CBB5] bg-[#FAF8F3] focus:outline-hidden focus:border-[#1B4332]"
                />
              </div>

              {/* Address Type */}
              <div className="pt-2">
                <span className="block text-xs font-medium text-[#3A4E3E] mb-2">Address Type:</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="addrType"
                      checked={formData.addressType === 'Home'}
                      onChange={() => handleInputChange('addressType', 'Home')}
                      className="accent-[#1B4332]"
                    />
                    <span>Home (All day delivery)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="addrType"
                      checked={formData.addressType === 'Office'}
                      onChange={() => handleInputChange('addressType', 'Office')}
                      className="accent-[#1B4332]"
                    />
                    <span>Office (10 AM - 6 PM)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Payment Method Section (Modular PhonePe Architecture) */}
            <div className="space-y-3 pt-4 border-t border-[#F2ECE0]">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider">
                  3. Select Payment Method
                </h2>
                <span className="text-[11px] text-[#5A6F60]">
                  Payable: <strong className="text-[#1B4332] font-mono">₹{total.toLocaleString('en-IN')}</strong>
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Cash on Delivery (Active & Supported) */}
                <div
                  onClick={() => setSelectedPaymentMethod('cod')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedPaymentMethod === 'cod'
                      ? 'border-[#1B4332] bg-[#FAF8F3] ring-1 ring-[#1B4332] shadow-2xs'
                      : 'border-[#E0D7C3] bg-white hover:border-[#1B4332]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={selectedPaymentMethod === 'cod'}
                        onChange={() => setSelectedPaymentMethod('cod')}
                        className="accent-[#1B4332] mt-0.5 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[#1B4332] flex items-center gap-1.5">
                            <Banknote className="w-4 h-4 text-[#D4AF37]" />
                            Cash on Delivery (COD)
                          </p>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                            Active & Recommended
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5A6F60] mt-1 leading-normal">
                          Pay in cash or scan the courier delivery agent’s official UPI QR code at your doorstep upon arrival.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Online Payment (PhonePe Gateway Integration - Coming Soon) */}
                <div
                  className="p-4 rounded-2xl border border-dashed border-[#D5CBB5] bg-[#FAF9F6] opacity-90 cursor-not-allowed select-none"
                  title="PhonePe Payment Gateway architecture is configured on the backend. This payment method will activate once merchant credentials are confirmed."
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        disabled
                        checked={false}
                        className="mt-0.5 cursor-not-allowed opacity-40"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-[#526657] flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-[#8C9F92]" />
                            Online Payment (UPI, Cards, NetBanking via PhonePe)
                          </p>
                          <span className="text-[10px] font-semibold text-[#8A7642] bg-[#F7F2E7] px-2 py-0.5 rounded border border-[#E4D9C5] uppercase">
                            Coming Soon
                          </span>
                        </div>
                        <p className="text-[11px] text-[#76897C] mt-1 leading-normal">
                          PhonePe Payment Gateway module is connected on the backend. Live online transactions will be activated once merchant credentials are verified. Please complete this order via Cash on Delivery.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Method Clear Review Notice */}
            <div className="p-3 bg-[#FAF8F3] rounded-xl border border-[#E7DFCD] flex items-center justify-between text-xs text-[#3E5242]">
              <span className="flex items-center gap-1.5 font-medium">
                <Banknote className="w-3.5 h-3.5 text-[#D4AF37]" />
                Selected Method: <strong>Cash on Delivery (COD)</strong>
              </span>
              <span className="font-mono font-bold text-[#1B4332]">
                ₹{total.toLocaleString('en-IN')} Payable
              </span>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#1B4332] hover:bg-[#143225] text-[#FAF7F0] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-98"
              >
                {submitting ? (
                  <span>Securing & Placing Order...</span>
                ) : (
                  <>
                    <span>Confirm Order (Cash on Delivery · ₹{total.toLocaleString('en-IN')})</span>
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-[#6A7F70] mt-2">
                By placing your order, you agree to Marvi Mart's Terms and 7-Day Return Policy.
              </p>
            </div>
          </form>
        </div>

        {/* Right: Order Summary Breakdown */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#E8E1CF] shadow-2xs space-y-5">
          <h2 className="text-base font-bold text-[#1B4332] font-serif-marvi">
            Order Review ({items.reduce((s, i) => s + i.quantity, 0)} Items)
          </h2>

          {/* Items mini list */}
          <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center gap-3 py-2 border-b border-[#F4EFE6]">
                <img
                  src={formatProductImageUrl(product.imageUrls?.[0])}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => handleImageError(e, '/images/home_decor_brass_vase_1791727457022.jpg')}
                  className="w-12 h-12 rounded-lg object-cover bg-[#F5F1E8] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-[#1B4332] truncate">{product.name}</h4>
                  <p className="text-[11px] text-[#6A7F70]">Qty: {quantity}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#1B4332] font-mono tabular-nums">
                    ₹{(product.price * quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="space-y-2 text-xs text-[#445648] pt-2 border-t border-[#F2ECE0]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-800 font-medium">
                <span>Promotional Discount</span>
                <span className="font-mono tabular-nums">-₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-mono tabular-nums">
                {shippingFee === 0 ? <strong className="text-emerald-800">FREE</strong> : `₹${shippingFee}`}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#1B4332] pt-3 border-t border-[#F2ECE0]">
              <span>Payable on Delivery</span>
              <span className="font-mono tabular-nums text-lg">₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="p-3.5 bg-[#FAF7F0] rounded-2xl border border-[#E9E2D2] space-y-1.5 text-xs text-[#526657]">
            <p className="font-semibold text-[#1B4332] flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
              Estimated Delivery: 3 to 5 Days
            </p>
            <p className="text-[11px] text-[#6A7F70]">
              Orders are packaged in double-reinforced corrugated boxes to guarantee safe transit of brass & ceramic decor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
