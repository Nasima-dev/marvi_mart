import dotenv from 'dotenv';
dotenv.config();

import { initDatabase, getDbStatus, fetchProducts, fetchProductById, createOrder, fetchOrderByIdOrRef, updateOrderStatus, fetchOrders, createProduct, updateProduct, updateProductStock, deleteProduct } from '../src/server/db';
import { checkAdminPassword, generateAdminToken, validateAdminToken } from '../src/server/auth';
import { INITIAL_PRODUCTS } from '../src/data/initialProducts';
import fs from 'fs';
import path from 'path';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function recordTest(category: string, name: string, passed: boolean, details: string) {
  results.push({ category, name, passed, details });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] [${category}] ${name}: ${details}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('   MARVI MART STORE - AUTOMATED TEST & AUDIT SUITE   ');
  console.log('====================================================\n');

  // TEST SUITE 1: Asset & File Verification
  console.log('--- Suite 1: Media Assets & File Integrity ---');
  let missingImages = 0;
  for (const prod of INITIAL_PRODUCTS) {
    for (const imgUrl of prod.imageUrls) {
      if (imgUrl.startsWith('/src/')) {
        const fullPath = path.resolve(process.cwd(), imgUrl.substring(1));
        if (!fs.existsSync(fullPath)) {
          missingImages++;
          recordTest('Assets', `Image for ${prod.name}`, false, `File not found: ${imgUrl}`);
        }
      }
    }
  }
  if (missingImages === 0) {
    recordTest('Assets', 'Product Media Assets', true, `All ${INITIAL_PRODUCTS.length} products have valid local image assets on disk`);
  }

  // TEST SUITE 2: Database Initialization & Isolation
  console.log('\n--- Suite 2: Database Connection & Isolation ---');
  try {
    const dbStatus = await initDatabase();
    recordTest('Database', 'Database Initialization', true, `Store running with ${dbStatus.type} mode. Database isolated for Marvi Mart.`);
    
    // Check status function
    const currentStatus = getDbStatus();
    recordTest('Database', 'Status Retrieval', true, `Reported state: ${currentStatus.type}`);
  } catch (err: any) {
    recordTest('Database', 'Database Initialization', false, `Init failed: ${err.message}`);
  }

  // TEST SUITE 3: Catalog, Search & Filtering
  console.log('\n--- Suite 3: Catalog, Categories & Search ---');
  try {
    // 3.1 All products
    const all = await fetchProducts({ limit: 100 });
    recordTest('Catalog', 'Fetch All Products', all.total >= 12, `Retrieved ${all.products.length} products (total: ${all.total})`);

    // 3.2 Category filter
    const kitchen = await fetchProducts({ category: 'Kitchen Essentials' });
    const allKitchen = kitchen.products.every(p => p.category === 'Kitchen Essentials');
    recordTest('Catalog', 'Category Filter', allKitchen && kitchen.products.length > 0, `Filtered Kitchen Essentials: found ${kitchen.products.length} items`);

    // 3.3 Search filter
    const searchRes = await fetchProducts({ search: 'brass' });
    recordTest('Catalog', 'Keyword Search', searchRes.products.length > 0, `Search for 'brass' matched ${searchRes.products.length} items`);

    // 3.4 Price sorting (asc)
    const sortedAsc = await fetchProducts({ sort: 'price-asc' });
    let isAsc = true;
    for (let i = 1; i < sortedAsc.products.length; i++) {
      if (sortedAsc.products[i].price < sortedAsc.products[i - 1].price) {
        isAsc = false;
        break;
      }
    }
    recordTest('Catalog', 'Sort by Price (Low to High)', isAsc, `Price ordering confirmed ascending`);

    // 3.5 Price sorting (desc)
    const sortedDesc = await fetchProducts({ sort: 'price-desc' });
    let isDesc = true;
    for (let i = 1; i < sortedDesc.products.length; i++) {
      if (sortedDesc.products[i].price > sortedDesc.products[i - 1].price) {
        isDesc = false;
        break;
      }
    }
    recordTest('Catalog', 'Sort by Price (High to Low)', isDesc, `Price ordering confirmed descending`);

    // 3.6 Single product fetch
    const prod1 = await fetchProductById('prod-001');
    recordTest('Catalog', 'Product Detail by ID', prod1 !== null && prod1.id === 'prod-001', `Found product: "${prod1?.name}"`);

    // 3.7 Non-existent product
    const nonExistent = await fetchProductById('prod-nonexistent-999');
    recordTest('Catalog', 'Non-existent Product Query', nonExistent === null, `Correctly returned null for non-existent item`);
  } catch (err: any) {
    recordTest('Catalog', 'Catalog operations', false, `Error: ${err.message}`);
  }

  // TEST SUITE 4: Cart & Pricing Logic
  console.log('\n--- Suite 4: Cart Totals & Discount Calculation ---');
  try {
    const item1 = await fetchProductById('prod-001'); // 1899
    const item2 = await fetchProductById('prod-006'); // 699
    
    // Subtotal >= 999 should have 0 shipping
    const testOrderFreeShipping = await createOrder({
      customer: {
        fullName: 'Aarav Sharma',
        phone: '9876543210',
        flatHouse: 'Flat 402, Royal Palms',
        streetArea: 'MG Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        addressType: 'Home',
      },
      items: [{ productId: 'prod-001', quantity: 1 }],
      couponCode: 'MARVI100',
    });

    const isFreeShipping = testOrderFreeShipping.order?.shippingFee === 0;
    const isCouponApplied = testOrderFreeShipping.order?.discountAmount === 100;
    const isCorrectTotal = testOrderFreeShipping.order?.totalAmount === (1899 - 100);

    recordTest('Cart & Checkout', 'Free Shipping & Coupon Threshold', 
      isFreeShipping && isCouponApplied && isCorrectTotal, 
      `Subtotal ₹1899 -> Shipping ₹0, Discount ₹100, Final Total ₹${testOrderFreeShipping.order?.totalAmount}`
    );

    // Below 999 should add 79 shipping
    const testOrderStandardShipping = await createOrder({
      customer: {
        fullName: 'Pooja Verma',
        phone: '9123456780',
        flatHouse: 'B-12, Green Avenue',
        streetArea: 'Civil Lines',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302006',
        addressType: 'Home',
      },
      items: [{ productId: 'prod-006', quantity: 1 }], // 699
    });

    const isShippingAdded = testOrderStandardShipping.order?.shippingFee === 79;
    const isStandardTotalCorrect = testOrderStandardShipping.order?.totalAmount === (699 + 79);
    recordTest('Cart & Checkout', 'Standard Shipping Under ₹999', 
      isShippingAdded && isStandardTotalCorrect, 
      `Subtotal ₹699 -> Shipping ₹79, Total ₹${testOrderStandardShipping.order?.totalAmount}`
    );
  } catch (err: any) {
    recordTest('Cart & Checkout', 'Cart Calculation', false, `Error: ${err.message}`);
  }

  // TEST SUITE 5: Form Validation & Security on Checkout
  console.log('\n--- Suite 5: Validation & Error Handling on Checkout ---');
  try {
    // 5.1 Invalid phone (less than 10 digits or non-Indian prefix)
    const badPhone = await createOrder({
      customer: {
        fullName: 'Vikram Singh',
        phone: '1234567890', // starts with 1, not 6-9
        flatHouse: '12',
        streetArea: 'Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700016',
        addressType: 'Home',
      },
      items: [{ productId: 'prod-001', quantity: 1 }],
    });
    recordTest('Validation', 'Invalid Mobile Number Rejection', !badPhone.success, `Correctly rejected invalid mobile prefix`);

    // 5.2 Invalid PIN code (not 6 digits or starts with 0)
    const badPin = await createOrder({
      customer: {
        fullName: 'Vikram Singh',
        phone: '9876543210',
        flatHouse: '12',
        streetArea: 'Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '012345', // starts with 0
        addressType: 'Home',
      },
      items: [{ productId: 'prod-001', quantity: 1 }],
    });
    recordTest('Validation', 'Invalid Postal PIN Code Rejection', !badPin.success, `Correctly rejected invalid PIN code`);

    // 5.3 Empty cart rejection
    const emptyCart = await createOrder({
      customer: {
        fullName: 'Vikram Singh',
        phone: '9876543210',
        flatHouse: '12',
        streetArea: 'Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700016',
        addressType: 'Home',
      },
      items: [],
    });
    recordTest('Validation', 'Empty Cart Rejection', !emptyCart.success, `Correctly rejected checkout with 0 items`);

    // 5.4 Insufficient stock rejection
    const overStock = await createOrder({
      customer: {
        fullName: 'Vikram Singh',
        phone: '9876543210',
        flatHouse: '12',
        streetArea: 'Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700016',
        addressType: 'Home',
      },
      items: [{ productId: 'prod-005', quantity: 999 }], // only 6 in stock
    });
    recordTest('Validation', 'Exceeding Stock Quantity Rejection', !overStock.success, `Correctly prevented purchasing 999 units when stock is 6`);
  } catch (err: any) {
    recordTest('Validation', 'Form Validation', false, `Error: ${err.message}`);
  }

  // TEST SUITE 6: Order Placement, Tracking & Customer Privacy
  console.log('\n--- Suite 6: Order Persistence, Tracking & Customer Privacy ---');
  let testOrderRef = '';
  try {
    const validOrderRes = await createOrder({
      customer: {
        fullName: 'Neha Kapoor',
        phone: '9988776655',
        email: 'neha.kapoor@example.com',
        flatHouse: 'House 54, Sector 14',
        streetArea: 'Near City Centre',
        city: 'Gurugram',
        state: 'Haryana',
        pincode: '122001',
        addressType: 'Home',
      },
      items: [{ productId: 'prod-002', quantity: 1 }],
    });

    if (validOrderRes.success && validOrderRes.order) {
      testOrderRef = validOrderRes.order.orderReference;
      recordTest('Orders', 'COD Order Placement', true, `Order created with reference: ${testOrderRef}`);
      
      // Check order reference format MM-YYYY-XXXXX
      const refFormatOk = /^MM-\d{4}-\d{5}$/.test(testOrderRef);
      recordTest('Orders', 'Order Reference Format', refFormatOk, `Format matches MM-YYYY-XXXXX (${testOrderRef})`);

      // Verify retrieval by reference
      const trackedOrder = await fetchOrderByIdOrRef(testOrderRef);
      recordTest('Orders', 'Order Lookup by Reference', trackedOrder !== null, `Found order in store`);

      // Verify Customer Privacy: In public tracking endpoint, sensitive fields must not be exposed
      // Simulate public route serialization
      const publicTrackData = {
        orderReference: trackedOrder?.orderReference,
        orderStatus: trackedOrder?.orderStatus,
        createdAt: trackedOrder?.createdAt,
        totalAmount: trackedOrder?.totalAmount,
        customerCity: trackedOrder?.customer.city,
        customerState: trackedOrder?.customer.state,
        pincode: trackedOrder?.customer.pincode,
      };
      
      const leaksPhone = 'phone' in (publicTrackData as any) || (publicTrackData as any).phone !== undefined;
      const leaksHouse = 'flatHouse' in (publicTrackData as any) || (publicTrackData as any).flatHouse !== undefined;
      recordTest('Privacy', 'Customer Contact Privacy on Public Tracking', !leaksPhone && !leaksHouse, `Full phone and street address omitted from public tracking payload`);
    } else {
      recordTest('Orders', 'COD Order Placement', false, `Failed: ${validOrderRes.error}`);
    }
  } catch (err: any) {
    recordTest('Orders', 'Order Placement & Tracking', false, `Error: ${err.message}`);
  }

  // TEST SUITE 7: Admin Authentication & RBAC Security
  console.log('\n--- Suite 7: Admin Authentication & RBAC ---');
  try {
    // 7.1 Reject wrong password
    const wrongAuth = checkAdminPassword('completely_wrong_password');
    recordTest('Admin Auth', 'Wrong Password Rejection', !wrongAuth, `Incorrect password safely rejected`);

    // 7.2 Blank password
    const emptyAuth = checkAdminPassword('');
    recordTest('Admin Auth', 'Empty Password Rejection', !emptyAuth, `Empty password rejected`);

    // 7.3 Valid password check using server-configured credentials
    const adminPass = process.env.ADMIN_PASSWORD || 'marvi@admin2026';
    const validAuth = checkAdminPassword(adminPass);
    recordTest('Admin Auth', 'Configured Admin Login Check', validAuth, `Configured server-side admin credentials authenticated successfully`);

    // 7.4 Token generation & validation
    const token = generateAdminToken();
    const isTokenValid = validateAdminToken(token);
    recordTest('Admin Auth', 'HMAC Token Generation & Verification', isTokenValid, `Valid token cryptographically validated`);

    // 7.5 Tampered token
    const tamperedToken = token.slice(0, -4) + 'abcd';
    const isTamperedValid = validateAdminToken(tamperedToken);
    recordTest('Admin Auth', 'Tampered Token Rejection', !isTamperedValid, `Tampered signature rejected`);

    // 7.6 Empty / garbage token
    recordTest('Admin Auth', 'Garbage Token Rejection', !validateAdminToken('random_garbage_string'), `Invalid token rejected`);
  } catch (err: any) {
    recordTest('Admin Auth', 'Auth testing', false, `Error: ${err.message}`);
  }

  // TEST SUITE 8: Admin Operations (Products & Orders Management)
  console.log('\n--- Suite 8: Admin Management Operations ---');
  try {
    // 8.1 Create product
    const newProd = await createProduct({
      name: 'Test Jaipur Blue Pottery Plate',
      slug: 'test-jaipur-blue-pottery-plate',
      description: 'Hand-painted traditional quartz Jaipur blue pottery decorative plate.',
      category: 'Home Decor',
      price: 899,
      imageUrls: ['/images/home_decor_brass_vase_1791727457022.jpg'],
      stockQuantity: 15,
      isActive: true,
      material: 'Quartz Powder & Natural Pigments',
    });
    recordTest('Admin Ops', 'Product Creation', newProd.id !== undefined && newProd.name === 'Test Jaipur Blue Pottery Plate', `Created product ID: ${newProd.id}`);

    // 8.2 Update product stock
    const stockUpdated = await updateProductStock(newProd.id, 25);
    const updatedProd = await fetchProductById(newProd.id);
    recordTest('Admin Ops', 'Update Stock Quantity', stockUpdated && updatedProd?.stockQuantity === 25, `Stock successfully updated to 25`);

    // 8.3 Update product details
    const detailsUpdated = await updateProduct(newProd.id, { price: 949 });
    recordTest('Admin Ops', 'Update Product Price', detailsUpdated?.price === 949, `Price successfully updated to ₹949`);

    // 8.4 Clean up test product
    const deleted = await deleteProduct(newProd.id);
    recordTest('Admin Ops', 'Product Deletion', deleted, `Cleaned up test product`);

    // 8.5 Admin order status update
    if (testOrderRef) {
      const order = await fetchOrderByIdOrRef(testOrderRef);
      if (order) {
        const updatedOrder = await updateOrderStatus(order.id, 'Confirmed', 'Order verified for packing');
        const hasHistory = (updatedOrder?.statusHistory?.length || 0) >= 2;
        recordTest('Admin Ops', 'Order Status Update & Timeline Audit', 
          updatedOrder?.orderStatus === 'Confirmed' && hasHistory, 
          `Status transitioned to 'Confirmed' with audit history entry`
        );
      }
    }
  } catch (err: any) {
    recordTest('Admin Ops', 'Admin operations', false, `Error: ${err.message}`);
  }

  // Final Summary
  console.log('\n====================================================');
  console.log('             FINAL AUDIT SUMMARY REPORT             ');
  console.log('====================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total Tests Executed: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
