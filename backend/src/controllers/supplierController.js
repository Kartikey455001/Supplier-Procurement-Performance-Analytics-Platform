import pool from '../config/db.js';

export async function getAllSuppliers(req, res, next) {
  try {
    const { search, category, status, sortBy = 'reliability_score', sortOrder = 'DESC' } = req.query;

    let query = `
      SELECT 
        s.*,
        v.total_orders,
        v.total_spend,
        v.completed_orders,
        v.on_time_orders,
        v.delayed_orders,
        v.avg_delivery_days,
        v.avg_delay_days,
        v.on_time_delivery_rate,
        v.fulfilment_rate,
        v.defect_rate,
        v.quality_score,
        v.reliability_score,
        v.performance_tier
      FROM Suppliers s
      LEFT JOIN vw_supplier_performance v ON s.supplier_id = v.supplier_id
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      query += ` AND (s.supplier_name LIKE ? OR s.supplier_code LIKE ? OR s.city LIKE ? OR s.contact_person LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (category) {
      query += ` AND s.category = ?`;
      params.push(category);
    }

    if (status) {
      query += ` AND s.status = ?`;
      params.push(status);
    }

    const allowedSortFields = [
      'supplier_name', 'supplier_code', 'category', 'city', 'status', 'rating',
      'total_orders', 'total_spend', 'on_time_delivery_rate', 'quality_score',
      'fulfilment_rate', 'reliability_score'
    ];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'reliability_score';
    const direction = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${orderField} ${direction}`;

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

export async function getSupplierById(req, res, next) {
  try {
    const { id } = req.params;

    const [supplierRows] = await pool.query(
      `SELECT 
        s.*,
        v.total_orders,
        v.total_spend,
        v.completed_orders,
        v.on_time_orders,
        v.delayed_orders,
        v.incomplete_orders,
        v.avg_delivery_days,
        v.avg_delay_days,
        v.total_ordered_qty,
        v.total_received_qty,
        v.total_defective_qty,
        v.total_accepted_qty,
        v.total_defect_cost,
        v.on_time_delivery_rate,
        v.fulfilment_rate,
        v.defect_rate,
        v.quality_score,
        v.reliability_score,
        v.performance_tier
      FROM Suppliers s
      LEFT JOIN vw_supplier_performance v ON s.supplier_id = v.supplier_id
      WHERE s.supplier_id = ?`,
      [id]
    );

    if (supplierRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    const supplier = supplierRows[0];

    // Recent purchase orders for this supplier
    const [recentOrders] = await pool.query(
      `SELECT 
        po.po_id, po.po_number, po.order_date, po.expected_delivery_date,
        po.actual_delivery_date, po.status, po.total_amount, po.payment_status,
        DATEDIFF(po.actual_delivery_date, po.expected_delivery_date) AS delay_days,
        COUNT(pd.detail_id) AS line_items_count,
        COALESCE(SUM(pd.defective_qty), 0) AS total_defective_items
      FROM Purchase_Orders po
      LEFT JOIN Procurement_Details pd ON po.po_id = pd.po_id
      WHERE po.supplier_id = ?
      GROUP BY po.po_id
      ORDER BY po.order_date DESC
      LIMIT 15`,
      [id]
    );

    // Monthly spend trend for this supplier
    const [monthlySpend] = await pool.query(
      `SELECT 
        DATE_FORMAT(order_date, '%Y-%m') AS month_key,
        DATE_FORMAT(order_date, '%b %Y') AS month_label,
        COUNT(po_id) AS order_count,
        ROUND(SUM(total_amount), 2) AS monthly_spend
      FROM Purchase_Orders
      WHERE supplier_id = ? AND status != 'Cancelled'
      GROUP BY DATE_FORMAT(order_date, '%Y-%m'), DATE_FORMAT(order_date, '%b %Y')
      ORDER BY month_key ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        profile: supplier,
        recentOrders,
        monthlySpend
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createSupplier(req, res, next) {
  try {
    const {
      supplier_name,
      category,
      contact_person,
      email,
      phone,
      city,
      country = 'India',
      tax_id,
      payment_terms = 'Net 30',
      lead_time_days = 14,
      status = 'Active',
      rating = 4.00
    } = req.body;

    if (!supplier_name || !category || !contact_person || !email || !phone || !city || !tax_id) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, category, contact, email, phone, city, tax_id.'
      });
    }

    // Auto-generate supplier code
    const [maxRows] = await pool.query('SELECT MAX(supplier_id) as max_id FROM Suppliers');
    const nextId = (maxRows[0].max_id || 0) + 1;
    const supplier_code = `SUP-${String(nextId).padStart(3, '0')}`;

    const [result] = await pool.query(
      `INSERT INTO Suppliers (
        supplier_code, supplier_name, category, contact_person, email, phone,
        city, country, tax_id, payment_terms, lead_time_days, status, rating
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        supplier_code, supplier_name, category, contact_person, email, phone,
        city, country, tax_id, payment_terms, parseInt(lead_time_days, 10), status, parseFloat(rating)
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully.',
      supplier_id: result.insertId,
      supplier_code
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSupplier(req, res, next) {
  try {
    const { id } = req.params;
    const {
      supplier_name,
      category,
      contact_person,
      email,
      phone,
      city,
      country,
      tax_id,
      payment_terms,
      lead_time_days,
      status,
      rating
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM Suppliers WHERE supplier_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }

    await pool.query(
      `UPDATE Suppliers SET
        supplier_name = COALESCE(?, supplier_name),
        category = COALESCE(?, category),
        contact_person = COALESCE(?, contact_person),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        city = COALESCE(?, city),
        country = COALESCE(?, country),
        tax_id = COALESCE(?, tax_id),
        payment_terms = COALESCE(?, payment_terms),
        lead_time_days = COALESCE(?, lead_time_days),
        status = COALESCE(?, status),
        rating = COALESCE(?, rating)
      WHERE supplier_id = ?`,
      [
        supplier_name, category, contact_person, email, phone,
        city, country, tax_id, payment_terms,
        lead_time_days ? parseInt(lead_time_days, 10) : null,
        status, rating ? parseFloat(rating) : null,
        id
      ]
    );

    res.json({ success: true, message: 'Supplier updated successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteSupplier(req, res, next) {
  try {
    const { id } = req.params;

    // Check if supplier has purchase orders
    const [orders] = await pool.query('SELECT COUNT(*) as order_count FROM Purchase_Orders WHERE supplier_id = ?', [id]);
    if (orders[0].order_count > 0) {
      // Soft-delete to preserve historical referential integrity
      await pool.query("UPDATE Suppliers SET status = 'Inactive' WHERE supplier_id = ?", [id]);
      return res.json({
        success: true,
        message: `Supplier has ${orders[0].order_count} historical purchase orders. Status changed to 'Inactive'.`
      });
    }

    await pool.query('DELETE FROM Suppliers WHERE supplier_id = ?', [id]);
    res.json({ success: true, message: 'Supplier deleted successfully.' });
  } catch (error) {
    next(error);
  }
}
