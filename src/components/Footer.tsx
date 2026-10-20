import React from 'react';
import { Home as HomeIcon, Shield, Truck, RotateCcw, HeartHandshake, Phone, Mail, MapPin, Lock, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ProductCategory } from '../types';

interface FooterProps {
  onNavigate: (view: string, params?: any) => void;
  onSelectCategory?: (category: ProductCategory | 'All') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onSelectCategory }) => {
  const { isAuthenticated, role } = useAdminAuth();
  return (
    <footer className="bg-[#142B21] text-[#E7E2D5] border-t border-[#234A38] mt-20">
      {/* Trust Badges Strip */}
      <div className="border-b border-[#234A38]/80 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1B4332] text-[#D4AF37] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Pan-India Delivery</p>
              <p className="text-xs text-[#9BB1A3]">Free express shipping over ₹999</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1B4332] text-[#D4AF37] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Cash on Delivery</p>
              <p className="text-xs text-[#9BB1A3]">Pay safely when order arrives</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1B4332] text-[#D4AF37] flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">7-Day Easy Returns</p>
              <p className="text-xs text-[#9BB1A3]">Hassle-free doorstep pickup</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1B4332] text-[#D4AF37] flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Artisan Crafted</p>
              <p className="text-xs text-[#9BB1A3]">Authentic Indian craftsmanship</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-[#142B21] flex items-center justify-center">
                <HomeIcon className="w-4 h-4 font-bold" />
              </div>
              <span className="text-xl font-bold font-serif-marvi text-white">
                Marvi Mart
              </span>
            </div>
            <p className="text-sm text-[#B4C5B9] italic">
              “Everyday Essentials, Beautifully Chosen.”
            </p>
            <p className="text-xs text-[#8BA493] max-w-sm leading-relaxed">
              Marvi Mart curates thoughtful home accessories, handcrafted brass decor, Sheesham kitchenware, and durable organization essentials designed for contemporary Indian living.
            </p>
            <div className="space-y-2 text-xs text-[#A1B8A8] pt-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                <span className="leading-relaxed">11MB/373 jagatpura jaipur rajasthan</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <a
                  href="mailto:qmarvi61@gmail.com"
                  className="hover:text-white hover:underline transition-colors"
                >
                  qmarvi61@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <a
                  href="tel:+919351153544"
                  className="hover:text-white hover:underline transition-colors"
                >
                  +91 9351153544
                </a>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-3">
              Collections
            </h4>
            <ul className="space-y-2 text-xs text-[#C5D5CA]">
              {([
                'Home Decor',
                'Kitchen Essentials',
                'Storage & Organization',
                'Bedroom Accessories',
                'Living Room Accessories',
                'Daily-Use Essentials',
                'Gifts & Lifestyle',
              ] as ProductCategory[]).map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => {
                      if (onSelectCategory) onSelectCategory(cat);
                      onNavigate('products');
                    }}
                    className="hover:text-white transition-colors"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-3">
              Customer Support
            </h4>
            <ul className="space-y-2 text-xs text-[#C5D5CA]">
              <li>
                <button onClick={() => onNavigate('track-order')} className="hover:text-white transition-colors">
                  Track Your Order
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shipping-policy')} className="hover:text-white transition-colors">
                  Shipping & Delivery
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('return-policy')} className="hover:text-white transition-colors">
                  Returns & Replacements
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">
                  Contact Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors">
                  About Marvi Mart
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Admin */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] mb-3">
              Store & Policies
            </h4>
            <ul className="space-y-2 text-xs text-[#C5D5CA]">
              <li>
                <button onClick={() => onNavigate('cod-info')} className="hover:text-white transition-colors">
                  Cash on Delivery (COD) Guide
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy-policy')} className="hover:text-white transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors">
                  Terms of Service
                </button>
              </li>
              {isAuthenticated && role === 'admin' && (
                <li>
                  <button
                    onClick={() => onNavigate('admin')}
                    className="text-[#D4AF37] hover:underline transition-colors flex items-center gap-1.5 mt-3 text-xs font-semibold"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Owner Admin Dashboard →</span>
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[#234A38] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8BA493] gap-4">
          <p>© {new Date().getFullYear()} Marvi Mart. All rights reserved. Indian Handcrafted Essentials.</p>
          <div className="flex items-center gap-4">
            <span>Prices inclusive of applicable GST</span>
            <span>·</span>
            <span>Safe & Secure Cash on Delivery</span>
            <span>·</span>
            <button
              onClick={() => onNavigate('admin')}
              className="text-[#6C8474] hover:text-[#D4AF37] transition-colors flex items-center gap-1 text-[11px]"
              title="Store Owner Portal Login"
            >
              <Lock className="w-3 h-3" />
              <span>Owner Portal</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
