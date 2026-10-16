export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  price: number;
  compareAtPrice?: number;
  imageUrls: string[];
  stockQuantity: number;
  isActive: boolean;
  material?: string;
  dimensions?: string;
  careInstructions?: string;
  featured?: boolean;
  bestseller?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ProductCategory =
  | 'Clothing'
  | 'Home Decor'
  | 'Kitchen Essentials'
  | 'Lighting'
  | 'Storage & Organization'
  | 'Bedroom Accessories'
  | 'Living Room Accessories'
  | 'Daily-Use Essentials'
  | 'Gifts & Lifestyle';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CustomerAddress {
  fullName: string;
  phone: string;
  email?: string;
  flatHouse: string;
  streetArea: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  addressType: 'Home' | 'Office';
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  orderReference: string;
  customer: CustomerAddress;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: 'Cash on Delivery' | 'PhonePe Online' | 'Online Payment';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Cancelled';
  paymentTransactionId?: string;
  orderStatus: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
  createdAt: string;
}

export interface DatabaseStatus {
  connected: boolean;
  type: 'mongodb' | 'memory-fallback';
  databaseName?: string;
  error?: string;
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  activeProductsCount: number;
  lowStockCount: number;
  recentOrdersCount: number;
}
