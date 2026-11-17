import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toCsvString(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const headerLine = headers.map(h => `"${h}"`).join(',');
  
  const dataLines = rows.map(row => {
    return headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '""';
      if (val instanceof Date) return `"${val.toISOString().split('T')[0]}"`;
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',');
  });

  return [headerLine, ...dataLines].join('\r\n');
}

async function exportCsvDatasets() {
  console.log('[CSV Export] Exporting Excel-compatible CSV datasets from MySQL...');

  const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3307', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jewellery_procurement_db'
  };

  const outputDir = path.resolve(__dirname, '../../../data_csv');
  const templateDir = path.join(outputDir, 'templates');
  
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(templateDir)) fs.mkdirSync(templateDir, { recursive: true });

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const tables = [
      { name: 'Suppliers', file: 'suppliers.csv' },
      { name: 'Products', file: 'products.csv' },
      { name: 'Purchase_Orders', file: 'purchase_orders.csv' },
      { name: 'Procurement_Details', file: 'procurement_details.csv' },
      { name: 'Supplier_Payments', file: 'supplier_payments.csv' }
    ];

    for (const t of tables) {
      console.log(`[CSV Export] Exporting table '${t.name}'...`);
      const [rows] = await connection.query(`SELECT * FROM ${t.name}`);
      const csvData = toCsvString(rows);
      const targetPath = path.join(outputDir, t.file);
      fs.writeFileSync(targetPath, csvData, 'utf8');
      console.log(`[CSV Export] Saved ${rows.length} rows to ${t.file}`);
    }

    // Generate Blank CSV Templates for Excel Users
    console.log('[CSV Export] Generating Excel CSV import templates...');

    const supplierTemplate = '"supplier_code","supplier_name","category","contact_person","email","phone","city","country","tax_id","payment_terms","lead_time_days","status","rating"\r\n"SUP-999","Royal Ornaments Ltd","Gold Bullion & Fine Casting","Ramesh Shah","ramesh@royalornaments.com","+91 98200 12345","Mumbai","India","27AAAC1234A1Z5","Net 30","10","Active","4.50"';
    fs.writeFileSync(path.join(templateDir, 'template_suppliers.csv'), supplierTemplate, 'utf8');

    const productTemplate = '"sku","product_name","category","subcategory","metal_type","purity","gemstone","unit_of_measure","base_unit_cost","standard_lead_days","min_order_qty","stock_level","reorder_point"\r\n"JWL-RNG-9999","Imperial Solitaire Ring 1.5ct","Rings","Luxury Bridal","Gold 18K","18K (750)","Natural Diamond VVS","Pieces","195000.00","12","5","25","10"';
    fs.writeFileSync(path.join(templateDir, 'template_products.csv'), productTemplate, 'utf8');

    const poTemplate = '"po_number","supplier_code","order_date","expected_delivery_date","actual_delivery_date","status","total_amount","tax_amount","shipping_cost","payment_status","notes"\r\n"PO-2026-9999","SUP-001","2026-11-01","2026-11-15","2026-11-14","Delivered","500000.00","15000.00","2500.00","Paid","New seasonal procurement order"';
    fs.writeFileSync(path.join(templateDir, 'template_purchase_orders.csv'), poTemplate, 'utf8');

    console.log('[CSV Export] All CSV datasets and templates successfully generated in /data_csv!');
  } catch (err) {
    console.error('[CSV Export Error]:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

exportCsvDatasets();
