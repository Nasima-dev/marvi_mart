import React, { useState, useEffect } from 'react';
import { Search, Package, CheckCircle2, Clock, Truck, ShieldCheck, MapPin, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { formatProductImageUrl, handleImageError } from '../utils/imageUrl';

interface TrackOrderPageProps {
  initialReference?: string;
  onNavigateHome: () => void;
}

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({
  initialReference = '',
  onNavigateHome,
}) => {
  const [reference, setReference] = useState(initialReference);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialReference) {
      handleLookup(initialReference);
    }
  }, [initialReference]);

  const handleLookup = async (refToSearch: string) => {
    const cleanRef = refToSearch.trim().toUpperCase();
    if (!cleanRef) {
      setError('Please enter a valid Marvi Mart order reference.');
      return;
    }

    setLoading(true);
    setError(null);
    setOrderData(null);

    try {
      const data = await api.trackOrder(cleanRef);
      setOrderData(data);
    } catch (err: any) {
      setError(err.message || 'No order found with reference: ' + cleanRef);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup(reference);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Search Header */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif-marvi">
          Track Your Delivery
        </h1>
        <p className="text-xs sm:text-sm text-[#5E7264] max-w-md mx-auto">
          Enter your unique order reference (e.g., MM-2026-XXXXX) to view live fulfillment updates.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-2 pt-2">
          <div className="relative flex-1">
            <Package className="w-4 h-4 text-[#7A8E80] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. MM-2026-10482"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full text-xs sm:text-sm pl-9 pr-3 py-3 rounded-xl border border-[#D5CBB5] bg-white focus:outline-hidden focus:border-[#1B4332] uppercase font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 bg-[#1B4332] hover:bg-[#143225] text-[#FAF7F0] font-semibold text-xs rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? 'Tracking...' : 'Track'}
          </button>
        </form>
      </div>

      {error && (
        <div className="max-w-md mx-auto p-4 bg-red-50 text-red-800 rounded-2xl border border-red-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Display */}
      {orderData && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E1CF] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F2ECE0]">
            <div>
              <span className="text-[11px] font-semibold text-[#8A7642] uppercase tracking-wider block">
                Order Tracking
              </span>
              <h2 className="text-lg font-bold text-[#1B4332] font-mono">
                {orderData.orderReference}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                Status: {orderData.orderStatus}
              </span>
              <span className="text-xs font-semibold px-3 py-1 bg-[#FAF7F0] text-[#1B4332] rounded-full border border-[#E2D8C3]">
                {orderData.paymentMethod}
              </span>
            </div>
          </div>

          {/* Delivery Destination */}
          <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E8DFC9] flex items-center gap-3 text-xs text-[#445648]">
            <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <div>
              <span className="font-semibold text-[#1B4332]">Shipping Destination: </span>
              <span>{orderData.customerCity}, {orderData.customerState} ({orderData.pincode})</span>
            </div>
          </div>

          {/* Status History Logs */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider">
              Status Timeline
            </h3>
            <div className="space-y-2">
              {orderData.statusHistory?.map((entry: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF9F5] border border-[#EFE8D8]">
                  <CheckCircle2 className="w-4 h-4 text-[#1B4332] shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-[#1B4332]">{entry.status}</strong>
                      <span className="text-[11px] text-[#788C7E]">
                        {new Date(entry.timestamp).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {entry.note && <p className="text-[#5A6E60] mt-0.5">{entry.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items summary */}
          <div className="pt-4 border-t border-[#F2ECE0] space-y-3">
            <h3 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider">
              Items in Parcel
            </h3>
            <div className="divide-y divide-[#F4EFE6]">
              {orderData.items?.map((item: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={formatProductImageUrl(item.image)}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e, '/images/home_decor_brass_vase_1791727457022.jpg')}
                      className="w-10 h-10 rounded-lg object-cover bg-[#F5F1E8]"
                    />
                    <div>
                      <p className="font-semibold text-[#1B4332]">{item.name}</p>
                      <p className="text-[11px] text-[#7A8E80]">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#1B4332] font-mono">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
