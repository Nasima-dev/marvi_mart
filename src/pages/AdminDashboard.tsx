import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  ShieldAlert,
  Package, 
  ShoppingBag, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Database, 
  RefreshCw, 
  Eye, 
  ChevronRight, 
  AlertTriangle,
  TrendingUp,
  MapPin,
  Phone,
  LogOut,
  Sliders,
  DollarSign,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Product, Order, AdminStats, DatabaseStatus, ProductCategory, OrderStatus } from '../types';
import { api } from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import { formatProductImageUrl, handleImageError } from '../utils/imageUrl';

const CATEGORIES: ProductCategory[] = [
  'Clothing',
  'Home Decor',
  'Kitchen Essentials',
  'Lighting',
  'Storage & Organization',
  'Bedroom Accessories',
  'Living Room Accessories',
  'Daily-Use Essentials',
  'Gifts & Lifestyle',
];

export const AdminDashboard: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { token, role, isAuthenticated, isVerifying, login, logout } = useAdminAuth();
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard Data State
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'database'>('overview');
  const [stats, setStats] = useState<(AdminStats & { database: DatabaseStatus }) | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Product Modals
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  // Multi-Image Upload & Management State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTargetIndex = useRef<number>(-1); // -1: Add new image, >= 0: Replace image at index
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [manualUrlInput, setManualUrlInput] = useState('');

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploadError(null);

    // Accept JPG, JPEG, PNG, WEBP
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validExtensions = /\.(jpe?g|png|webp)$/i;

    if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
      setImageUploadError('Invalid format. Please select a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setImageUploadError('Image size exceeds 20MB. Please select a smaller image file.');
      return;
    }

    setSelectedFileName(file.name);
    setUploadingImage(true);

    const targetIdx = uploadTargetIndex.current;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;

        // Immediately update state preview
        setEditingProduct((prev) => {
          if (!prev) return null;
          const current = [...(prev.imageUrls || [])];
          if (targetIdx >= 0 && targetIdx < current.length) {
            current[targetIdx] = base64Data;
          } else {
            current.push(base64Data);
          }
          return { ...prev, imageUrls: current };
        });

        // Upload to server so it is persisted to disk and given a static /uploads/... URL
        if (token) {
          const res = await api.uploadImage(token, base64Data, file.name);
          if (res && res.url) {
            setEditingProduct((prev) => {
              if (!prev) return null;
              const current = [...(prev.imageUrls || [])];
              if (targetIdx >= 0 && targetIdx < current.length) {
                current[targetIdx] = res.url;
              } else {
                const bIndex = current.indexOf(base64Data);
                if (bIndex !== -1) {
                  current[bIndex] = res.url;
                } else {
                  current.push(res.url);
                }
              }
              return { ...prev, imageUrls: current };
            });
          }
        }
      } catch (err: any) {
        console.warn('Backend image upload fallback, base64 will be saved on submit:', err);
      } finally {
        setUploadingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setImageUploadError('Failed to read the selected file from your computer.');
      setUploadingImage(false);
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImageSlot = (indexToRemove: number) => {
    setEditingProduct((prev) => {
      if (!prev) return null;
      const updated = (prev.imageUrls || []).filter((_, i) => i !== indexToRemove);
      return { ...prev, imageUrls: updated };
    });
  };

  const handleSetPrimarySlot = (indexToPrimary: number) => {
    setEditingProduct((prev) => {
      if (!prev) return null;
      const list = [...(prev.imageUrls || [])];
      if (indexToPrimary <= 0 || indexToPrimary >= list.length) return prev;
      const [moved] = list.splice(indexToPrimary, 1);
      list.unshift(moved);
      return { ...prev, imageUrls: list };
    });
  };

  const handleAddManualUrl = () => {
    const trimmed = manualUrlInput.trim();
    if (!trimmed) return;
    setEditingProduct((prev) => {
      if (!prev) return null;
      const list = [...(prev.imageUrls || [])];
      list.push(trimmed);
      return { ...prev, imageUrls: list };
    });
    setManualUrlInput('');
  };

  // Selected Order for Detail View
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  // Search & Filter in Admin
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');

  // Load dashboard data when authenticated with admin role
  useEffect(() => {
    if (isAuthenticated && role === 'admin' && token) {
      loadDashboardData(token);
    }
  }, [isAuthenticated, role, token]);

  const loadDashboardData = async (activeToken: string) => {
    setLoadingData(true);
    try {
      const [statsData, productsData, ordersData] = await Promise.all([
        api.getAdminStats(activeToken),
        api.getAdminProducts(activeToken, { limit: 100 }),
        api.getAdminOrders(activeToken),
      ]);
      setStats(statsData);
      setProducts(productsData.products);
      setOrders(ordersData);
    } catch (err: any) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);

    const res = await login(loginPassword);
    if (!res.success) {
      setLoginError(res.error || 'Access Denied: Invalid administrator credentials.');
    } else {
      setLoginPassword('');
    }
    setLoggingIn(false);
  };

  const handleLogout = () => {
    logout();
    setStats(null);
    setProducts([]);
    setOrders([]);
    onExit();
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingProduct) return;

    if (!editingProduct.name || !editingProduct.category || !editingProduct.price) {
      setProductError('Please provide name, category, and price.');
      return;
    }

    setSavingProduct(true);
    setProductError(null);

    try {
      if (isNewProduct) {
        await api.createAdminProduct(token, editingProduct);
      } else if (editingProduct.id) {
        await api.updateAdminProduct(token, editingProduct.id, editingProduct);
      }
      setEditingProduct(null);
      setIsNewProduct(false);
      setSelectedFileName(null);
      setImageUploadError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadDashboardData(token);
    } catch (err: any) {
      setProductError(err.message || 'Failed to save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    if (!token) return;
    try {
      await api.updateAdminStock(token, productId, newStock);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newStock } : p))
      );
      if (stats) {
        setStats({
          ...stats,
          lowStockCount: products.filter((p) =>
            p.id === productId ? newStock < 5 : p.stockQuantity < 5
          ).length,
        });
      }
    } catch (err) {
      alert('Failed to update stock');
    }
  };

  const handleDeactivate = async (productId: string) => {
    if (!token || !confirm('Are you sure you want to deactivate this product?')) return;
    try {
      await api.deactivateAdminProduct(token, productId);
      await loadDashboardData(token);
    } catch (err) {
      alert('Failed to deactivate product');
    }
  };

  const handleToggleActive = async (productId: string, currentActive: boolean) => {
    if (!token) return;
    try {
      await api.updateAdminProduct(token, productId, { isActive: !currentActive });
      await loadDashboardData(token);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!token || !confirm('Permanently delete this product from the database? This cannot be undone.')) return;
    try {
      await api.deleteAdminProduct(token, productId);
      await loadDashboardData(token);
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const closeProductModal = () => {
    setEditingProduct(null);
    setIsNewProduct(false);
    setSelectedFileName(null);
    setImageUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!token) return;
    setUpdatingOrderStatus(true);
    try {
      const updated = await api.updateAdminOrderStatus(token, orderId, newStatus, statusNote);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      setStatusNote('');
      if (stats) {
        loadDashboardData(token);
      }
    } catch (err) {
      alert('Failed to update order status');
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  // Verification checking state
  if (isVerifying) {
    return (
      <div className="max-w-md mx-auto px-4 py-28 text-center space-y-4">
        <div className="w-14 h-14 bg-[#1B4332] text-[#D4AF37] rounded-2xl flex items-center justify-center mx-auto shadow-md animate-pulse">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-[#1B4332] font-serif-marvi">
          Verifying Access Permissions...
        </h2>
        <p className="text-xs text-[#5E7264]">
          Validating administrator cryptographic session with the backend server.
        </p>
      </div>
    );
  }

  // Unauthorized Access / Store Owner Login Gate
  if (!isAuthenticated || role !== 'admin' || !token) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white p-8 rounded-3xl border border-[#E8E1CF] shadow-lg space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-[#1B4332] text-[#D4AF37] rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-7 h-7" />
            </div>
            <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold uppercase tracking-wider rounded-full">
              Restricted Area
            </span>
            <h1 className="text-2xl font-bold text-[#1B4332] font-serif-marvi">
              Store Owner Portal
            </h1>
            <p className="text-xs text-[#5E7264] leading-relaxed">
              Protected administrative area. Role-based authorization is enforced. Normal customers and public visitors are denied access to inventory, orders, and sales analytics.
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#3A4E3E] mb-1">
                Owner Administrator Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter admin password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D5CBB5] bg-[#FAF8F3] focus:outline-hidden focus:border-[#1B4332]"
              />
              <p className="text-[11px] text-[#7C8F82] mt-1.5">
                Role-based admin access is authenticated securely by the backend server.
              </p>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 bg-[#1B4332] hover:bg-[#143225] text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loggingIn ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span>Sign In as Store Owner</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-[#F2ECE0]">
            <button
              onClick={onExit}
              className="text-xs text-[#6A7F70] hover:text-[#1B4332] underline font-medium"
            >
              ← Back to Customer Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EAE3D2] gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A7642]">
              Management Console
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Owner Admin (Verified)</span>
            </span>
            {stats?.database && (
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  stats.database.connected
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                <Database className="w-3 h-3" />
                <span>
                  {stats.database.connected ? 'MongoDB Atlas Live' : 'Memory Data Mode'}
                </span>
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#1B4332] font-serif-marvi">
            Marvi Mart Store Administration
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => token && loadDashboardData(token)}
            disabled={loadingData}
            className="p-2.5 text-xs text-[#1B4332] bg-white border border-[#D5CBB5] rounded-xl hover:bg-[#FAF8F3] transition-colors flex items-center gap-1.5"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={onExit}
            className="px-3.5 py-2 text-xs font-medium text-[#1B4332] bg-white border border-[#D5CBB5] rounded-xl hover:bg-[#FAF8F3]"
          >
            View Storefront
          </button>
          <button
            onClick={handleLogout}
            className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 flex items-center gap-1.5"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EAE3D2] pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-[#1B4332] text-white shadow-xs'
              : 'text-[#445648] hover:text-[#1B4332] hover:bg-[#FAF8F3]'
          }`}
        >
          Sales & Analytics
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-[#1B4332] text-white shadow-xs'
              : 'text-[#445648] hover:text-[#1B4332] hover:bg-[#FAF8F3]'
          }`}
        >
          Products & Inventory ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-[#1B4332] text-white shadow-xs'
              : 'text-[#445648] hover:text-[#1B4332] hover:bg-[#FAF8F3]'
          }`}
        >
          Customer Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap ${
            activeTab === 'database'
              ? 'bg-[#1B4332] text-white shadow-xs'
              : 'text-[#445648] hover:text-[#1B4332] hover:bg-[#FAF8F3]'
          }`}
        >
          MongoDB Atlas Status
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-8">
          {/* Metrics strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-5 rounded-2xl border border-[#E8E1CF] shadow-2xs space-y-2">
              <span className="text-[11px] font-semibold text-[#7E9184] uppercase tracking-wider block">
                Total Revenue
              </span>
              <p className="text-xl sm:text-2xl font-bold text-[#1B4332] font-mono tabular-nums">
                ₹{stats.totalRevenue.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-[#6A7F70]">From real saved orders</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E1CF] shadow-2xs space-y-2">
              <span className="text-[11px] font-semibold text-[#7E9184] uppercase tracking-wider block">
                Total Orders Placed
              </span>
              <p className="text-xl sm:text-2xl font-bold text-[#1B4332] font-mono tabular-nums">
                {stats.totalOrders}
              </p>
              <p className="text-[11px] text-[#6A7F70]">Cash on Delivery orders</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E1CF] shadow-2xs space-y-2">
              <span className="text-[11px] font-semibold text-[#7E9184] uppercase tracking-wider block">
                Active Catalog Items
              </span>
              <p className="text-xl sm:text-2xl font-bold text-[#1B4332] font-mono tabular-nums">
                {stats.activeProductsCount}
              </p>
              <p className="text-[11px] text-[#6A7F70]">Across 7 home categories</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E1CF] shadow-2xs space-y-2">
              <span className="text-[11px] font-semibold text-[#7E9184] uppercase tracking-wider block">
                Low Stock Alerts
              </span>
              <p className="text-xl sm:text-2xl font-bold text-amber-700 font-mono tabular-nums">
                {stats.lowStockCount}
              </p>
              <p className="text-[11px] text-[#6A7F70]">Items with &lt; 5 units left</p>
            </div>
          </div>

          {/* Recent Orders Preview */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E1CF] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1B4332] font-serif-marvi">
                Recent Orders
              </h2>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-semibold text-[#1B4332] hover:underline"
              >
                View All ({orders.length}) →
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#6A7F70]">
                No customer orders placed yet. Place a test order through the checkout page!
              </div>
            ) : (
              <div className="divide-y divide-[#F4EFE6] text-xs">
                {orders.slice(0, 5).map((ord) => (
                  <div key={ord.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <strong className="text-[#1B4332] font-mono">{ord.orderReference}</strong>
                      <p className="text-[#6A7F70]">{ord.customer.fullName} · {ord.customer.city}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#1B4332] font-mono">
                        ₹{ord.totalAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[11px] text-emerald-800">{ord.orderStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS & INVENTORY */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search Filter */}
            <input
              type="text"
              placeholder="Search products by title..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="text-xs px-3.5 py-2.5 rounded-xl border border-[#D5CBB5] bg-white w-full sm:w-72"
            />

            <button
              onClick={() => {
                setEditingProduct({
                  name: '',
                  category: 'Home Decor',
                  price: 999,
                  stockQuantity: 10,
                  description: '',
                  imageUrls: [],
                  isActive: true,
                });
                setSelectedFileName(null);
                setImageUploadError(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                setIsNewProduct(true);
              }}
              className="px-4 py-2.5 bg-[#1B4332] text-white text-xs font-semibold rounded-xl hover:bg-[#143225] flex items-center gap-1.5 self-start sm:self-auto shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          {/* Product Table */}
          <div className="bg-white rounded-3xl border border-[#E8E1CF] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F3] text-[#4F6354] uppercase tracking-wider font-semibold border-b border-[#EAE3D2]">
                  <tr>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2ECE0]">
                  {products
                    .filter((p) =>
                      productSearch
                        ? p.name.toLowerCase().includes(productSearch.toLowerCase())
                        : true
                    )
                    .map((prod) => (
                      <tr key={prod.id} className="hover:bg-[#FAF9F6]">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={formatProductImageUrl(prod.imageUrls[0])}
                              alt=""
                              referrerPolicy="no-referrer"
                              onError={(e) => handleImageError(e, '/images/home_decor_brass_vase_1791727457022.jpg')}
                              className="w-10 h-10 rounded-lg object-cover bg-[#F5F1E8] shrink-0 border border-[#E8E1CF]"
                            />
                            {prod.imageUrls.length > 1 && (
                              <span className="absolute -bottom-1 -right-1 bg-[#1B4332] text-[#D4AF37] text-[8px] font-bold px-1 rounded-full border border-white shadow-xs">
                                {prod.imageUrls.length}v
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <strong className="text-[#1B4332] block truncate max-w-xs">{prod.name}</strong>
                            <span className="text-[10px] text-[#788C7E] font-mono">
                              {prod.id} · {prod.imageUrls.length} {prod.imageUrls.length === 1 ? 'view' : 'views'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#445648]">{prod.category}</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#1B4332]">
                          ₹{prod.price.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              value={prod.stockQuantity}
                              onChange={(e) =>
                                handleUpdateStock(prod.id, parseInt(e.target.value) || 0)
                              }
                              className="w-16 px-2 py-1 text-xs border border-[#D5CBB5] rounded-md font-mono"
                            />
                            {prod.stockQuantity <= 5 && (
                              <span className="text-[10px] text-amber-700 font-semibold">Low</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              prod.isActive
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-red-50 text-red-800'
                            }`}
                          >
                            {prod.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setSelectedFileName(null);
                              setImageUploadError(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                              setIsNewProduct(false);
                            }}
                            className="p-1.5 text-[#1B4332] hover:bg-[#FAF8F3] rounded-lg cursor-pointer"
                            title="Edit product details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(prod.id, prod.isActive)}
                            className={`p-1.5 rounded-lg text-xs font-semibold ${
                              prod.isActive
                                ? 'text-amber-800 hover:bg-amber-50'
                                : 'text-emerald-800 hover:bg-emerald-50'
                            }`}
                            title={prod.isActive ? 'Deactivate from storefront' : 'Activate on storefront'}
                          >
                            {prod.isActive ? 'Hide' : 'Show'}
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg"
                            title="Permanently delete from database"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Status Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {['All', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setOrderStatusFilter(st)}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                  orderStatusFilter === st
                    ? 'bg-[#1B4332] text-white'
                    : 'bg-white text-[#445648] border border-[#E0D7C3]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Orders Table */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E8E1CF] shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F3] text-[#4F6354] uppercase tracking-wider font-semibold border-b border-[#EAE3D2]">
                    <tr>
                      <th className="py-3 px-4">Order Ref</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">City</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2ECE0]">
                    {orders
                      .filter((o) =>
                        orderStatusFilter === 'All' ? true : o.orderStatus === orderStatusFilter
                      )
                      .map((ord) => (
                        <tr
                          key={ord.id}
                          onClick={() => setSelectedOrder(ord)}
                          className={`hover:bg-[#FAF9F6] cursor-pointer ${
                            selectedOrder?.id === ord.id ? 'bg-[#F5EFE3]' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-[#1B4332]">
                            {ord.orderReference}
                          </td>
                          <td className="py-3 px-4 text-[#334638]">
                            <strong>{ord.customer.fullName}</strong>
                            <p className="text-[10px] text-[#788C7E]">+91 {ord.customer.phone}</p>
                          </td>
                          <td className="py-3 px-4 text-[#445648]">
                            {ord.customer.city}, {ord.customer.state}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#1B4332]">
                            ₹{ord.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                ord.paymentStatus === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : ord.paymentStatus === 'Failed'
                                  ? 'bg-red-50 text-red-800 border border-red-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {ord.paymentMethod === 'Cash on Delivery' ? 'COD' : 'Online'} · {ord.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {ord.orderStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <ChevronRight className="w-4 h-4 text-[#788C7E] inline" />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Order Detail Sidebar */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E8E1CF] shadow-2xs space-y-4">
              {selectedOrder ? (
                <div className="space-y-4 text-xs">
                  <div className="border-b border-[#F2ECE0] pb-3">
                    <span className="text-[10px] text-[#788C7E] uppercase tracking-wider block font-semibold">
                      Order Details
                    </span>
                    <h3 className="text-base font-bold text-[#1B4332] font-mono">
                      {selectedOrder.orderReference}
                    </h3>
                    <p className="text-[#6A7F70]">
                      Placed on: {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Customer Address */}
                  <div className="space-y-1 bg-[#FAF8F3] p-3 rounded-xl border border-[#E8DFC9]">
                    <p className="font-bold text-[#1B4332]">{selectedOrder.customer.fullName}</p>
                    <p>Phone: +91 {selectedOrder.customer.phone}</p>
                    <p>{selectedOrder.customer.flatHouse}, {selectedOrder.customer.streetArea}</p>
                    <p>{selectedOrder.customer.city}, {selectedOrder.customer.state} ({selectedOrder.customer.pincode})</p>
                    <p className="text-[11px] text-[#7A8E80]">Type: {selectedOrder.customer.addressType}</p>
                  </div>

                  {/* Payment Details */}
                  <div className="space-y-1 bg-[#FAF9F5] p-3 rounded-xl border border-[#E5DECD]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1B4332]">Payment Method:</span>
                      <span className="font-medium text-[#2E4133]">{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1B4332]">Payment Status:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          selectedOrder.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedOrder.paymentStatus === 'Failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                    {selectedOrder.paymentTransactionId && (
                      <p className="text-[10px] font-mono text-[#6A7F70] pt-1">
                        Txn ID: {selectedOrder.paymentTransactionId}
                      </p>
                    )}
                  </div>

                  {/* Status Updater */}
                  <div className="space-y-2 pt-2">
                    <label className="block font-semibold text-[#1B4332]">
                      Update Status:
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedOrder.orderStatus}
                        onChange={(e) =>
                          handleUpdateOrderStatus(selectedOrder.id, e.target.value as OrderStatus)
                        }
                        className="flex-1 px-3 py-2 border border-[#D5CBB5] rounded-xl bg-[#FAF8F3]"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Optional internal log note..."
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-[#D5CBB5] rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2 pt-2 border-t border-[#F2ECE0]">
                    <span className="font-bold text-[#1B4332] uppercase text-[11px] block">
                      Ordered Items:
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedOrder.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1">
                          <span className="truncate max-w-[180px]">{it.name} (x{it.quantity})</span>
                          <span className="font-mono font-bold">₹{it.price * it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-[#6A7F70]">
                  Select an order from the list to inspect address, items, and update fulfillment status.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MONGODB ATLAS STATUS */}
      {activeTab === 'database' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E8E1CF] shadow-2xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FAF7F0] text-[#1B4332] rounded-2xl flex items-center justify-center border border-[#E5DCBE]">
              <Database className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1B4332] font-serif-marvi">
                MongoDB Atlas Configuration & Health
              </h2>
              <p className="text-xs text-[#5E7264]">
                Persistent cloud database for product catalog, live inventory, and customer orders.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border space-y-2 text-xs bg-[#FAF8F3] border-[#E8DFC9]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1B4332]">Current Status:</span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full ${
                  stats?.database?.connected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {stats?.database?.connected ? 'Connected to MongoDB Atlas' : 'Local Memory Fallback Store'}
              </span>
            </div>
            {stats?.database?.databaseName && (
              <p className="text-[#445648]">
                Connected Database: <code className="font-mono">{stats.database.databaseName}</code>
              </p>
            )}
            {stats?.database?.error && (
              <p className="text-amber-800 text-[11px]">
                Note: {stats.database.error}
              </p>
            )}
          </div>

          {/* Setup Guide */}
          <div className="space-y-4 text-xs text-[#3C4E40] leading-relaxed pt-2">
            <h3 className="font-bold text-sm text-[#1B4332]">
              How to Connect MongoDB Atlas in Production:
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Create a free MongoDB Atlas cluster at <a href="https://www.mongodb.com/atlas" target="_blank" rel="noreferrer" className="text-[#1B4332] underline font-semibold">mongodb.com/atlas</a>.
              </li>
              <li>
                In Atlas, under <strong>Network Access</strong>, add IP Address: <code className="bg-[#FAF7F0] px-1 py-0.5 rounded font-mono">0.0.0.0/0</code> (or allow access from anywhere).
              </li>
              <li>
                Under <strong>Database Access</strong>, create a database user and password.
              </li>
              <li>
                Click <strong>Connect → Drivers (Node.js)</strong> and copy the connection string.
              </li>
              <li>
                Add the URI to your environment variables:
                <pre className="mt-1 p-3 bg-[#1B4332] text-[#FAF7F0] rounded-xl font-mono text-[11px] overflow-x-auto">
                  MONGODB_URI="mongodb+srv://[username]:[password]@cluster0.xxxxx.mongodb.net/marvi_mart?retryWrites=true&amp;w=majority"
                </pre>
                <p className="text-[11px] text-[#55695C] mt-1">
                  Marvi Mart connects exclusively to database <code className="font-mono font-semibold">marvi_mart</code> to maintain complete data isolation.
                </p>
              </li>
              <li>
                Restart the server. Marvi Mart automatically connects, verifies indexes, and initializes the catalog safely!
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={closeProductModal}
          />

          <div className="relative bg-[#FAF7F0] w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E6DEC9] z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE3D2] pb-3">
              <h3 className="text-lg font-bold text-[#1B4332] font-serif-marvi">
                {isNewProduct ? 'Add New Product' : `Edit: ${editingProduct.name}`}
              </h3>
              <button
                onClick={closeProductModal}
                className="p-1 text-[#6A7F70] hover:text-[#1B4332] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {productError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {productError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[#3A4E3E] font-medium mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D5CBB5] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[#3A4E3E] font-medium mb-1">Category</label>
                  <select
                    value={editingProduct.category || 'Home Decor'}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value as ProductCategory,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D5CBB5] bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#3A4E3E] font-medium mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingProduct.price || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D5CBB5] bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#3A4E3E] font-medium mb-1">Compare-at Price (₹, optional)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.compareAtPrice || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        compareAtPrice: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D5CBB5] bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#3A4E3E] font-medium mb-1">Initial Stock Quantity</label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.stockQuantity ?? 10}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stockQuantity: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D5CBB5] bg-white font-mono"
                  />
                </div>

                {/* Product Multi-Image Section (3–4 Views: Front, Side, Detail, Setting) */}
                <div className="sm:col-span-2 space-y-4 p-4.5 bg-[#F5EFE0]/80 rounded-2xl border border-[#E3DAC4]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3DAC4] pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="block text-[#1B4332] font-bold text-xs">
                          Product Multi-Angle Images (3–4 Views)
                        </label>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          (editingProduct.imageUrls?.length || 0) >= 3
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {editingProduct.imageUrls?.length || 0} / 4 Recommended Views
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C7061] mt-0.5">
                        Add 3 to 4 distinct views (Front View, Side Angle, Close-up Detail, Context) so customers see the product from every angle.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        uploadTargetIndex.current = -1;
                        fileInputRef.current?.click();
                      }}
                      disabled={uploadingImage}
                      className="px-3 py-1.5 bg-[#1B4332] text-white text-xs font-semibold rounded-xl hover:bg-[#143225] flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>{uploadingImage && uploadTargetIndex.current === -1 ? 'Uploading...' : 'Upload View Image'}</span>
                    </button>
                  </div>

                  {/* Native Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />

                  {imageUploadError && (
                    <div className="text-[11px] text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
                      {imageUploadError}
                    </div>
                  )}

                  {/* Existing Product Images Grid */}
                  {editingProduct.imageUrls && editingProduct.imageUrls.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {editingProduct.imageUrls.map((imgUrl, idx) => {
                        let defaultSlotLabel = 'View 1: Front View (Primary storefront card image)';
                        if (idx === 1) defaultSlotLabel = 'View 2: Side Angle View';
                        else if (idx === 2) defaultSlotLabel = 'View 3: Close-up / Craft Detail';
                        else if (idx === 3) defaultSlotLabel = 'View 4: In-Room Setting / Context';
                        else if (idx >= 4) defaultSlotLabel = `View ${idx + 1}: Additional Angle`;

                        if (imgUrl.includes('_angle')) defaultSlotLabel = `View ${idx + 1}: Side Angle View`;
                        else if (imgUrl.includes('_detail')) defaultSlotLabel = `View ${idx + 1}: Craft Detail & Texture`;
                        else if (imgUrl.includes('_context')) defaultSlotLabel = `View ${idx + 1}: In-Room Setting / Context`;

                        return (
                          <div
                            key={idx}
                            className={`p-3 bg-white rounded-xl border transition-all ${
                              idx === 0
                                ? 'border-[#1B4332] ring-1 ring-[#1B4332]/20 shadow-2xs'
                                : 'border-[#D5CBB5]'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#F5F1E8] border border-[#EAE3D2] shrink-0">
                                <img
                                  src={formatProductImageUrl(imgUrl)}
                                  alt={`Product View ${idx + 1}`}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                  onError={(e) => handleImageError(e, '/images/home_decor_brass_vase_1791727457022.jpg')}
                                />
                                {idx === 0 && (
                                  <span className="absolute top-0.5 left-0.5 bg-[#1B4332] text-[#D4AF37] text-[8px] font-bold px-1 rounded-xs">
                                    MAIN
                                  </span>
                                )}
                              </div>

                              <div className="flex-1 min-w-0 space-y-1">
                                <span className="block text-[11px] font-bold text-[#1B4332] truncate">
                                  {defaultSlotLabel}
                                </span>
                                <p className="text-[10px] text-[#55695C] truncate font-mono">
                                  {imgUrl}
                                </p>

                                <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px]">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      uploadTargetIndex.current = idx;
                                      fileInputRef.current?.click();
                                    }}
                                    className="font-semibold text-[#1B4332] hover:underline cursor-pointer"
                                  >
                                    Replace
                                  </button>

                                  {idx > 0 && (
                                    <>
                                      <span className="text-[#C4B79F]">·</span>
                                      <button
                                        type="button"
                                        onClick={() => handleSetPrimarySlot(idx)}
                                        className="font-semibold text-[#8A7642] hover:underline cursor-pointer"
                                        title="Make this image the main card view"
                                      >
                                        Set as Primary
                                      </button>
                                    </>
                                  )}

                                  <span className="text-[#C4B79F]">·</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImageSlot(idx)}
                                    className="font-semibold text-red-600 hover:underline cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        uploadTargetIndex.current = -1;
                        fileInputRef.current?.click();
                      }}
                      className="border-2 border-dashed border-[#D5CBB5] hover:border-[#1B4332] bg-white/70 hover:bg-white rounded-xl p-5 text-center cursor-pointer transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <ImageIcon className="w-7 h-7 text-[#788C7E]" />
                        <span className="text-xs font-semibold text-[#1B4332]">
                          No images selected. Click to upload 3 to 4 product views from your computer.
                        </span>
                        <span className="text-[10px] text-[#8C9E91]">
                          Upload JPG, JPEG, PNG, or WEBP photos for front, side, and detail views.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Add Image via URL or Path */}
                  <div className="pt-2 border-t border-[#EAE3D2] flex flex-col sm:flex-row gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Or enter image URL / path (e.g. /images/... or https://...)"
                      value={manualUrlInput}
                      onChange={(e) => setManualUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddManualUrl();
                        }
                      }}
                      className="w-full sm:flex-1 px-3 py-2 rounded-xl border border-[#D5CBB5] bg-white font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualUrl}
                      disabled={!manualUrlInput.trim()}
                      className="px-3.5 py-2 bg-[#FAF7F0] hover:bg-[#EFE8D8] text-[#1B4332] font-semibold text-xs border border-[#D5CBB5] rounded-xl transition-colors cursor-pointer disabled:opacity-40 shrink-0 w-full sm:w-auto"
                    >
                      + Add URL View
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[#3A4E3E] font-medium mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editingProduct.description || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, description: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D5CBB5] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[#3A4E3E] font-medium mb-1">Material Details</label>
                  <input
                    type="text"
                    placeholder="e.g. Pure Brass & Ceramic"
                    value={editingProduct.material || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, material: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D5CBB5] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[#3A4E3E] font-medium mb-1">Dimensions</label>
                  <input
                    type="text"
                    placeholder="e.g. 25cm x 15cm"
                    value={editingProduct.dimensions || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, dimensions: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D5CBB5] bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#EAE3D2]">
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="px-4 py-2 border border-[#D5CBB5] text-[#445648] rounded-xl hover:bg-[#FAF8F3] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2 bg-[#1B4332] text-white font-semibold rounded-xl hover:bg-[#143225] disabled:opacity-50"
                >
                  {savingProduct ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
