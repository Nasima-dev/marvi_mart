import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

interface StaticPagesProps {
  pageType: 'about' | 'contact' | 'shipping' | 'returns' | 'privacy' | 'terms' | 'cod';
  onNavigateHome: () => void;
}

export const StaticPages: React.FC<StaticPagesProps> = ({ pageType, onNavigateHome }) => {
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setContactForm({ name: '', phone: '', subject: '', message: '' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Contact Page */}
      {pageType === 'contact' && (
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif-marvi">
              Contact Marvi Mart Care
            </h1>
            <p className="text-xs sm:text-sm text-[#5E7264] max-w-md mx-auto">
              Have questions regarding handcrafted decor, bulk gifting, or delivery timelines? Our team is here to assist you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E8E1CF] shadow-xs text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#FAF7F0] text-[#1B4332] flex items-center justify-center mx-auto">
                <Phone className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <h3 className="font-semibold text-xs text-[#1B4332]">Call / WhatsApp Support</h3>
              <a href="tel:+919351153544" className="text-xs text-[#5E7264] hover:text-[#1B4332] block font-medium">+91 9351153544</a>
              <p className="text-[11px] text-[#7C9082]">Mon - Sat: 10:00 AM - 7:00 PM IST</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E1CF] shadow-xs text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#FAF7F0] text-[#1B4332] flex items-center justify-center mx-auto">
                <Mail className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <h3 className="font-semibold text-xs text-[#1B4332]">Email Enquiries</h3>
              <a href="mailto:qmarvi61@gmail.com" className="text-xs text-[#5E7264] hover:text-[#1B4332] block font-medium">qmarvi61@gmail.com</a>
              <p className="text-[11px] text-[#7C9082]">Official Store Support Inbox</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E1CF] shadow-xs text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#FAF7F0] text-[#1B4332] flex items-center justify-center mx-auto">
                <MapPin className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <h3 className="font-semibold text-xs text-[#1B4332]">Store Operational Location</h3>
              <p className="text-xs text-[#5E7264]">11MB/373 jagatpura jaipur rajasthan</p>
              <p className="text-[11px] text-[#7C9082]">Pan-India Express Logistics</p>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E1CF] shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#1B4332] font-serif-marvi">
              Send us a Message
            </h2>

            {contactSubmitted ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <p className="font-bold">Message Received</p>
                  <p>Thank you for reaching out. A Marvi Mart support specialist will contact you shortly.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#3A4E3E] font-medium mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ananya Patel"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CBB5] bg-[#FAF8F3] focus:outline-hidden focus:border-[#1B4332]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#3A4E3E] font-medium mb-1">Mobile / WhatsApp Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CBB5] bg-[#FAF8F3] focus:outline-hidden focus:border-[#1B4332]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#3A4E3E] font-medium mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Order query / Product dimensions / Gifting"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CBB5] bg-[#FAF8F3] focus:outline-hidden focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-[#3A4E3E] font-medium mb-1">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write your query here..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CBB5] bg-[#FAF8F3] focus:outline-hidden focus:border-[#1B4332]"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-[#1B4332] text-white font-semibold rounded-xl hover:bg-[#143225] transition-all flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* About Us Page */}
      {pageType === 'about' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8E1CF] shadow-xs space-y-6 text-[#3F5243] text-xs sm:text-sm leading-relaxed">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#8A7642] uppercase tracking-wider">
              The Story of Marvi Mart
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif-marvi">
              Everyday Essentials, Beautifully Chosen.
            </h1>
          </div>

          <p>
            Marvi Mart was founded with a singular conviction: daily home objects should be thoughtfully made, genuinely durable, and grounded in authentic Indian materials.
          </p>

          <p>
            From the brass metallurgy of Moradabad and the seasoned Sheesham carving of Saharanpur to the handwoven jute clusters of Bengal, India is home to centuries of functional craft traditions. We work closely with master artisans to adapt these heritage techniques for modern apartments and contemporary homes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#F2ECE0]">
            <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E5DCBE]">
              <h4 className="font-bold text-[#1B4332] text-xs uppercase mb-1">Honest Materials</h4>
              <p className="text-xs text-[#6A7F70]">Pure heavy-gauge brass, certified natural Sheesham and mango woods, organic combed cotton.</p>
            </div>
            <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E5DCBE]">
              <h4 className="font-bold text-[#1B4332] text-xs uppercase mb-1">Small Business Soul</h4>
              <p className="text-xs text-[#6A7F70]">Every single parcel is hand-checked and securely packaged to prevent ceramic & metal breakage.</p>
            </div>
            <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E5DCBE]">
              <h4 className="font-bold text-[#1B4332] text-xs uppercase mb-1">Fair & Direct Pricing</h4>
              <p className="text-xs text-[#6A7F70]">Transparent pricing with free shipping above ₹999 and doorstep Cash on Delivery across India.</p>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Policy */}
      {pageType === 'shipping' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8E1CF] shadow-xs space-y-6 text-[#3F5243] text-xs sm:text-sm leading-relaxed">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif-marvi">
            Shipping & Delivery Policy
          </h1>
          <p>
            We deliver to over 19,000 PIN codes across India through Tier-1 express logistics partners including Blue Dart, Delhivery, and XpressBees.
          </p>
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-sm">Delivery Timelines</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Metro Cities (Delhi NCR, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata):</strong> 2 to 4 business days.</li>
              <li><strong>Tier 2 & 3 Cities across India:</strong> 3 to 6 business days.</li>
              <li><strong>Northeast & Remote Island Regions:</strong> 5 to 8 business days.</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-sm">Shipping Charges</h3>
            <p>
              Orders above ₹999 qualify for <strong>FREE Standard Shipping</strong>. For orders below ₹999, a nominal flat delivery charge of ₹79 is applied at checkout.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-sm">Cash on Delivery Verification</h3>
            <p>
              COD orders are dispatched promptly following automated phone/SMS verification. Please ensure the exact payable amount is ready or use courier UPI QR scan on arrival.
            </p>
          </div>
        </div>
      )}

      {/* Returns & Cancellations Policy */}
      {pageType === 'returns' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8E1CF] shadow-xs space-y-6 text-[#3F5243] text-xs sm:text-sm leading-relaxed">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#8A7642] uppercase tracking-wider">
              Store Guarantee & Protection
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif-marvi">
              7-Day Returns, Replacements & Order Cancellations
            </h1>
          </div>
          
          <p>
            We take utmost pride in the quality of every handcrafted item we ship. If an item arrives damaged, defective, or does not meet your expectations, we offer a hassle-free 7-day return window from the date of doorstep delivery.
          </p>

          <div className="space-y-3 pt-2 border-t border-[#F2ECE0]">
            <h3 className="font-bold text-[#1B4332] text-sm">Order Cancellation Policy</h3>
            <p>
              Orders can be cancelled at zero fee before dispatch from our fulfillment center. To cancel an order before shipping, contact customer care with your Order Reference (e.g., MM-2026-XXXXX). Once an order has been handed over to our express courier partner, it cannot be cancelled in transit but can be refused upon delivery or returned within 7 days.
            </p>
          </div>

          <div className="space-y-3 pt-2 border-t border-[#F2ECE0]">
            <h3 className="font-bold text-[#1B4332] text-sm">How Doorstep Returns & Replacements Work</h3>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Contact our support team via <a href="mailto:qmarvi61@gmail.com" className="text-[#1B4332] underline font-medium">qmarvi61@gmail.com</a> with your Order Reference (e.g. MM-2026-XXXXX).</li>
              <li>Share a brief photo of the package or item if damaged during transit.</li>
              <li>Our logistics partner arranges a complimentary doorstep reverse pickup from your registered address.</li>
              <li>Upon reverse pickup and inspection, a free replacement is dispatched or a refund is processed.</li>
            </ol>
          </div>

          <div className="space-y-3 pt-2 border-t border-[#F2ECE0]">
            <h3 className="font-bold text-[#1B4332] text-sm">Cash on Delivery (COD) Refund Method</h3>
            <p>
              For orders placed via Cash on Delivery, refunds are transferred directly to your bank account via NEFT/IMPS or via your provided UPI ID within 24 to 48 business hours after reverse pickup inspection.
            </p>
          </div>
        </div>
      )}

      {/* Privacy Policy */}
      {pageType === 'privacy' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8E1CF] shadow-xs space-y-6 text-[#3F5243] text-xs sm:text-sm leading-relaxed">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif-marvi">
            Privacy Policy
          </h1>
          <p>
            At Marvi Mart, your personal information is strictly safeguarded in accordance with India’s Digital Personal Data Protection (DPDP) standards.
          </p>
          <p>
            We only collect your name, phone number, shipping address, and optional email for order fulfillment and logistics communication. We never sell, lease, or transmit your private details to third-party marketing brokers.
          </p>
        </div>
      )}

      {/* Terms */}
      {pageType === 'terms' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8E1CF] shadow-xs space-y-6 text-[#3F5243] text-xs sm:text-sm leading-relaxed">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif-marvi">
            Terms of Service
          </h1>
          <p>
            Welcome to Marvi Mart. By using our website and placing orders, you agree to our terms of service.
          </p>
          <p>
            <strong>Handcrafted Natural Variations:</strong> Because our brassware, ceramic glazes, Sheesham wood, and jute organizers are hand-shaped by artisans, subtle variations in wood grain, hammering marks, and weave textures are natural and celebrate authentic craftsmanship.
          </p>
        </div>
      )}

      {/* Cash on Delivery (COD) Information */}
      {pageType === 'cod' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8E1CF] shadow-xs space-y-6 text-[#3F5243] text-xs sm:text-sm leading-relaxed">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#8A7642] uppercase tracking-wider">
              Payment Guide & Convenience
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif-marvi">
              Cash on Delivery (COD) Policy & Information
            </h1>
          </div>

          <p>
            At Marvi Mart, we prioritize customer peace of mind. We offer seamless <strong>Cash on Delivery (COD)</strong> across all serviceable PIN codes throughout India. You only pay for your handcrafted decor and lifestyle essentials once the parcel reaches your doorstep.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E5DCBE]">
              <h4 className="font-bold text-[#1B4332] text-xs uppercase mb-1">1. Zero Advance Payment</h4>
              <p className="text-xs text-[#6A7F70]">No credit card, debit card, or advance net banking needed when placing your order.</p>
            </div>
            <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E5DCBE]">
              <h4 className="font-bold text-[#1B4332] text-xs uppercase mb-1">2. Doorstep UPI or Cash</h4>
              <p className="text-xs text-[#6A7F70]">Pay with exact cash or scan the delivery executive’s verified UPI QR code on arrival.</p>
            </div>
            <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-[#E5DCBE]">
              <h4 className="font-bold text-[#1B4332] text-xs uppercase mb-1">3. Automated Dispatch</h4>
              <p className="text-xs text-[#6A7F70]">Your package is safely packed in protective cushioning and dispatched within 24 business hours.</p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-[#F2ECE0]">
            <h3 className="font-bold text-[#1B4332] text-sm">Online Payments & PhonePe Gateway Readiness</h3>
            <p>
              To ensure our customers enjoy the most secure and frictionless payment methods, our technical backend is architected for integration with the <strong>PhonePe Payment Gateway</strong>. Once live merchant credentials and compliance verification are completed, instant PhonePe UPI, RuPay/Visa/MasterCard, and NetBanking will become available at checkout alongside Cash on Delivery.
            </p>
          </div>

          <div className="space-y-3 pt-2 border-t border-[#F2ECE0]">
            <h3 className="font-bold text-[#1B4332] text-sm">Doorstep Delivery Guidelines for COD</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Please keep the exact invoice amount ready or ensure your UPI app (PhonePe, Google Pay, Paytm) is accessible on your phone during delivery hours.</li>
              <li>Delivery executives from Blue Dart, Delhivery, or XpressBees carry digital verification receipts.</li>
              <li>Inspect outer packaging for tamper-evident seals before completing payment.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
