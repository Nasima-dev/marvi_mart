import { MongoClient, Db, Collection } from 'mongodb';
import { Product, Order, DatabaseStatus, AdminStats, ProductCategory, OrderStatus } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialProducts';

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let productsCollection: Collection<Product> | null = null;
let ordersCollection: Collection<Order> | null = null;

let isMongoConnected = false;
let mongoConnectionError: string | null = null;

// In-memory fallback stores
let memoryProducts: Product[] = [...INITIAL_PRODUCTS];
let memoryOrders: Order[] = [];

export async function initDatabase(): Promise<DatabaseStatus> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
    mongoConnectionError = 'MONGODB_URI is not configured in environment variables.';
    console.log('[DB] MongoDB URI not set. Running with safe in-memory data store.');
    return {
      connected: false,
      type: 'memory-fallback',
      error: mongoConnectionError || undefined,
    };
  }

  try {
    console.log('[DB] Attempting connection to MongoDB Atlas...');
    mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    await mongoClient.connect();
    // Explicitly target database "marvi_mart" to guarantee strict data separation
    mongoDb = mongoClient.db('marvi_mart');
    const dbName = 'marvi_mart';

    productsCollection = mongoDb.collection<Product>('products');
    ordersCollection = mongoDb.collection<Order>('orders');

    // Create indexes for efficient search & filtering
    await productsCollection.createIndex({ id: 1 }, { unique: true });
    await productsCollection.createIndex({ category: 1, isActive: 1 });
    await productsCollection.createIndex({ name: 'text', description: 'text' });
    await ordersCollection.createIndex({ orderReference: 1 }, { unique: true });
    await ordersCollection.createIndex({ createdAt: -1 });

    // Seed/sync products: ensure all defined catalog products exist without deleting or altering any existing ones
    for (const p of INITIAL_PRODUCTS) {
      await productsCollection.updateOne(
        { id: p.id },
        { $setOnInsert: p },
        { upsert: true }
      );
      // Ensure multi-angle image sets are updated and normalized to production /images/
      const existing = await productsCollection.findOne({ id: p.id });
      if (existing) {
        const hasLegacyPaths = existing.imageUrls?.some((u: string) => u.includes('/src/assets/images/'));
        const hasFewerImages = !existing.imageUrls || existing.imageUrls.length <= 1;
        if (hasLegacyPaths || hasFewerImages) {
          const updatedUrls = p.imageUrls.map((u: string) => u.replace(/^\/src\/assets\/images\//, '/images/'));
          await productsCollection.updateOne(
            { id: p.id },
            { $set: { imageUrls: updatedUrls } }
          );
        }
      }
    }
    const finalCount = await productsCollection.countDocuments();
    console.log(`[DB] Database "marvi_mart" catalog verified with ${finalCount} total products.`);

    isMongoConnected = true;
    mongoConnectionError = null;
    console.log(`[DB] Successfully connected to MongoDB Atlas database "${dbName}".`);

    return {
      connected: true,
      type: 'mongodb',
      databaseName: dbName,
    };
  } catch (err: any) {
    isMongoConnected = false;
    // Sanitize error: never leak connection string, credentials or cluster hostname
    mongoConnectionError = 'Unable to connect to MongoDB cluster. Operating in memory fallback mode.';
    console.warn('[DB] MongoDB Atlas connection error (sanitized):', mongoConnectionError);

    return {
      connected: false,
      type: 'memory-fallback',
      error: mongoConnectionError,
    };
  }
}

export function getDbStatus(): DatabaseStatus {
  if (isMongoConnected && mongoDb) {
    return {
      connected: true,
      type: 'mongodb',
      databaseName: mongoDb.databaseName,
    };
  }
  return {
    connected: false,
    type: 'memory-fallback',
    error: mongoConnectionError || 'Running in local persistent memory mode',
  };
}

// ----------------------------------------------------------------------
// Unified Product Operations
// ----------------------------------------------------------------------

export interface ProductQueryOptions {
  category?: string;
  search?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

export async function fetchProducts(options: ProductQueryOptions = {}) {
  const {
    category,
    search,
    sort = 'newest',
    minPrice,
    maxPrice,
    inStockOnly = false,
    page = 1,
    limit = 24,
    includeInactive = false,
  } = options;

  if (isMongoConnected && productsCollection) {
    const filter: any = {};
    if (!includeInactive) {
      filter.isActive = true;
    }
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (inStockOnly) {
      filter.stockQuantity = { $gt: 0 };
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { description: regex }, { category: regex }];
    }

    let sortObj: any = { createdAt: -1 };
    if (sort === 'price-low' || sort === 'price-asc') sortObj = { price: 1 };
    else if (sort === 'price-high' || sort === 'price-desc') sortObj = { price: -1 };
    else if (sort === 'name') sortObj = { name: 1 };
    else if (sort === 'bestseller') sortObj = { bestseller: -1, price: 1 };

    const skip = (page - 1) * limit;
    const total = await productsCollection.countDocuments(filter);
    const products = await productsCollection
      .find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .toArray();

    return {
      products: products.map((p) => {
        const { _id, ...clean } = p as any;
        return clean as Product;
      }),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Memory Fallback
  let items = memoryProducts.filter((p) => {
    if (!includeInactive && !p.isActive) return false;
    if (category && category !== 'All' && p.category !== category) return false;
    if (inStockOnly && p.stockQuantity <= 0) return false;
    if (minPrice !== undefined && p.price < minPrice) return false;
    if (maxPrice !== undefined && p.price > maxPrice) return false;
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Sorting
  if (sort === 'price-low' || sort === 'price-asc') {
    items.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-high' || sort === 'price-desc') {
    items.sort((a, b) => b.price - a.price);
  } else if (sort === 'name') {
    items.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'bestseller') {
    items.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));
  } else {
    items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  const total = items.length;
  const skip = (page - 1) * limit;
  const paginated = items.slice(skip, skip + limit);

  return {
    products: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function fetchProductById(id: string): Promise<Product | null> {
  if (isMongoConnected && productsCollection) {
    const item = await productsCollection.findOne({
      $or: [{ id }, { slug: id }],
    });
    if (!item) return null;
    const { _id, ...clean } = item as any;
    return clean as Product;
  }
  return memoryProducts.find((p) => p.id === id || p.slug === id) || null;
}

export async function createProduct(productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const newProduct: Product = {
    ...productData,
    id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    slug: productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isMongoConnected && productsCollection) {
    await productsCollection.insertOne(newProduct as any);
  }
  memoryProducts.unshift(newProduct);
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  const timestamp = new Date().toISOString();
  const sanitizedUpdates = { ...updates, updatedAt: timestamp };

  if (isMongoConnected && productsCollection) {
    const res = await productsCollection.findOneAndUpdate(
      { id },
      { $set: sanitizedUpdates },
      { returnDocument: 'after' }
    );
    if (!res) return null;
    const { _id, ...clean } = res as any;
    return clean as Product;
  }

  const idx = memoryProducts.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  memoryProducts[idx] = { ...memoryProducts[idx], ...sanitizedUpdates };
  return memoryProducts[idx];
}

export async function updateProductStock(id: string, newStock: number): Promise<boolean> {
  if (newStock < 0) return false;
  if (isMongoConnected && productsCollection) {
    const res = await productsCollection.updateOne(
      { id },
      { $set: { stockQuantity: newStock, updatedAt: new Date().toISOString() } }
    );
    return res.matchedCount > 0;
  }
  const item = memoryProducts.find((p) => p.id === id);
  if (!item) return false;
  item.stockQuantity = newStock;
  item.updatedAt = new Date().toISOString();
  return true;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (isMongoConnected && productsCollection) {
    const res = await productsCollection.deleteOne({ id });
    return res.deletedCount > 0;
  }
  const idx = memoryProducts.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  memoryProducts.splice(idx, 1);
  return true;
}

// ----------------------------------------------------------------------
// Orders Operations
// ----------------------------------------------------------------------

function sanitizeText(str: string | undefined, maxLength = 150): string {
  if (typeof str !== 'string') return '';
  // Strip HTML tags and control characters
  return str.replace(/<[^>]*>/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, maxLength);
}

export async function createOrder(orderPayload: {
  customer: Order['customer'];
  items: { productId: string; quantity: number }[];
  couponCode?: string;
  paymentMethod?: 'Cash on Delivery' | 'PhonePe Online' | 'Online Payment';
}): Promise<{ success: boolean; order?: Order; error?: string }> {
  const { customer, items, couponCode, paymentMethod = 'Cash on Delivery' } = orderPayload;

  if (!customer || typeof customer !== 'object') {
    return { success: false, error: 'Customer details are required.' };
  }

  const fullName = sanitizeText(customer.fullName, 80);
  const flatHouse = sanitizeText(customer.flatHouse, 120);
  const streetArea = sanitizeText(customer.streetArea, 120);
  const landmark = sanitizeText(customer.landmark, 80);
  const city = sanitizeText(customer.city, 60);
  const state = sanitizeText(customer.state, 60);
  const email = customer.email ? sanitizeText(customer.email, 80).toLowerCase() : undefined;
  const addressType = customer.addressType === 'Office' ? 'Office' : 'Home';

  if (!fullName || fullName.length < 2) {
    return { success: false, error: 'Please enter a valid full name.' };
  }
  if (!flatHouse || !streetArea || !city || !state) {
    return { success: false, error: 'Please complete all required delivery address fields.' };
  }

  // Validate phone format: 10-digit Indian mobile starting with 6, 7, 8, or 9
  const phoneClean = (customer.phone || '').replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(phoneClean)) {
    return { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
  }

  // Validate 6-digit Indian PIN code (cannot start with 0)
  const pinClean = (customer.pincode || '').replace(/\D/g, '');
  if (!/^[1-9]\d{5}$/.test(pinClean)) {
    return { success: false, error: 'Please enter a valid 6-digit Indian postal PIN code.' };
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return { success: false, error: 'Your cart is empty or exceeds order limits.' };
  }

  // Authoritative server-side price, stock, and item validation
  let subtotal = 0;
  const validatedItems: Order['items'] = [];

  for (const reqItem of items) {
    const qty = Math.floor(Number(reqItem.quantity));
    if (!Number.isInteger(qty) || qty <= 0 || qty > 25) {
      return { success: false, error: 'Invalid item quantity.' };
    }

    const product = await fetchProductById(String(reqItem.productId));
    if (!product || !product.isActive) {
      return { success: false, error: `Product "${reqItem.productId}" is no longer available.` };
    }
    if (product.stockQuantity < qty) {
      return {
        success: false,
        error: `Only ${product.stockQuantity} units available for "${product.name}".`,
      };
    }

    subtotal += product.price * qty;
    validatedItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
      image: product.imageUrls[0] || '',
    });
  }

  if (validatedItems.length === 0) {
    return { success: false, error: 'No valid items in order.' };
  }

  // Free standard shipping above ₹999 across India, otherwise ₹79
  const shippingFee = subtotal >= 999 ? 0 : 79;

  // Server-authoritative coupon discount evaluation
  let discountAmount = 0;
  if (couponCode) {
    const cleanCode = couponCode.trim().toUpperCase();
    if (cleanCode === 'MARVI100' && subtotal >= 800) {
      discountAmount = 100;
    } else if (cleanCode === 'WELCOME50' && subtotal >= 499) {
      discountAmount = 50;
    } else if (cleanCode === 'DECOR10' && subtotal >= 1000) {
      discountAmount = Math.round(subtotal * 0.1);
    }
  }

  const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

  const now = new Date();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const orderRef = `MM-${now.getFullYear()}-${randomSuffix}`;

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    orderReference: orderRef,
    customer: {
      fullName,
      phone: phoneClean,
      email,
      flatHouse,
      streetArea,
      landmark: landmark || undefined,
      city,
      state,
      pincode: pinClean,
      addressType,
    },
    items: validatedItems,
    subtotal,
    shippingFee,
    discountAmount,
    totalAmount,
    paymentMethod,
    paymentStatus: 'Pending',
    orderStatus: paymentMethod === 'Cash on Delivery' ? 'Confirmed' : 'Pending',
    statusHistory: [
      {
        status: paymentMethod === 'Cash on Delivery' ? 'Confirmed' : 'Pending',
        timestamp: now.toISOString(),
        note:
          paymentMethod === 'Cash on Delivery'
            ? 'Order placed via Cash on Delivery. Awaiting dispatch preparation.'
            : 'Order initialized for Online Payment. Awaiting payment gateway verification.',
      },
    ],
    createdAt: now.toISOString(),
  };

  // Decrement product stock safely
  for (const item of validatedItems) {
    const prod = await fetchProductById(item.productId);
    if (prod) {
      const remaining = Math.max(0, prod.stockQuantity - item.quantity);
      await updateProductStock(prod.id, remaining);
    }
  }

  if (isMongoConnected && ordersCollection) {
    try {
      await ordersCollection.insertOne(newOrder as any);
    } catch (dbErr) {
      console.error('[DB] Failed to save order to MongoDB Atlas:', dbErr);
      return { success: false, error: 'Unable to record order in database. Please try again.' };
    }
  } else {
    memoryOrders.unshift(newOrder);
  }

  return { success: true, order: newOrder };
}

export async function fetchOrders(status?: string): Promise<Order[]> {
  if (isMongoConnected && ordersCollection) {
    const query: any = status && status !== 'All' ? { orderStatus: status } : {};
    const docs = await ordersCollection.find(query).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => {
      const { _id, ...clean } = d as any;
      return clean as Order;
    });
  }

  if (status && status !== 'All') {
    return memoryOrders.filter((o) => o.orderStatus === status);
  }
  return memoryOrders;
}

export async function fetchOrderByIdOrRef(identifier: string): Promise<Order | null> {
  const cleanId = identifier.trim().toUpperCase();
  if (isMongoConnected && ordersCollection) {
    const doc = await ordersCollection.findOne({
      $or: [{ id: identifier }, { orderReference: cleanId }, { orderReference: identifier }],
    });
    if (!doc) return null;
    const { _id, ...clean } = doc as any;
    return clean as Order;
  }

  return (
    memoryOrders.find(
      (o) =>
        o.id === identifier ||
        o.orderReference === cleanId ||
        o.orderReference === identifier
    ) || null
  );
}

export async function updateOrderStatus(
  id: string,
  newStatus: OrderStatus,
  note?: string
): Promise<Order | null> {
  const historyEntry = {
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: note || `Order status updated to ${newStatus}`,
  };

  const paymentStatus = newStatus === 'Delivered' ? 'Paid' : undefined;

  if (isMongoConnected && ordersCollection) {
    const updateObj: any = {
      $set: { orderStatus: newStatus },
      $push: { statusHistory: historyEntry },
    };
    if (paymentStatus) {
      updateObj.$set.paymentStatus = paymentStatus;
    }

    const res = await ordersCollection.findOneAndUpdate(
      { $or: [{ id }, { orderReference: id }] },
      updateObj,
      { returnDocument: 'after' }
    );
    if (!res) return null;
    const { _id, ...clean } = res as any;
    return clean as Order;
  }

  const order = memoryOrders.find((o) => o.id === id || o.orderReference === id);
  if (!order) return null;
  order.orderStatus = newStatus;
  if (paymentStatus) order.paymentStatus = paymentStatus;
  order.statusHistory.push(historyEntry);
  return order;
}

export async function updateOrderPaymentStatus(
  id: string,
  newPaymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Cancelled',
  transactionId?: string,
  note?: string
): Promise<Order | null> {
  const newOrderStatus: OrderStatus =
    newPaymentStatus === 'Paid' ? 'Confirmed' : newPaymentStatus === 'Cancelled' ? 'Cancelled' : 'Pending';

  const historyEntry = {
    status: newOrderStatus,
    timestamp: new Date().toISOString(),
    note:
      note ||
      `Payment status updated to ${newPaymentStatus}${transactionId ? ` (Txn: ${transactionId})` : ''}`,
  };

  if (isMongoConnected && ordersCollection) {
    const updateObj: any = {
      $set: {
        paymentStatus: newPaymentStatus,
        orderStatus: newOrderStatus,
      },
      $push: { statusHistory: historyEntry },
    };
    if (transactionId) {
      updateObj.$set.paymentTransactionId = transactionId;
    }

    const res = await ordersCollection.findOneAndUpdate(
      { $or: [{ id }, { orderReference: id }] },
      updateObj,
      { returnDocument: 'after' }
    );
    if (!res) return null;
    const { _id, ...clean } = res as any;
    return clean as Order;
  }

  const order = memoryOrders.find((o) => o.id === id || o.orderReference === id);
  if (!order) return null;
  order.paymentStatus = newPaymentStatus;
  order.orderStatus = newOrderStatus;
  if (transactionId) {
    order.paymentTransactionId = transactionId;
  }
  order.statusHistory.push(historyEntry);
  return order;
}

export async function calculateAdminStats(): Promise<AdminStats> {
  const orders = await fetchOrders();
  const { products } = await fetchProducts({ includeInactive: true, limit: 1000 });

  const totalRevenue = orders.reduce((sum, ord) => {
    // Only count non-cancelled orders towards revenue
    if (ord.orderStatus !== 'Cancelled') {
      return sum + ord.totalAmount;
    }
    return sum;
  }, 0);

  const activeProductsCount = products.filter((p) => p.isActive).length;
  const lowStockCount = products.filter((p) => p.stockQuantity < 5).length;

  return {
    totalRevenue,
    totalOrders: orders.length,
    activeProductsCount,
    lowStockCount,
    recentOrdersCount: orders.slice(0, 10).length,
  };
}
