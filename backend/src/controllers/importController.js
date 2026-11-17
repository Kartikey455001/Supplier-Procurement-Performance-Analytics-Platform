import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to parse CSV string into array of objects
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header line handling quotes
  const headers = parseCsvLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === headers.length) {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h.trim()] = values[idx].trim();
      });
      rows.push(obj);
    }
  }
  return rows;
}

function parseCsvLine(line) {
  const values = [];
  let inQuotes = false;
  let currentValue = '';

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        currentValue += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue);
  return values;
}

export async function previewCsvUpload(req, res, next) {
  try {
    const { type } = req.body; // 'suppliers', 'products', 'purchase_orders'
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a CSV file.' });
    }

    const csvContent = req.file.buffer.toString('utf8');
    const parsedRows = parseCsv(csvContent);

    if (parsedRows.length === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded CSV file is empty or formatted incorrectly.' });
    }

    const validationErrors = [];
    const previewRows = parsedRows.slice(0, 10);

    // Validate based on entity type
    if (type === 'suppliers') {
      const required = ['supplier_name', 'category', 'contact_person', 'email', 'phone', 'city', 'tax_id'];
      parsedRows.forEach((row, idx) => {
        required.forEach(field => {
          if (!row[field]) {
            validationErrors.push(`Row ${idx + 2}: Missing required field '${field}'.`);
          }
        });
      });
    } else if (type === 'products') {
      const required = ['product_name', 'category', 'metal_type', 'purity', 'base_unit_cost'];
      parsedRows.forEach((row, idx) => {
        required.forEach(field => {
          if (!row[field]) {
            validationErrors.push(`Row ${idx + 2}: Missing required field '${field}'.`);
          }
        });
        if (row.base_unit_cost && isNaN(parseFloat(row.base_unit_cost))) {
          validationErrors.push(`Row ${idx + 2}: 'base_unit_cost' must be a valid numeric price.`);
        }
      });
    } else if (type === 'purchase_orders') {
      const required = ['supplier_code', 'order_date', 'expected_delivery_date', 'total_amount'];
      parsedRows.forEach((row, idx) => {
        required.forEach(field => {
          if (!row[field]) {
            validationErrors.push(`Row ${idx + 2}: Missing required field '${field}'.`);
          }
        });
      });
    }

    res.json({
      success: true,
      totalRows: parsedRows.length,
      preview: previewRows,
      validationErrors: validationErrors.slice(0, 20),
      hasErrors: validationErrors.length > 0,
      totalErrorCount: validationErrors.length
    });
  } catch (error) {
    next(error);
  }
}

export async function commitCsvImport(req, res, next) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { type } = req.body;
    if (!req.file) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Please upload a CSV file.' });
    }

    const csvContent = req.file.buffer.toString('utf8');
    const parsedRows = parseCsv(csvContent);

    if (parsedRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'No valid data rows found in CSV.' });
    }

    let insertedCount = 0;

    if (type === 'suppliers') {
      for (const row of parsedRows) {
        let code = row.supplier_code;
        if (!code) {
          const [m] = await connection.query('SELECT MAX(supplier_id) as max_id FROM Suppliers');
          code = `SUP-${String((m[0].max_id || 0) + 1).padStart(3, '0')}`;
        }

        await connection.query(
          `INSERT INTO Suppliers (
            supplier_code, supplier_name, category, contact_person, email, phone,
            city, country, tax_id, payment_terms, lead_time_days, status, rating
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            supplier_name = VALUES(supplier_name),
            contact_person = VALUES(contact_person),
            email = VALUES(email),
            phone = VALUES(phone),
            city = VALUES(city),
            payment_terms = VALUES(payment_terms),
            rating = VALUES(rating)`,
          [
            code,
            row.supplier_name,
            row.category || 'Gold Bullion & Fine Casting',
            row.contact_person || 'Manager',
            row.email,
            row.phone,
            row.city,
            row.country || 'India',
            row.tax_id || `27AAAC${Math.floor(Math.random() * 9000 + 1000)}A1Z5`,
            row.payment_terms || 'Net 30',
            parseInt(row.lead_time_days || '14', 10),
            row.status || 'Active',
            parseFloat(row.rating || '4.00')
          ]
        );
        insertedCount++;
      }
    } else if (type === 'products') {
      for (const row of parsedRows) {
        let sku = row.sku;
        if (!sku) {
          const [m] = await connection.query('SELECT MAX(product_id) as max_id FROM Products');
          sku = `JWL-${(row.category || 'GEN').slice(0, 3).toUpperCase()}-${String((m[0].max_id || 0) + 1).padStart(4, '0')}`;
        }

        await connection.query(
          `INSERT INTO Products (
            sku, product_name, category, subcategory, metal_type, purity,
            gemstone, unit_of_measure, base_unit_cost, standard_lead_days,
            min_order_qty, stock_level, reorder_point
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            product_name = VALUES(product_name),
            base_unit_cost = VALUES(base_unit_cost),
            stock_level = VALUES(stock_level)`,
          [
            sku,
            row.product_name,
            row.category || 'Rings',
            row.subcategory || 'Standard Luxury',
            row.metal_type || 'Gold 18K',
            row.purity || '18K (750)',
            row.gemstone || 'None',
            row.unit_of_measure || 'Pieces',
            parseFloat(row.base_unit_cost),
            parseInt(row.standard_lead_days || '10', 10),
            parseInt(row.min_order_qty || '5', 10),
            parseInt(row.stock_level || '20', 10),
            parseInt(row.reorder_point || '10', 10)
          ]
        );
        insertedCount++;
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Successfully imported and synchronized ${insertedCount} ${type} records into MySQL.`,
      importedCount: insertedCount
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

export async function downloadTemplate(req, res, next) {
  try {
    const { templateName } = req.params; // 'suppliers', 'products', 'purchase_orders'
    const templateFile = `template_${templateName}.csv`;
    const filePath = path.resolve(__dirname, `../../../data_csv/templates/${templateFile}`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: `Template '${templateFile}' not found.` });
    }

    res.download(filePath, templateFile);
  } catch (error) {
    next(error);
  }
}
