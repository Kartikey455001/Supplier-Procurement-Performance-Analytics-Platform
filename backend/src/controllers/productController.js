import pool from '../config/db.js';

export async function getAllProducts(req, res, next) {
  try {
    const { search, category, metal_type, gemstone, limit = 150, offset = 0 } = req.query;

    let query = `
      SELECT 
        p.*,
        COALESCE(SUM(pd.ordered_qty), 0) AS total_units_ordered,
        COALESCE(SUM(pd.received_qty), 0) AS total_units_received,
        COALESCE(SUM(pd.defective_qty), 0) AS total_units_defective,
        ROUND(COALESCE(SUM(pd.line_total), 0), 2) AS total_spend
      FROM Products p
      LEFT JOIN Procurement_Details pd ON p.product_id = pd.product_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (p.product_name LIKE ? OR p.sku LIKE ? OR p.subcategory LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (category) {
      query += ` AND p.category = ?`;
      params.push(category);
    }

    if (metal_type) {
      query += ` AND p.metal_type = ?`;
      params.push(metal_type);
    }

    if (gemstone) {
      query += ` AND p.gemstone = ?`;
      params.push(gemstone);
    }

    query += ` GROUP BY p.product_id ORDER BY p.product_id ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(query, params);

    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM Products');

    res.json({
      success: true,
      total: countRows[0].total,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    const [productRows] = await pool.query(
      `SELECT p.*,
        COALESCE(SUM(pd.ordered_qty), 0) AS total_ordered_qty,
        COALESCE(SUM(pd.received_qty), 0) AS total_received_qty,
        COALESCE(SUM(pd.defective_qty), 0) AS total_defective_qty,
        ROUND(COALESCE(SUM(pd.line_total), 0), 2) AS total_procurement_value
      FROM Products p
      LEFT JOIN Procurement_Details pd ON p.product_id = pd.product_id
      WHERE p.product_id = ?
      GROUP BY p.product_id`,
      [id]
    );

    if (productRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Historical procurement orders for this product
    const [procurementHistory] = await pool.query(
      `SELECT 
        po.po_number, po.order_date, po.status, s.supplier_name,
        pd.ordered_qty, pd.received_qty, pd.defective_qty, pd.unit_price, pd.line_total
      FROM Procurement_Details pd
      JOIN Purchase_Orders po ON pd.po_id = po.po_id
      JOIN Suppliers s ON po.supplier_id = s.supplier_id
      WHERE pd.product_id = ?
      ORDER BY po.order_date DESC
      LIMIT 15`,
      [id]
    );

    res.json({
      success: true,
      data: {
        product: productRows[0],
        history: procurementHistory
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    const {
      sku,
      product_name,
      category,
      subcategory,
      metal_type,
      purity,
      gemstone = 'None',
      unit_of_measure = 'Pieces',
      base_unit_cost,
      standard_lead_days = 10,
      min_order_qty = 5,
      stock_level = 0,
      reorder_point = 15
    } = req.body;

    if (!product_name || !category || !metal_type || !purity || !base_unit_cost) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, category, metal_type, purity, and base_unit_cost.'
      });
    }

    let finalSku = sku;
    if (!finalSku) {
      const [maxRows] = await pool.query('SELECT MAX(product_id) as max_id FROM Products');
      const nextId = (maxRows[0].max_id || 0) + 1;
      const catPrefix = category.slice(0, 3).toUpperCase();
      finalSku = `JWL-${catPrefix}-${String(nextId).padStart(4, '0')}`;
    }

    const [result] = await pool.query(
      `INSERT INTO Products (
        sku, product_name, category, subcategory, metal_type, purity,
        gemstone, unit_of_measure, base_unit_cost, standard_lead_days,
        min_order_qty, stock_level, reorder_point
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalSku, product_name, category, subcategory, metal_type, purity,
        gemstone, unit_of_measure, parseFloat(base_unit_cost),
        parseInt(standard_lead_days, 10), parseInt(min_order_qty, 10),
        parseInt(stock_level, 10), parseInt(reorder_point, 10)
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product_id: result.insertId,
      sku: finalSku
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const {
      product_name,
      category,
      subcategory,
      metal_type,
      purity,
      gemstone,
      unit_of_measure,
      base_unit_cost,
      standard_lead_days,
      min_order_qty,
      stock_level,
      reorder_point
    } = req.body;

    await pool.query(
      `UPDATE Products SET
        product_name = COALESCE(?, product_name),
        category = COALESCE(?, category),
        subcategory = COALESCE(?, subcategory),
        metal_type = COALESCE(?, metal_type),
        purity = COALESCE(?, purity),
        gemstone = COALESCE(?, gemstone),
        unit_of_measure = COALESCE(?, unit_of_measure),
        base_unit_cost = COALESCE(?, base_unit_cost),
        standard_lead_days = COALESCE(?, standard_lead_days),
        min_order_qty = COALESCE(?, min_order_qty),
        stock_level = COALESCE(?, stock_level),
        reorder_point = COALESCE(?, reorder_point)
      WHERE product_id = ?`,
      [
        product_name, category, subcategory, metal_type, purity,
        gemstone, unit_of_measure, base_unit_cost, standard_lead_days,
        min_order_qty, stock_level, reorder_point, id
      ]
    );

    res.json({ success: true, message: 'Product updated successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function getCategories(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        p.category,
        COUNT(DISTINCT p.product_id) AS product_count,
        ROUND(AVG(p.base_unit_cost), 2) AS avg_unit_cost,
        ROUND(COALESCE(SUM(pd.line_total), 0), 2) AS total_procurement_spend,
        COALESCE(SUM(pd.ordered_qty), 0) AS total_units_ordered
      FROM Products p
      LEFT JOIN Procurement_Details pd ON p.product_id = pd.product_id
      GROUP BY p.category
      ORDER BY total_procurement_spend DESC`
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}
