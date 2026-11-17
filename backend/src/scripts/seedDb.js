import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { generateSyntheticData } from './generateData.js';

dotenv.config();

async function seedDatabase() {
  console.log('[DB Seed] Seeding MySQL database with realistic procurement dataset...');

  const useSsl = process.env.DB_SSL === 'true' || process.env.DB_PORT === '4000';

  const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3307', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jewellery_procurement_db',
    ...(useSsl ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {})
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log(`[DB Seed] Connected to database '${dbConfig.database}' on ${dbConfig.host}:${dbConfig.port} (SSL: ${useSsl ? 'ON' : 'OFF'}).`);

    // Clean existing data
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE Supplier_Payments');
    await connection.query('TRUNCATE TABLE Procurement_Details');
    await connection.query('TRUNCATE TABLE Purchase_Orders');
    await connection.query('TRUNCATE TABLE Products');
    await connection.query('TRUNCATE TABLE Suppliers');
    await connection.query('TRUNCATE TABLE Users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('[DB Seed] Cleared existing table data.');

    const data = await generateSyntheticData();

    // 1. Insert Users
    console.log('[DB Seed] Inserting Users...');
    const userValues = data.users.map(u => [
      u.username, u.email, u.password_hash, u.full_name, u.role, u.department, u.is_active
    ]);
    await connection.query(
      `INSERT INTO Users (username, email, password_hash, full_name, role, department, is_active) VALUES ?`,
      [userValues]
    );
    console.log(`[DB Seed] Inserted ${userValues.length} Users.`);

    // 2. Insert Suppliers
    console.log('[DB Seed] Inserting Suppliers...');
    const supplierValues = data.suppliers.map(s => [
      s.supplier_id, s.supplier_code, s.supplier_name, s.category, s.contact_person,
      s.email, s.phone, s.city, s.country, s.tax_id, s.payment_terms, s.lead_time_days,
      s.status, s.rating
    ]);
    await connection.query(
      `INSERT INTO Suppliers (
        supplier_id, supplier_code, supplier_name, category, contact_person,
        email, phone, city, country, tax_id, payment_terms, lead_time_days,
        status, rating
      ) VALUES ?`,
      [supplierValues]
    );
    console.log(`[DB Seed] Inserted ${supplierValues.length} Suppliers.`);

    // 3. Insert Products
    console.log('[DB Seed] Inserting Products...');
    const productValues = data.products.map(p => [
      p.product_id, p.sku, p.product_name, p.category, p.subcategory,
      p.metal_type, p.purity, p.gemstone, p.unit_of_measure, p.base_unit_cost,
      p.standard_lead_days, p.min_order_qty, p.stock_level, p.reorder_point
    ]);
    await connection.query(
      `INSERT INTO Products (
        product_id, sku, product_name, category, subcategory,
        metal_type, purity, gemstone, unit_of_measure, base_unit_cost,
        standard_lead_days, min_order_qty, stock_level, reorder_point
      ) VALUES ?`,
      [productValues]
    );
    console.log(`[DB Seed] Inserted ${productValues.length} Products.`);

    // 4. Insert Purchase Orders (in batches of 250)
    console.log('[DB Seed] Inserting Purchase Orders...');
    const poBatchSize = 250;
    for (let i = 0; i < data.purchaseOrders.length; i += poBatchSize) {
      const batch = data.purchaseOrders.slice(i, i + poBatchSize);
      const batchValues = batch.map(po => [
        po.po_id, po.po_number, po.supplier_id, po.order_date, po.expected_delivery_date,
        po.actual_delivery_date, po.status, po.total_amount, po.tax_amount,
        po.shipping_cost, po.payment_status, po.notes, po.created_by
      ]);
      await connection.query(
        `INSERT INTO Purchase_Orders (
          po_id, po_number, supplier_id, order_date, expected_delivery_date,
          actual_delivery_date, status, total_amount, tax_amount,
          shipping_cost, payment_status, notes, created_by
        ) VALUES ?`,
        [batchValues]
      );
    }
    console.log(`[DB Seed] Inserted ${data.purchaseOrders.length} Purchase Orders.`);

    // 5. Insert Procurement Details (Line Items in batches of 500)
    console.log('[DB Seed] Inserting Procurement Details (Line Items)...');
    const pdBatchSize = 500;
    for (let i = 0; i < data.procurementDetails.length; i += pdBatchSize) {
      const batch = data.procurementDetails.slice(i, i + pdBatchSize);
      const batchValues = batch.map(pd => [
        pd.detail_id, pd.po_id, pd.product_id, pd.ordered_qty, pd.received_qty,
        pd.defective_qty, pd.accepted_qty, pd.unit_price, pd.line_total, pd.remarks
      ]);
      await connection.query(
        `INSERT INTO Procurement_Details (
          detail_id, po_id, product_id, ordered_qty, received_qty,
          defective_qty, accepted_qty, unit_price, line_total, remarks
        ) VALUES ?`,
        [batchValues]
      );
    }
    console.log(`[DB Seed] Inserted ${data.procurementDetails.length} Procurement Details.`);

    // 6. Insert Supplier Payments (in batches of 500)
    console.log('[DB Seed] Inserting Supplier Payments...');
    const payBatchSize = 500;
    for (let i = 0; i < data.supplierPayments.length; i += payBatchSize) {
      const batch = data.supplierPayments.slice(i, i + payBatchSize);
      const batchValues = batch.map(pay => [
        pay.payment_id, pay.payment_number, pay.po_id, pay.supplier_id,
        pay.payment_date, pay.amount_paid, pay.payment_method,
        pay.payment_status, pay.transaction_reference, pay.notes
      ]);
      await connection.query(
        `INSERT INTO Supplier_Payments (
          payment_id, payment_number, po_id, supplier_id,
          payment_date, amount_paid, payment_method,
          payment_status, transaction_reference, notes
        ) VALUES ?`,
        [batchValues]
      );
    }
    console.log(`[DB Seed] Inserted ${data.supplierPayments.length} Supplier Payments.`);

    console.log('[DB Seed] Database seeding finished successfully!');
  } catch (err) {
    console.error('[DB Seed Error]:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

seedDatabase();
