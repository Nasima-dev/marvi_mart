import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { apiRouter } from '../src/server/routes';
import { initDatabase, getDbStatus, fetchProducts, createOrder, fetchOrderByIdOrRef } from '../src/server/db';
import { checkAdminPassword, generateAdminToken, validateAdminToken } from '../src/server/auth';

interface TestRecord {
  section: string;
  test: string;
  passed: boolean;
  notes: string;
}

const auditLog: TestRecord[] = [];

function record(section: string, test: string, passed: boolean, notes: string) {
  auditLog.push({ section, test, passed, notes });
  const statusStr = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${statusStr}] [${section}] ${test}: ${notes}`);
}

function makeRequest(
  port: number,
  method: string,
  urlPath: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders: Record<string, string> = { ...headers };
    if (postData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData).toString();
    }

    const options: http.RequestOptions = {
      hostname: '127.0.0.1',
      port,
      path: urlPath,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        let parsed: any = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = raw;
        }
        resolve({ status: res.statusCode || 500, data: parsed, headers: res.headers });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runSecurityAudit() {
  console.log('================================================================');
  console.log(' MARVI MART - ADMIN ACCESS & SECURITY AUDIT TEST SUITE');
  console.log('================================================================\n');

  await initDatabase();

  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3002;

  try {
    // -------------------------------------------------------------
    // SECTION 1: Frontend Code Inspection (Zero Secrets in Frontend)
    // -------------------------------------------------------------
    console.log('--- Section 1: Code Security & Leak Inspection ---');
    const frontendDirs = ['src/components', 'src/pages', 'src/context', 'src/services', 'src/data'];
    let secretsFound = 0;

    for (const dir of frontendDirs) {
      const fullDir = path.resolve(process.cwd(), dir);
      if (fs.existsSync(fullDir)) {
        const files = fs.readdirSync(fullDir);
        for (const file of files) {
          if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(path.join(fullDir, file), 'utf-8');
            // Check for actual hardcoded database secrets or credentials
            if (content.includes('mongodb+srv://') && !content.includes('[username]')) {
              secretsFound++;
              record('Frontend Secrets', `${file} MongoDB string check`, false, 'Exposes live MongoDB connection string');
            }
            if (content.includes('marvi@admin2026') || content.includes('marvimart_secret_token_key')) {
              secretsFound++;
              record('Frontend Secrets', `${file} Hardcoded Password check`, false, 'Contains hardcoded admin password');
            }
          }
        }
      }
    }

    record(
      'Frontend Secrets',
      'No Hardcoded Passwords or Connection Strings in Frontend Code',
      secretsFound === 0,
      secretsFound === 0 ? 'Verified: Zero admin secrets or MongoDB strings in client code' : 'Failed secrets audit'
    );

    // Verify Header.tsx does not contain unconditional public Admin buttons
    const headerContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/Header.tsx'), 'utf-8');
    const headerHasPublicDesktopAdmin = headerContent.includes(`{/* Admin Portal Shortcut */}\n            <button\n              onClick={() => onNavigate('admin')}`);
    const headerHasConditionalAdmin = headerContent.includes('isAuthenticated && role === \'admin\'');

    record(
      'Header Visibility',
      'Admin Button Removed from Public Header for Unauthenticated Visitors',
      !headerHasPublicDesktopAdmin && headerHasConditionalAdmin,
      'Admin button is protected by isAuthenticated && role === "admin"'
    );

    // Verify Footer.tsx has removed public Admin Dashboard link
    const footerContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/Footer.tsx'), 'utf-8');
    const footerHasConditionalAdmin = footerContent.includes('isAuthenticated && role === \'admin\'');
    record(
      'Footer Visibility',
      'Admin Dashboard Link Removed from Public Footer',
      footerHasConditionalAdmin,
      'Footer admin dashboard link is rendered only for authenticated sessions'
    );

    // -------------------------------------------------------------
    // SECTION 2: Public Customer Experience & Privacy Protection
    // -------------------------------------------------------------
    console.log('\n--- Section 2: Public Customer Access & Data Isolation ---');

    // 2.1 Public Product Catalog
    const publicProds = await makeRequest(port, 'GET', '/api/products?limit=6');
    record(
      'Customer Access',
      'Public Catalog Access (GET /api/products)',
      publicProds.status === 200 && Array.isArray(publicProds.data?.products),
      `Public catalog retrieved ${publicProds.data?.products?.length} products`
    );

    // 2.2 Place a genuine sample order via Cash on Delivery
    const orderRes = await makeRequest(port, 'POST', '/api/orders', {
      customer: {
        fullName: 'Meera Sharma',
        phone: '9876543210',
        email: 'meera.sample@testmart.in',
        flatHouse: 'Flat 402, Lotus Enclave',
        streetArea: 'Bapu Nagar',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302015',
      },
      items: [{ productId: 'prod-001', quantity: 1 }],
      paymentMethod: 'Cash on Delivery',
    });

    const orderCreated = orderRes.status === 201 && orderRes.data?.success && !!orderRes.data?.order;
    const testOrderRef = orderRes.data?.order?.orderReference;
    record(
      'Customer Checkout',
      'Cash on Delivery Checkout (POST /api/orders)',
      orderCreated,
      `Order generated reference: ${testOrderRef}, total: ₹${orderRes.data?.order?.totalAmount}`
    );

    // 2.3 Public tracking sanitized - must NOT leak customer street address or phone
    const trackRes = await makeRequest(port, 'GET', `/api/orders/track/${testOrderRef}`);
    const trackData = trackRes.data;
    const dataLeakFree =
      trackRes.status === 200 &&
      trackData.orderReference === testOrderRef &&
      !trackData.customerPhone &&
      !trackData.address &&
      !trackData.email;

    record(
      'Customer Privacy',
      'Order Tracking Privacy (GET /api/orders/track/:ref)',
      dataLeakFree,
      'Public tracking strictly sanitizes customer private address and phone number'
    );

    // -------------------------------------------------------------
    // SECTION 3: Direct Access Protection (Unauthenticated Denied)
    // -------------------------------------------------------------
    console.log('\n--- Section 3: Protected Admin Routes (Unauthenticated Rejections) ---');

    const protectedEndpoints = [
      { method: 'GET', path: '/api/admin/verify', name: 'Admin Verify Endpoint' },
      { method: 'GET', path: '/api/admin/stats', name: 'Admin Stats Dashboard' },
      { method: 'GET', path: '/api/admin/products', name: 'Admin Products Inventory' },
      { method: 'POST', path: '/api/admin/products', name: 'Admin Product Creation', body: { name: 'Unauthorized Item' } },
      { method: 'GET', path: '/api/admin/orders', name: 'Admin Orders Access' },
      { method: 'PATCH', path: `/api/admin/orders/${testOrderRef}/status`, name: 'Admin Order Status Transition', body: { status: 'Confirmed' } },
    ];

    for (const ep of protectedEndpoints) {
      const res = await makeRequest(port, ep.method, ep.path, ep.body);
      record(
        'Route Guard',
        `Unauthenticated ${ep.method} ${ep.path}`,
        res.status === 401,
        `Correctly rejected unauthorized customer with HTTP 401: ${res.data?.error || 'Unauthorized'}`
      );
    }

    // -------------------------------------------------------------
    // SECTION 4: Admin Authentication & Role Validation
    // -------------------------------------------------------------
    console.log('\n--- Section 4: Admin Authentication & Role-Based Checks ---');

    // 4.1 Invalid password rejection
    const badLogin = await makeRequest(port, 'POST', '/api/admin/login', { password: 'incorrect_sample_pass' });
    record(
      'Authentication',
      'Invalid Administrator Password Rejected',
      badLogin.status === 401,
      `Rejected with HTTP 401: ${badLogin.data?.error}`
    );

    // 4.2 Empty password rejection
    const emptyLogin = await makeRequest(port, 'POST', '/api/admin/login', { password: '' });
    record(
      'Authentication',
      'Empty Password Rejected',
      emptyLogin.status === 400,
      `Rejected with HTTP 400: ${emptyLogin.data?.error}`
    );

    // 4.3 Valid Admin Login
    const validPassword = process.env.ADMIN_PASSWORD || 'marvi@admin2026';
    const goodLogin = await makeRequest(port, 'POST', '/api/admin/login', { password: validPassword });
    const loginOk = goodLogin.status === 200 && !!goodLogin.data?.token;
    const adminToken = goodLogin.data?.token;

    record(
      'Authentication',
      'Authorized Store Owner Authentication',
      loginOk,
      'Successfully authenticated and issued HMAC signed session token'
    );

    // 4.4 Verify token role
    const verifyRes = await makeRequest(port, 'GET', '/api/admin/verify', undefined, {
      Authorization: `Bearer ${adminToken}`,
    });
    const verifiedAdmin = verifyRes.status === 200 && verifyRes.data?.authenticated === true && verifyRes.data?.role === 'admin';
    record(
      'Role Authorization',
      'Explicit Admin Role Verification (GET /api/admin/verify)',
      verifiedAdmin,
      `Session authenticated with explicit role: "${verifyRes.data?.role}"`
    );

    // 4.5 Tampered signature rejected
    const tamperedToken = adminToken.slice(0, -6) + 'xxxxxx';
    const tamperedRes = await makeRequest(port, 'GET', '/api/admin/verify', undefined, {
      Authorization: `Bearer ${tamperedToken}`,
    });
    record(
      'Cryptographic Integrity',
      'Tampered Token Rejection',
      tamperedRes.status === 401,
      'Cryptographically forged token signature rejected with HTTP 401'
    );

    // -------------------------------------------------------------
    // SECTION 5: Authorized Admin Operations
    // -------------------------------------------------------------
    console.log('\n--- Section 5: Authorized Store Management Operations ---');

    // 5.1 Fetch Admin Stats
    const statsRes = await makeRequest(port, 'GET', '/api/admin/stats', undefined, {
      Authorization: `Bearer ${adminToken}`,
    });
    record(
      'Admin Operations',
      'Admin Analytics & Database Telemetry',
      statsRes.status === 200 && typeof statsRes.data?.totalOrders === 'number',
      `Stats retrieved: ${statsRes.data?.activeProductsCount} products, ${statsRes.data?.totalOrders} orders, DB: ${statsRes.data?.database?.type}`
    );

    // 5.2 Fetch Admin Orders
    const ordersRes = await makeRequest(port, 'GET', '/api/admin/orders', undefined, {
      Authorization: `Bearer ${adminToken}`,
    });
    record(
      'Admin Operations',
      'Admin Orders Inspection',
      ordersRes.status === 200 && Array.isArray(ordersRes.data) && ordersRes.data.length > 0,
      `Admin retrieved full list of ${ordersRes.data?.length} orders`
    );

    // 5.3 Admin Order Status Update
    const updateStatusRes = await makeRequest(
      port,
      'PATCH',
      `/api/admin/orders/${testOrderRef}/status`,
      { status: 'Confirmed', note: 'Owner verified order for fulfillment' },
      { Authorization: `Bearer ${adminToken}` }
    );
    record(
      'Admin Operations',
      'Order Status Transition by Admin',
      updateStatusRes.status === 200 && updateStatusRes.data?.order?.orderStatus === 'Confirmed',
      'Order transitioned to "Confirmed" with status audit timeline'
    );
  } finally {
    server.close();
  }

  // -------------------------------------------------------------
  // Summary Reporting
  // -------------------------------------------------------------
  const total = auditLog.length;
  const passed = auditLog.filter((r) => r.passed).length;
  const failed = auditLog.filter((r) => !r.passed).length;

  console.log('\n================================================================');
  console.log('             SECURITY & ACCESS CONTROL AUDIT RESULTS            ');
  console.log('================================================================');
  console.log(`Total Checks Run:   ${total}`);
  console.log(`Passed Checks:      ${passed}`);
  console.log(`Failed Checks:      ${failed}`);
  console.log(`Success Rate:       ${((passed / total) * 100).toFixed(1)}%`);
  console.log('================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runSecurityAudit();
