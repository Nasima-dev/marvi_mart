import { Router } from 'express';
import fs from 'fs';
import path from 'path';

/**
 * Persists base64 image data to public/uploads directory.
 * Returns public URL path /uploads/<filename> or null if invalid.
 */
export function saveBase64Image(dataUri: string, originalName?: string): string | null {
  try {
    const matches = dataUri.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
    if (!matches) return null;

    const mime = matches[1].toLowerCase();
    const ext = mime === 'jpeg' ? 'jpg' : mime;
    const base64Data = matches[2];

    const cleanBase = (originalName || 'product')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);

    const safeName = `product-upload-${Date.now()}-${Math.floor(Math.random() * 10000)}-${cleanBase}.${ext}`;
    const uploadsDir = path.resolve(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    return `/uploads/${safeName}`;
  } catch (err) {
    console.error('[Upload Helper Error] Failed to persist image:', err);
    return null;
  }
}
import {
  fetchProducts,
  fetchProductById,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
  createOrder,
  fetchOrders,
  fetchOrderByIdOrRef,
  updateOrderStatus,
  updateOrderPaymentStatus,
  calculateAdminStats,
  getDbStatus,
} from './db';
import {
  checkAdminPassword,
  generateAdminToken,
  requireAdmin,
} from './auth';
import {
  isPhonePeConfigured,
  getPhonePeConfig,
  initiatePhonePePayment,
  checkPhonePePaymentStatus,
  verifyPhonePeCallbackSignature,
} from './phonepe';

export const apiRouter = Router();

// ----------------------------------------------------------------------
// Public Health & System Info
// ----------------------------------------------------------------------
apiRouter.get('/health', async (req, res) => {
  const dbStatus = getDbStatus();
  res.json({
    status: 'ok',
    storeName: 'Marvi Mart',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    paymentGateway: {
      provider: 'Cash on Delivery (Active)',
      phonepeArchitectureReady: true,
      mode: 'cod-first',
    },
  });
});

// ----------------------------------------------------------------------
// Public Product Catalog
// ----------------------------------------------------------------------
apiRouter.get('/products', async (req, res) => {
  try {
    const { category, search, sort, minPrice, maxPrice, inStockOnly, page, limit } = req.query;

    const result = await fetchProducts({
      category: category ? String(category) : undefined,
      search: search ? String(search) : undefined,
      sort: sort ? String(sort) : 'newest',
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStockOnly: inStockOnly === 'true',
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 24,
      includeInactive: false,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to retrieve products catalog.' });
  }
});

apiRouter.get('/products/:id', async (req, res) => {
  try {
    const product = await fetchProductById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found or currently unavailable.' });
    }
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve product details.' });
  }
});

// ----------------------------------------------------------------------
// Public Checkout & Orders
// ----------------------------------------------------------------------
apiRouter.post('/orders', async (req, res) => {
  try {
    const { customer, items, couponCode, paymentMethod = 'Cash on Delivery' } = req.body;
    if (!customer || !items) {
      return res.status(400).json({ error: 'Missing customer details or items payload.' });
    }

    // Validate payment method
    const allowedMethods = ['Cash on Delivery', 'PhonePe Online', 'Online Payment'];
    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method selected.' });
    }

    // If customer selected online payment but PhonePe is not configured, prevent online order creation
    if ((paymentMethod === 'PhonePe Online' || paymentMethod === 'Online Payment') && !isPhonePeConfigured()) {
      return res.status(400).json({
        error:
          'Online payments are currently in setup mode. Please select Cash on Delivery to complete your purchase.',
      });
    }

    const result = await createOrder({ customer, items, couponCode, paymentMethod });
    if (!result.success || !result.order) {
      return res.status(400).json({ error: result.error || 'Failed to place order.' });
    }

    // If online payment is configured, initiate PhonePe checkout session
    let paymentInitiation: any = null;
    if (paymentMethod === 'PhonePe Online' || paymentMethod === 'Online Payment') {
      paymentInitiation = await initiatePhonePePayment({
        orderId: result.order.id,
        orderReference: result.order.orderReference,
        amountInRupees: result.order.totalAmount,
        customerMobile: result.order.customer.phone,
        customerEmail: result.order.customer.email,
      });
    }

    res.status(201).json({
      success: true,
      order: result.order,
      paymentInitiation,
      message:
        paymentMethod === 'Cash on Delivery'
          ? 'Order placed successfully with Cash on Delivery.'
          : 'Order placed. Redirecting to PhonePe payment gateway...',
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Internal server error processing checkout.' });
  }
});

// ----------------------------------------------------------------------
// Future PhonePe Payment Gateway Integration Endpoints
// ----------------------------------------------------------------------

/**
 * Public Gateway Status: Returns PhonePe readiness and configured payment modes.
 * Never leaks salt keys or secrets.
 */
apiRouter.get('/payments/phonepe/status', (req, res) => {
  const isConfigured = isPhonePeConfigured();
  const config = getPhonePeConfig();

  res.json({
    gateway: 'PhonePe',
    isConfigured,
    environment: config.env,
    mode: isConfigured ? 'Live Gateway Ready' : 'Coming Soon / Setup Mode',
    supportedPaymentMethods: ['Cash on Delivery (Active)', ...(isConfigured ? ['PhonePe UPI & Cards'] : [])],
    message: isConfigured
      ? 'PhonePe Payment Gateway is configured and ready.'
      : 'PhonePe integration architecture is ready. Online payment option will activate when merchant credentials are set.',
  });
});

/**
 * Server-to-Server Callback / Webhook endpoint from PhonePe.
 * Verifies X-VERIFY signature and updates order status authoritatively.
 */
apiRouter.post('/payments/phonepe/callback', async (req, res) => {
  try {
    const receivedChecksum = req.headers['x-verify'] as string;
    const { response } = req.body;

    if (!response || !receivedChecksum) {
      return res.status(400).json({ success: false, message: 'Missing response payload or signature header.' });
    }

    // Strict signature check
    const isValidSignature = verifyPhonePeCallbackSignature(response, receivedChecksum);
    if (!isValidSignature) {
      console.warn('[PhonePe Callback] Rejected invalid signature attempt');
      return res.status(401).json({ success: false, message: 'Invalid signature checksum.' });
    }

    // Decode PhonePe callback payload
    const decodedString = Buffer.from(response, 'base64').toString('utf-8');
    const callbackData = JSON.parse(decodedString);

    const merchantTransactionId = callbackData.data?.merchantTransactionId;
    const transactionStatus = callbackData.code; // e.g. PAYMENT_SUCCESS, PAYMENT_ERROR

    if (merchantTransactionId) {
      // Find order by transaction reference or fetch status directly
      const statusResult = await checkPhonePePaymentStatus(merchantTransactionId);
      if (statusResult.paymentState === 'COMPLETED') {
        await updateOrderPaymentStatus(
          merchantTransactionId,
          'Paid',
          merchantTransactionId,
          'PhonePe server-to-server callback verified payment success.'
        );
      } else if (statusResult.paymentState === 'FAILED') {
        await updateOrderPaymentStatus(
          merchantTransactionId,
          'Failed',
          merchantTransactionId,
          'PhonePe payment failed during callback verification.'
        );
      }
    }

    res.json({ success: true, message: 'Callback processed successfully.' });
  } catch (err: any) {
    console.error('[PhonePe Callback Error]', err);
    res.status(500).json({ success: false, message: 'Internal error processing payment callback.' });
  }
});

/**
 * Verified Payment Status Check for an order / transaction
 * Never trusts client; executes server-side status verification.
 */
apiRouter.get('/payments/phonepe/verify/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required.' });
    }

    const result = await checkPhonePePaymentStatus(transactionId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Error checking payment status.' });
  }
});

apiRouter.get('/orders/track/:reference', async (req, res) => {
  try {
    const order = await fetchOrderByIdOrRef(req.params.reference);
    if (!order) {
      return res.status(404).json({ error: 'Order not found with reference: ' + req.params.reference });
    }

    // Return sanitized customer tracking details
    res.json({
      orderReference: order.orderReference,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      totalAmount: order.totalAmount,
      items: order.items,
      customerCity: order.customer.city,
      customerState: order.customer.state,
      pincode: order.customer.pincode,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      statusHistory: order.statusHistory,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error retrieving order tracking.' });
  }
});

// ----------------------------------------------------------------------
// Admin Authentication
// ----------------------------------------------------------------------
apiRouter.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  const isValid = checkAdminPassword(password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid administrator credentials.' });
  }

  const token = generateAdminToken();
  res.json({
    success: true,
    token,
    message: 'Admin session authenticated successfully.',
  });
});

apiRouter.get('/admin/verify', requireAdmin, (req, res) => {
  res.json({ authenticated: true, role: 'admin' });
});

// ----------------------------------------------------------------------
// Protected Admin Endpoints
// ----------------------------------------------------------------------
apiRouter.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await calculateAdminStats();
    const dbStatus = getDbStatus();
    res.json({ ...stats, database: dbStatus });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compute admin statistics.' });
  }
});

apiRouter.get('/admin/products', requireAdmin, async (req, res) => {
  try {
    const { category, search, page, limit } = req.query;
    const result = await fetchProducts({
      category: category ? String(category) : undefined,
      search: search ? String(search) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 100,
      includeInactive: true,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve admin products.' });
  }
});

/**
 * Admin Image Upload Route
 * Accepts JPG, JPEG, PNG, or WEBP image as base64 data URI.
 * Saves to public/uploads/ and returns permanent static URL.
 */
apiRouter.post('/admin/upload', requireAdmin, async (req, res) => {
  try {
    const { fileData, fileName } = req.body;
    if (!fileData || typeof fileData !== 'string') {
      return res.status(400).json({ error: 'Image fileData is required.' });
    }

    const savedUrl = saveBase64Image(fileData, fileName);
    if (!savedUrl) {
      return res.status(400).json({
        error: 'Invalid image format. Supported formats are JPG, JPEG, PNG, and WEBP.',
      });
    }

    const uploadsDir = path.resolve(process.cwd(), 'public/uploads');
    const localName = path.basename(savedUrl);
    const fullPath = path.join(uploadsDir, localName);
    const stats = fs.existsSync(fullPath) ? fs.statSync(fullPath) : { size: 0 };

    res.json({
      success: true,
      url: savedUrl,
      fileName: localName,
      size: stats.size,
    });
  } catch (error: any) {
    console.error('[Admin Upload Error]', error);
    res.status(500).json({ error: 'Failed to upload image.' });
  }
});

apiRouter.post('/admin/products', requireAdmin, async (req, res) => {
  try {
    const { name, description, category, price, compareAtPrice, imageUrls, stockQuantity, material, dimensions, careInstructions, featured, bestseller } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Product name, category, and price are required.' });
    }

    // Process imageUrls: if base64 data URI was passed, persist it as a file in public/uploads
    let processedImageUrls: string[] = [];
    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      processedImageUrls = imageUrls
        .map((imgUrl) => {
          if (typeof imgUrl === 'string' && imgUrl.startsWith('data:image/')) {
            const savedUrl = saveBase64Image(imgUrl, name);
            return savedUrl || imgUrl;
          }
          return typeof imgUrl === 'string' ? imgUrl.trim() : imgUrl;
        })
        .filter(Boolean);
    }

    if (processedImageUrls.length === 0) {
      processedImageUrls = ['/images/home_decor_brass_vase_1791727457022.jpg'];
    }

    const created = await createProduct({
      name: name.trim(),
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description?.trim() || '',
      category,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      imageUrls: processedImageUrls,
      stockQuantity: stockQuantity ? Number(stockQuantity) : 10,
      isActive: true,
      material: material?.trim(),
      dimensions: dimensions?.trim(),
      careInstructions: careInstructions?.trim(),
      featured: Boolean(featured),
      bestseller: Boolean(bestseller),
    });

    res.status(201).json({ success: true, product: created });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create product.' });
  }
});

apiRouter.put('/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      compareAtPrice,
      imageUrls,
      stockQuantity,
      isActive,
      material,
      dimensions,
      careInstructions,
      featured,
      bestseller,
    } = req.body;

    const sanitizedUpdates: any = {};
    if (name !== undefined) sanitizedUpdates.name = String(name).trim().slice(0, 150);
    if (description !== undefined) sanitizedUpdates.description = String(description).trim().slice(0, 1000);
    if (category !== undefined) sanitizedUpdates.category = category;
    if (price !== undefined) sanitizedUpdates.price = Math.max(1, Number(price));
    if (compareAtPrice !== undefined) sanitizedUpdates.compareAtPrice = compareAtPrice ? Number(compareAtPrice) : undefined;
    if (stockQuantity !== undefined) sanitizedUpdates.stockQuantity = Math.max(0, Math.floor(Number(stockQuantity)));
    if (isActive !== undefined) sanitizedUpdates.isActive = Boolean(isActive);
    if (Array.isArray(imageUrls)) {
      sanitizedUpdates.imageUrls = imageUrls
        .slice(0, 6)
        .map((imgUrl) => {
          if (typeof imgUrl === 'string' && imgUrl.startsWith('data:image/')) {
            const savedUrl = saveBase64Image(imgUrl, name || 'product');
            return savedUrl || imgUrl;
          }
          return typeof imgUrl === 'string' ? imgUrl.trim() : imgUrl;
        })
        .filter(Boolean);
    }
    if (material !== undefined) sanitizedUpdates.material = String(material).trim().slice(0, 150);
    if (dimensions !== undefined) sanitizedUpdates.dimensions = String(dimensions).trim().slice(0, 100);
    if (careInstructions !== undefined) sanitizedUpdates.careInstructions = String(careInstructions).trim().slice(0, 250);
    if (featured !== undefined) sanitizedUpdates.featured = Boolean(featured);
    if (bestseller !== undefined) sanitizedUpdates.bestseller = Boolean(bestseller);

    const updated = await updateProduct(req.params.id, sanitizedUpdates);
    if (!updated) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ success: true, product: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

apiRouter.patch('/admin/products/:id/stock', requireAdmin, async (req, res) => {
  try {
    const { stockQuantity } = req.body;
    if (stockQuantity === undefined || Number(stockQuantity) < 0) {
      return res.status(400).json({ error: 'Valid stock quantity required.' });
    }

    const success = await updateProductStock(req.params.id, Number(stockQuantity));
    if (!success) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json({ success: true, stockQuantity: Number(stockQuantity) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock.' });
  }
});

apiRouter.delete('/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { permanent } = req.query;
    if (permanent === 'true') {
      const deleted = await deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Product not found.' });
      }
      return res.json({ success: true, message: 'Product permanently deleted.' });
    }

    const updated = await updateProduct(req.params.id, { isActive: false });
    if (!updated) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ success: true, message: 'Product deactivated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete/deactivate product.' });
  }
});

apiRouter.get('/admin/orders', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const orders = await fetchOrders(status ? String(status) : undefined);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
});

apiRouter.patch('/admin/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Valid order status required (Confirmed, Processing, Shipped, Delivered, Cancelled).' });
    }

    const sanitizedNote = note ? String(note).replace(/<[^>]*>/g, '').trim().slice(0, 300) : undefined;
    const updated = await updateOrderStatus(req.params.id, status, sanitizedNote);
    if (!updated) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.json({ success: true, order: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

// ----------------------------------------------------------------------
// Safe JSON Fallback for Unmatched /api Routes & Error Middleware
// ----------------------------------------------------------------------
apiRouter.use((req, res) => {
  res.status(404).json({
    error: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}`,
    success: false,
  });
});

apiRouter.use((err: any, req: any, res: any, next: any) => {
  console.error('[API Error]', err);
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    error: err.message || 'Internal API server error.',
    success: false,
  });
});
