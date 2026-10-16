import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { formatProductImageUrl } from '../utils/imageUrl';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  appliedCoupon: string | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  totalItemsCount: number;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('marvi_cart');
      if (!saved) return [];
      const parsed: CartItem[] = JSON.parse(saved);
      return parsed.map((item) => {
        if (item.product && Array.isArray(item.product.imageUrls)) {
          item.product.imageUrls = item.product.imageUrls.map((u) => formatProductImageUrl(u));
        }
        return item;
      });
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('marvi_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('marvi_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem('marvi_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage', e);
    }
  }, [wishlist]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stockQuantity, existing.quantity + quantity);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { product, quantity: Math.min(product.stockQuantity, quantity) }];
    });
    setIsCartDrawerOpen(true);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const max = item.product.stockQuantity;
          return { ...item, quantity: Math.min(max, quantity) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Free shipping on orders above ₹999 across India
  const shippingFee = subtotal === 0 || subtotal >= 999 ? 0 : 79;

  let discountAmount = 0;
  if (appliedCoupon === 'MARVI100' && subtotal >= 800) {
    discountAmount = 100;
  } else if (appliedCoupon === 'WELCOME50' && subtotal >= 499) {
    discountAmount = 50;
  } else if (appliedCoupon === 'DECOR10' && subtotal >= 1000) {
    discountAmount = Math.round(subtotal * 0.1);
  }

  const total = Math.max(0, subtotal + shippingFee - discountAmount);
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const applyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'MARVI100') {
      if (subtotal < 800) {
        return { success: false, message: 'Coupon MARVI100 requires minimum order value of ₹800.' };
      }
      setAppliedCoupon('MARVI100');
      return { success: true, message: 'Coupon applied! ₹100 instant discount.' };
    }
    if (clean === 'WELCOME50') {
      if (subtotal < 499) {
        return { success: false, message: 'Coupon WELCOME50 requires minimum order value of ₹499.' };
      }
      setAppliedCoupon('WELCOME50');
      return { success: true, message: 'Coupon applied! ₹50 instant discount.' };
    }
    if (clean === 'DECOR10') {
      if (subtotal < 1000) {
        return { success: false, message: 'Coupon DECOR10 requires minimum order value of ₹1,000.' };
      }
      setAppliedCoupon('DECOR10');
      return { success: true, message: 'Coupon applied! 10% instant discount.' };
    }
    return { success: false, message: 'Invalid coupon code. Try MARVI100 or WELCOME50' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        shippingFee,
        discountAmount,
        total,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        totalItemsCount,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        wishlist,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
