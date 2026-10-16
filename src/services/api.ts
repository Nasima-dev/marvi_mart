import { Product, Order, AdminStats, DatabaseStatus } from '../types';

const API_BASE = '/api';

export const api = {
  // Public
  async getHealth(): Promise<{ database: DatabaseStatus; status: string }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch system health');
    return res.json();
  },

  async getProducts(params: {
    category?: string;
    search?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.sort) query.set('sort', params.sort);
    if (params.minPrice !== undefined) query.set('minPrice', String(params.minPrice));
    if (params.maxPrice !== undefined) query.set('maxPrice', String(params.maxPrice));
    if (params.inStockOnly) query.set('inStockOnly', 'true');
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async getProductById(id: string): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) throw new Error('Product not found');
    return res.json();
  },

  async createOrder(payload: {
    customer: Order['customer'];
    items: { productId: string; quantity: number }[];
    couponCode?: string;
    paymentMethod?: 'Cash on Delivery' | 'PhonePe Online' | 'Online Payment';
  }): Promise<{ success: boolean; order: Order; message: string; paymentInitiation?: any }> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to place order');
    }
    return data;
  },

  async getPhonePeStatus(): Promise<{
    gateway: string;
    isConfigured: boolean;
    environment: string;
    mode: string;
    supportedPaymentMethods: string[];
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/payments/phonepe/status`);
    if (!res.ok) throw new Error('Failed to fetch gateway status');
    return res.json();
  },

  async trackOrder(reference: string): Promise<any> {
    const res = await fetch(`${API_BASE}/orders/track/${encodeURIComponent(reference)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Order not found');
    }
    return data;
  },

  // Admin
  async adminLogin(password: string): Promise<{ success: boolean; token: string }> {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials');
    }
    return data;
  },

  async verifyAdminSession(token: string): Promise<{ valid: boolean; role?: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { valid: false };
      const data = await res.json();
      return {
        valid: data.authenticated === true && data.role === 'admin',
        role: data.role,
      };
    } catch {
      return { valid: false };
    }
  },

  async getAdminStats(token: string): Promise<AdminStats & { database: DatabaseStatus }> {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async getAdminProducts(
    token: string,
    params: { category?: string; search?: string; page?: number; limit?: number } = {}
  ): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/admin/products?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch admin products');
    return res.json();
  },

  async uploadImage(
    token: string,
    fileData: string,
    fileName: string
  ): Promise<{ success: boolean; url: string; fileName: string; size: number }> {
    const res = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fileData, fileName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload image');
    return data;
  },

  async createAdminProduct(token: string, product: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(product),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create product');
    return data.product;
  },

  async updateAdminProduct(token: string, id: string, updates: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update product');
    return data.product;
  },

  async updateAdminStock(token: string, id: string, stockQuantity: number): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/products/${id}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stockQuantity }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update stock');
    }
  },

  async deactivateAdminProduct(token: string, id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to deactivate product');
  },

  async deleteAdminProduct(token: string, id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/products/${id}?permanent=true`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete product');
  },

  async getAdminOrders(token: string, status?: string): Promise<Order[]> {
    const query = status && status !== 'All' ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${API_BASE}/admin/orders${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async updateAdminOrderStatus(
    token: string,
    id: string,
    status: string,
    note?: string
  ): Promise<Order> {
    const res = await fetch(`${API_BASE}/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, note }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update order status');
    return data.order;
  },
};
