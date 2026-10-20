import { Product, Order, AdminStats, DatabaseStatus } from '../types';

/**
 * Resolves the backend API base URL.
 * Automatically respects VITE_API_URL when the frontend is hosted statically
 * (such as on Netlify Drop) with a separate backend API server (e.g. on Render/Railway/Cloud Run).
 * Defaults to relative '/api' on local dev or unified full-stack deployments.
 */
export function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '') + '/api';
  }
  return '/api';
}

/**
 * Safely parses and validates API responses.
 * 
 * Prevents syntax crashes like:
 * `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
 * by inspecting HTTP status and Content-Type before calling res.json().
 *
 * When an HTML response is received (e.g. Netlify SPA fallback where /api routes to index.html),
 * it throws an actionable, diagnostic error explaining that the backend server is unreachable.
 */
async function handleApiResponse<T>(res: Response, endpointLabel: string): Promise<T> {
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const rawText = await res.text();
  const trimmed = rawText.trim();

  // Strict check for HTML doctype, tags, or html content-type
  const isHtml =
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<html') ||
    trimmed.startsWith('<') ||
    contentType.includes('text/html');

  if (isHtml) {
    throw new Error(
      `Backend API server unavailable: Endpoint "${endpointLabel}" returned an HTML page (${res.status} ${res.statusText}) instead of JSON. ` +
      `This happens when the backend server is not running or static hosting (e.g. Netlify Drop) routed the API request to index.html. ` +
      `To resolve: ensure the Marvi Mart backend (server.ts) is deployed and set VITE_API_URL or Netlify proxy.`
    );
  }

  // Handle empty bodies
  if (!trimmed) {
    if (!res.ok) {
      throw new Error(`API request to "${endpointLabel}" failed with HTTP ${res.status} (${res.statusText})`);
    }
    return {} as T;
  }

  // Parse JSON with safe diagnostics
  let data: any;
  try {
    data = JSON.parse(trimmed);
  } catch {
    throw new Error(
      `Unexpected response from "${endpointLabel}" (HTTP ${res.status} ${res.statusText}): Expected JSON but received: ${trimmed.slice(0, 120)}`
    );
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `Request to "${endpointLabel}" failed with HTTP ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Public
  async getHealth(): Promise<{ database: DatabaseStatus; status: string }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/health`);
    return handleApiResponse<{ database: DatabaseStatus; status: string }>(res, 'GET /api/health');
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

    const base = getApiBaseUrl();
    const res = await fetch(`${base}/products?${query.toString()}`);
    return handleApiResponse<{ products: Product[]; total: number; page: number; totalPages: number }>(
      res,
      'GET /api/products'
    );
  },

  async getProductById(id: string): Promise<Product> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/products/${id}`);
    return handleApiResponse<Product>(res, `GET /api/products/${id}`);
  },

  async createOrder(payload: {
    customer: Order['customer'];
    items: { productId: string; quantity: number }[];
    couponCode?: string;
    paymentMethod?: 'Cash on Delivery' | 'PhonePe Online' | 'Online Payment';
  }): Promise<{ success: boolean; order: Order; message: string; paymentInitiation?: any }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleApiResponse<{ success: boolean; order: Order; message: string; paymentInitiation?: any }>(
      res,
      'POST /api/orders'
    );
  },

  async getPhonePeStatus(): Promise<{
    gateway: string;
    isConfigured: boolean;
    environment: string;
    mode: string;
    supportedPaymentMethods: string[];
    message: string;
  }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/payments/phonepe/status`);
    return handleApiResponse<{
      gateway: string;
      isConfigured: boolean;
      environment: string;
      mode: string;
      supportedPaymentMethods: string[];
      message: string;
    }>(res, 'GET /api/payments/phonepe/status');
  },

  async trackOrder(reference: string): Promise<any> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/orders/track/${encodeURIComponent(reference)}`);
    return handleApiResponse<any>(res, `GET /api/orders/track/${reference}`);
  },

  // Admin Authentication
  async adminLogin(password: string): Promise<{ success: boolean; token: string }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return handleApiResponse<{ success: boolean; token: string }>(res, 'POST /api/admin/login');
  },

  async verifyAdminSession(token: string): Promise<{ valid: boolean; role?: string }> {
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/admin/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { valid: false };
      const data = await handleApiResponse<{ authenticated?: boolean; role?: string }>(res, 'GET /api/admin/verify');
      return {
        valid: data.authenticated === true && data.role === 'admin',
        role: data.role,
      };
    } catch {
      return { valid: false };
    }
  },

  async getAdminStats(token: string): Promise<AdminStats & { database: DatabaseStatus }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleApiResponse<AdminStats & { database: DatabaseStatus }>(res, 'GET /api/admin/stats');
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

    const base = getApiBaseUrl();
    const res = await fetch(`${base}/admin/products?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleApiResponse<{ products: Product[]; total: number; page: number; totalPages: number }>(
      res,
      'GET /api/admin/products'
    );
  },

  async uploadImage(
    token: string,
    fileData: string,
    fileName: string
  ): Promise<{ success: boolean; url: string; fileName: string; size: number }> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/admin/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fileData, fileName }),
    });
    return handleApiResponse<{ success: boolean; url: string; fileName: string; size: number }>(
      res,
      'POST /api/admin/upload'
    );
  },

  async createAdminProduct(token: string, product: Partial<Product>): Promise<Product> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(product),
    });
    const data = await handleApiResponse<{ success: boolean; product: Product }>(res, 'POST /api/admin/products');
    return data.product;
  },

  async updateAdminProduct(token: string, id: string, updates: Partial<Product>): Promise<Product> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/admin/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    const data = await handleApiResponse<{ success: boolean; product: Product }>(res, `PUT /api/admin/products/${id}`);
    return data.product;
  },

  async updateAdminStock(token: string, id: string, stockQuantity: number): Promise<void> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/admin/products/${id}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stockQuantity }),
    });
    await handleApiResponse<{ success: boolean; stockQuantity: number }>(
      res,
      `PATCH /api/admin/products/${id}/stock`
    );
  },

  async deactivateAdminProduct(token: string, id: string): Promise<void> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    await handleApiResponse<{ success: boolean; message: string }>(res, `DELETE /api/admin/products/${id}`);
  },

  async deleteAdminProduct(token: string, id: string): Promise<void> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/admin/products/${id}?permanent=true`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    await handleApiResponse<{ success: boolean; message: string }>(res, `DELETE /api/admin/products/${id}?permanent=true`);
  },

  async getAdminOrders(token: string, status?: string): Promise<Order[]> {
    const query = status && status !== 'All' ? `?status=${encodeURIComponent(status)}` : '';
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/admin/orders${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleApiResponse<Order[]>(res, 'GET /api/admin/orders');
  },

  async updateAdminOrderStatus(
    token: string,
    id: string,
    status: string,
    note?: string
  ): Promise<Order> {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, note }),
    });
    const data = await handleApiResponse<{ success: boolean; order: Order }>(
      res,
      `PATCH /api/admin/orders/${id}/status`
    );
    return data.order;
  },
};
