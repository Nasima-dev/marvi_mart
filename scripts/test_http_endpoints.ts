import express from 'express';
import { apiRouter } from '../src/server/routes';
import { initDatabase } from '../src/server/db';
import { checkAdminPassword } from '../src/server/auth';
import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

interface HttpTestResult {
  endpoint: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  message: string;
}

const httpResults: HttpTestResult[] = [];

async function makeRequest(
  serverPort: number,
  method: string,
  path: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : undefined;
    const reqHeaders: Record<string, string> = {
      ...headers,
    };
    if (postData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: serverPort,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode || 0, data: parsed, headers: res.headers });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runHttpAudit() {
  console.log('====================================================');
  console.log('   MARVI MART STORE - HTTP REST API AUDIT SUITE     ');
  console.log('====================================================\n');

  await initDatabase();

  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3001;

  try {
    // 1. GET /api/health
    const health = await makeRequest(port, 'GET', '/api/health');
    const healthPass = health.status === 200 && health.data?.status === 'ok';
    httpResults.push({
      endpoint: 'GET /api/health',
      expectedStatus: 200,
      actualStatus: health.status,
      passed: healthPass,
      message: `Returned health: ${health.data?.status}, DB: ${health.data?.database?.type}`,
    });

    // 2. GET /api/products
    const prods = await makeRequest(port, 'GET', '/api/products?limit=5');
    const prodsPass = prods.status === 200 && Array.isArray(prods.data?.products);
    httpResults.push({
      endpoint: 'GET /api/products',
      expectedStatus: 200,
      actualStatus: prods.status,
      passed: prodsPass,
      message: `Fetched ${prods.data?.products?.length} products`,
    });

    // 3. GET /api/products/:id
    const prodDetail = await makeRequest(port, 'GET', '/api/products/prod-001');
    const prodDetailPass = prodDetail.status === 200 && prodDetail.data?.id === 'prod-001';
    httpResults.push({
      endpoint: 'GET /api/products/prod-001',
      expectedStatus: 200,
      actualStatus: prodDetail.status,
      passed: prodDetailPass,
      message: `Product retrieved: "${prodDetail.data?.name}"`,
    });

    // 4. GET /api/products/invalid
    const prod404 = await makeRequest(port, 'GET', '/api/products/invalid-id-xyz');
    const prod404Pass = prod404.status === 404;
    httpResults.push({
      endpoint: 'GET /api/products/invalid-id-xyz',
      expectedStatus: 404,
      actualStatus: prod404.status,
      passed: prod404Pass,
      message: `Correctly returned 404 for non-existent item`,
    });

    // 5. POST /api/orders (validation check)
    const badOrder = await makeRequest(port, 'POST', '/api/orders', {
      customer: { fullName: '', phone: '123' },
      items: [],
    });
    const badOrderPass = badOrder.status === 400;
    httpResults.push({
      endpoint: 'POST /api/orders (Invalid Input)',
      expectedStatus: 400,
      actualStatus: badOrder.status,
      passed: badOrderPass,
      message: `Rejected malformed payload: ${badOrder.data?.error}`,
    });

    // 6. Security Check: Customer accessing Admin Endpoints without token
    const adminStatsNoAuth = await makeRequest(port, 'GET', '/api/admin/stats');
    const adminStatsNoAuthPass = adminStatsNoAuth.status === 401;
    httpResults.push({
      endpoint: 'GET /api/admin/stats (No Auth)',
      expectedStatus: 401,
      actualStatus: adminStatsNoAuth.status,
      passed: adminStatsNoAuthPass,
      message: `Protected route blocked unauthenticated customer with 401`,
    });

    const adminOrdersNoAuth = await makeRequest(port, 'GET', '/api/admin/orders');
    const adminOrdersNoAuthPass = adminOrdersNoAuth.status === 401;
    httpResults.push({
      endpoint: 'GET /api/admin/orders (No Auth)',
      expectedStatus: 401,
      actualStatus: adminOrdersNoAuth.status,
      passed: adminOrdersNoAuthPass,
      message: `Private orders list blocked from unauthenticated access with 401`,
    });

    // 7. POST /api/admin/login with invalid password
    const badLogin = await makeRequest(port, 'POST', '/api/admin/login', { password: 'incorrect_pass_123' });
    const badLoginPass = badLogin.status === 401;
    httpResults.push({
      endpoint: 'POST /api/admin/login (Invalid Password)',
      expectedStatus: 401,
      actualStatus: badLogin.status,
      passed: badLoginPass,
      message: `Rejected invalid administrator password with 401`,
    });

    // 8. POST /api/admin/login with valid configured credentials
    const adminPass = process.env.ADMIN_PASSWORD || 'marvi@admin2026';
    const goodLogin = await makeRequest(port, 'POST', '/api/admin/login', { password: adminPass });
    const goodLoginPass = goodLogin.status === 200 && !!goodLogin.data?.token;
    const token = goodLogin.data?.token;
    httpResults.push({
      endpoint: 'POST /api/admin/login (Configured Password)',
      expectedStatus: 200,
      actualStatus: goodLogin.status,
      passed: goodLoginPass,
      message: `Admin login successful, received signed HMAC token`,
    });

    // 9. GET /api/admin/verify with valid token
    const verifyAuth = await makeRequest(port, 'GET', '/api/admin/verify', undefined, {
      Authorization: `Bearer ${token}`,
    });
    const verifyAuthPass = verifyAuth.status === 200 && verifyAuth.data?.authenticated === true;
    httpResults.push({
      endpoint: 'GET /api/admin/verify (Valid Token)',
      expectedStatus: 200,
      actualStatus: verifyAuth.status,
      passed: verifyAuthPass,
      message: `Session verified as role: ${verifyAuth.data?.role}`,
    });

    // 10. GET /api/admin/stats with valid token
    const adminStatsAuth = await makeRequest(port, 'GET', '/api/admin/stats', undefined, {
      Authorization: `Bearer ${token}`,
    });
    const adminStatsAuthPass = adminStatsAuth.status === 200 && typeof adminStatsAuth.data?.activeProductsCount === 'number';
    httpResults.push({
      endpoint: 'GET /api/admin/stats (With Token)',
      expectedStatus: 200,
      actualStatus: adminStatsAuth.status,
      passed: adminStatsAuthPass,
      message: `Retrieved stats: ${adminStatsAuth.data?.activeProductsCount} active products, ${adminStatsAuth.data?.totalOrders} orders, ₹${adminStatsAuth.data?.totalRevenue} revenue`,
    });

    // 11. GET /api/admin/orders with valid token
    const adminOrdersAuth = await makeRequest(port, 'GET', '/api/admin/orders', undefined, {
      Authorization: `Bearer ${token}`,
    });
    const adminOrdersAuthPass = adminOrdersAuth.status === 200 && Array.isArray(adminOrdersAuth.data);
    httpResults.push({
      endpoint: 'GET /api/admin/orders (With Token)',
      expectedStatus: 200,
      actualStatus: adminOrdersAuth.status,
      passed: adminOrdersAuthPass,
      message: `Retrieved ${adminOrdersAuth.data?.length} orders from Marvi Mart store`,
    });
  } finally {
    server.close();
  }

  // Print results
  console.log('\n--- HTTP Endpoint Test Results ---');
  for (const r of httpResults) {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.endpoint}: ${r.message} (HTTP ${r.actualStatus})`);
  }

  const passedCount = httpResults.filter((r) => r.passed).length;
  const failedCount = httpResults.filter((r) => !r.passed).length;
  console.log('\n====================================================');
  console.log(`HTTP Endpoints Tested: ${httpResults.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Success Rate: ${((passedCount / httpResults.length) * 100).toFixed(1)}%`);
  console.log('====================================================\n');

  process.exit(failedCount > 0 ? 1 : 0);
}

runHttpAudit();
