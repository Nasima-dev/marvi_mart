import React from 'react';
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  MapPin, 
  Printer, 
  ArrowRight, 
  ShoppingBag,
  Clock,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { Order } from '../types';
import { formatProductImageUrl, handleImageError } from '../utils/imageUrl';

interface OrderConfirmationPageProps {
  order: Order;
  onNavigateHome: () => void;
  onTrackOrder: (reference: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  order,
  onNavigateHome,
  onTrackOrder,
}) => {
  const estimatedDate = new Date(order.createdAt);
  estimatedDate.setDate(estimatedDate.getDate() + 4);

  const formattedDelivery = estimatedDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8E1CF] shadow-xs text-center space-y-4">
        <div className="w-16 h-16 bg-[#1B4332] text-[#D4AF37] rounded-full flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold text-[#8A7642] uppercase tracking-wider">
            Thank you for shopping with Marvi Mart
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif-marvi">
            Your Order Has Been Confirmed!
          </h1>
          <p className="text-xs sm:text-sm text-[#5E7264] max-w-md mx-auto">
            We are preparing your handcrafted home essentials for dispatch. An SMS notification has been queued for your mobile number.
          </p>
        </div>

        {/* Order Reference Box */}
        <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-6 px-6 py-3 bg-[#FAF8F3] rounded-2xl border border-[#E2D8C3]">
          <div className="text-left">
            <span className="text-[10px] text-[#7A8E80] uppercase tracking-wider block font-semibold">
              Order Reference
            </span>
            <span className="text-base sm:text-lg font-bold text-[#1B4332] font-mono">
              {order.orderReference}
            </span>
          </div>
          <span className="hidden sm:inline text-[#D5CBB5]">|</span>
          <div className="text-left">
            <span className="text-[10px] text-[#7A8E80] uppercase tracking-wider block font-semibold">
              Estimated Delivery
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#1B4332]">
              {formattedDelivery}
            </span>
          </div>
          <span className="hidden sm:inline text-[#D5CBB5]">|</span>
          <div className="text-left">
            <span className="text-[10px] text-[#7A8E80] uppercase tracking-wider block font-semibold">
              Payment Method
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#1B4332]">
              {order.paymentMethod}
            </span>
          </div>
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E1CF] shadow-xs space-y-6">
        <h2 className="text-sm font-bold text-[#1B4332] uppercase tracking-wider">
          Order Status & Fulfillment Timeline
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          <div className="flex sm:flex-col items-center sm:text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1B4332] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1B4332]">Order Confirmed</p>
              <p className="text-[11px] text-[#6A7F70]">Logged in system</p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F3EED9] text-[#1B4332] flex items-center justify-center shrink-0 border border-[#DED4BA]">
              <Package className="w-5 h-5 text-[#1B4332]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1B4332]">Packaging</p>
              <p className="text-[11px] text-[#6A7F70]">Jaipur Craft Hub</p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F3EED9] text-[#8C9F92] flex items-center justify-center shrink-0 border border-[#DED4BA]">
              <Truck className="w-5 h-5 text-[#8C9F92]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#7E9184]">Express Transit</p>
              <p className="text-[11px] text-[#9BAEA1]">Pan-India courier</p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F3EED9] text-[#8C9F92] flex items-center justify-center shrink-0 border border-[#DED4BA]">
              <ShieldCheck className="w-5 h-5 text-[#8C9F92]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#7E9184]">Doorstep Delivery</p>
              <p className="text-[11px] text-[#9BAEA1]">Pay on arrival</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details & Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping Address Summary */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8E1CF] shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#D4AF37]" />
            Delivery Address
          </h3>
          <div className="text-xs text-[#445648] space-y-1">
            <p className="font-bold text-[#1B4332] text-sm">{order.customer.fullName}</p>
            <p>{order.customer.flatHouse}, {order.customer.streetArea}</p>
            {order.customer.landmark && <p>Landmark: {order.customer.landmark}</p>}
            <p>{order.customer.city}, {order.customer.state} - <strong>{order.customer.pincode}</strong></p>
            <p className="pt-1 flex items-center gap-1.5 text-[#65786A]">
              <Phone className="w-3.5 h-3.5" />
              +91 {order.customer.phone}
            </p>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8E1CF] shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider">
            Amount Breakdown
          </h3>
          <div className="space-y-1.5 text-xs text-[#445648]">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-mono tabular-nums">₹{order.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-mono tabular-nums">
                {order.shippingFee === 0 ? <strong className="text-emerald-800">FREE</strong> : `₹${order.shippingFee}`}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-800">
                <span>Discount</span>
                <span className="font-mono tabular-nums">-₹{order.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[#1B4332] pt-2 border-t border-[#F2ECE0] text-sm">
              <span>Total Payable</span>
              <span className="font-mono tabular-nums text-base">₹{order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Receipt Table */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E1CF] shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider">
          Ordered Items ({order.items.length})
        </h3>
        <div className="divide-y divide-[#F4EFE6]">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={formatProductImageUrl(item.image)}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => handleImageError(e, '/images/home_decor_brass_vase_1791727457022.jpg')}
                  className="w-12 h-12 rounded-lg object-cover bg-[#F5F1E8]"
                />
                <div>
                  <h4 className="text-xs font-semibold text-[#1B4332]">{item.name}</h4>
                  <p className="text-[11px] text-[#6A7F70]">Qty: {item.quantity}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#1B4332] font-mono tabular-nums">
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-[#FAF7F0] text-[#1B4332] border border-[#D5CBB5] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save Receipt</span>
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => onTrackOrder(order.orderReference)}
            className="w-full sm:w-auto px-5 py-3 bg-[#FAF8F3] hover:bg-[#EFE8D8] text-[#1B4332] border border-[#D5CBB5] rounded-xl text-xs font-semibold transition-colors"
          >
            Track Order Live
          </button>
          <button
            onClick={onNavigateHome}
            className="w-full sm:w-auto px-6 py-3 bg-[#1B4332] hover:bg-[#143225] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <span>Back to Store</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
