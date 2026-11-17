import pool from '../config/db.js';

export async function getAllOrders(req, res, next) {
  try {
    const {
      search,
      status,
      supplier_id,
      payment_status,
      delayed_only,
      incomplete_only,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      sortBy = 'order_date',
      sortOrder = 'DESC'
    } = req.query;

    let query = `
      SELECT 
        po.po_id,
        po.po_number,
        po.supplier_id,
        s.supplier_name,
        s.supplier_code,
        s.category AS supplier_category,
        po.order_date,
        po.expected_delivery_date,
        po.actual_delivery_date,
        po.status,
        po.total_amount,
        po.tax_amount,
        po.shipping_cost,
        po.payment_status,
        po.created_by,
        DATEDIFF(COALESCE(po.actual_delivery_date, CURDATE()), po.expected_delivery_date) AS days_variance,
        CASE 
          WHEN po.actual_delivery_date IS NOT NULL AND po.actual_delivery_date > po.expected_delivery_date THEN 1
          WHEN po.status IN ('Pending', 'In Transit') AND po.expected_delivery_date < CURDATE() THEN 1
          ELSE 0
        END AS is_delayed,
        COUNT(pd.detail_id) AS items_count,
        COALESCE(SUM(pd.ordered_qty), 0) AS total_ordered_qty,
        COALESCE(SUM(pd.received_qty), 0) AS total_received_qty,
        COALESCE(SUM(pd.defective_qty), 0) AS total_defective_qty,
        COALESCE(SUM(pd.accepted_qty), 0) AS total_accepted_qty
      FROM Purchase_Orders po
      JOIN Suppliers s ON po.supplier_id = s.supplier_id
      LEFT JOIN Procurement_Details pd ON po.po_id = pd.po_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (po.po_number LIKE ? OR s.supplier_name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    if (status) {
      query += ` AND po.status = ?`;
      params.push(status);
    }

    if (supplier_id) {
      query += ` AND po.supplier_id = ?`;
      params.push(supplier_id);
    }

    if (payment_status) {
      query += ` AND po.payment_status = ?`;
      params.push(payment_status);
    }

    if (startDate) {
      query += ` AND po.order_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND po.order_date <= ?`;
      params.push(endDate);
    }

    query += ` GROUP BY po.po_id`;

    // Having filters for calculated values
    const havingClauses = [];
    if (delayed_only === 'true') {
      havingClauses.push(`is_delayed = 1`);
    }
    if (incomplete_only === 'true') {
      havingClauses.push(`(total_received_qty < total_ordered_qty AND po.status IN ('Delivered', 'Partially Received'))`);
    }
    if (havingClauses.length > 0) {
      query += ` HAVING ` + havingClauses.join(' AND ');
    }

    const allowedSort = ['order_date', 'expected_delivery_date', 'total_amount', 'po_number', 'status'];
    const sortCol = allowedSort.includes(sortBy) ? `po.${sortBy}` : 'po.order_date';
    const sortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(query, params);

    // Get count for pagination
    let countQuery = `SELECT COUNT(DISTINCT po.po_id) as total FROM Purchase_Orders po JOIN Suppliers s ON po.supplier_id = s.supplier_id WHERE 1=1`;
    const countParams = [];
    if (search) {
      countQuery += ` AND (po.po_number LIKE ? OR s.supplier_name LIKE ?)`;
      const term = `%${search.trim()}%`;
      countParams.push(term, term);
    }
    if (status) {
      countQuery += ` AND po.status = ?`;
      countParams.push(status);
    }
    if (supplier_id) {
      countQuery += ` AND po.supplier_id = ?`;
      countParams.push(supplier_id);
    }
    const [countResult] = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      total: countResult[0].total,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;

    const [orderRows] = await pool.query(
      `SELECT 
        po.*,
        s.supplier_name,
        s.supplier_code,
        s.category AS supplier_category,
        s.contact_person,
        s.email AS supplier_email,
        s.phone AS supplier_phone,
        s.city AS supplier_city,
        s.payment_terms
      FROM Purchase_Orders po
      JOIN Suppliers s ON po.supplier_id = s.supplier_id
      WHERE po.po_id = ?`,
      [id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    }

    // Line items with product metadata
    const [items] = await pool.query(
      `SELECT 
        pd.*,
        p.sku,
        p.product_name,
        p.category AS product_category,
        p.metal_type,
        p.purity,
        p.gemstone
      FROM Procurement_Details pd
      JOIN Products p ON pd.product_id = p.product_id
      WHERE pd.po_id = ?
      ORDER BY pd.detail_id ASC`,
      [id]
    );

    // Payments for this order
    const [payments] = await pool.query(
      `SELECT * FROM Supplier_Payments WHERE po_id = ? ORDER BY payment_date DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        order: orderRows[0],
        items,
        payments
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createOrder(req, res, next) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      supplier_id,
      order_date,
      expected_delivery_date,
      shipping_cost = 0,
      notes = '',
      items // Array of { product_id, ordered_qty, unit_price }
    } = req.body;

    if (!supplier_id || !order_date || !expected_delivery_date || !items || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Please provide supplier, order date, expected delivery date, and at least one line item.'
      });
    }

    // Auto-generate PO number
    const [maxRows] = await connection.query('SELECT MAX(po_id) as max_id FROM Purchase_Orders');
    const nextId = (maxRows[0].max_id || 0) + 1;
    const year = new Date(order_date).getFullYear();
    const po_number = `PO-${year}-${String(nextId).padStart(5, '0')}`;

    // Calculate subtotal from items
    let subtotal = 0;
    for (const item of items) {
      const lineTotal = item.ordered_qty * item.unit_price;
      subtotal += lineTotal;
    }

    const tax_amount = Math.round(subtotal * 0.03); // 3% jewellery GST
    const total_amount = subtotal + tax_amount + parseFloat(shipping_cost || 0);

    const [orderResult] = await connection.query(
      `INSERT INTO Purchase_Orders (
        po_number, supplier_id, order_date, expected_delivery_date, status,
        total_amount, tax_amount, shipping_cost, payment_status, notes, created_by
      ) VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?, 'Unpaid', ?, ?)`,
      [
        po_number, supplier_id, order_date, expected_delivery_date,
        total_amount, tax_amount, shipping_cost, notes, req.user ? req.user.full_name : 'Procurement Desk'
      ]
    );

    const newPoId = orderResult.insertId;

    // Insert line items
    const detailValues = items.map(item => [
      newPoId,
      item.product_id,
      item.ordered_qty,
      0, // received_qty
      0, // defective_qty
      0, // accepted_qty
      item.unit_price,
      item.ordered_qty * item.unit_price,
      'Pending receiving & QC inspection'
    ]);

    await connection.query(
      `INSERT INTO Procurement_Details (
        po_id, product_id, ordered_qty, received_qty, defective_qty,
        accepted_qty, unit_price, line_total, remarks
      ) VALUES ?`,
      [detailValues]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully.',
      po_id: newPoId,
      po_number,
      total_amount
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, payment_status, notes, actual_delivery_date } = req.body;

    await pool.query(
      `UPDATE Purchase_Orders SET
        status = COALESCE(?, status),
        payment_status = COALESCE(?, payment_status),
        notes = COALESCE(?, notes),
        actual_delivery_date = COALESCE(?, actual_delivery_date)
      WHERE po_id = ?`,
      [status, payment_status, notes, actual_delivery_date, id]
    );

    res.json({ success: true, message: 'Purchase order updated successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function receiveOrderGoods(req, res, next) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { actual_delivery_date, items, status = 'Delivered', payment_status } = req.body;

    if (!items || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Please provide inspected line item quantities.' });
    }

    // Update each line item
    for (const item of items) {
      const received = parseInt(item.received_qty || 0, 10);
      const defective = parseInt(item.defective_qty || 0, 10);
      const accepted = Math.max(0, received - defective);

      await connection.query(
        `UPDATE Procurement_Details SET
          received_qty = ?,
          defective_qty = ?,
          accepted_qty = ?,
          remarks = ?
        WHERE detail_id = ? AND po_id = ?`,
        [
          received,
          defective,
          accepted,
          defective > 0 ? `${defective} items marked defective during inspection` : 'Passed Quality Control',
          item.detail_id,
          id
        ]
      );
    }

    // Update PO header
    await connection.query(
      `UPDATE Purchase_Orders SET
        actual_delivery_date = ?,
        status = ?,
        payment_status = COALESCE(?, payment_status)
      WHERE po_id = ?`,
      [actual_delivery_date || new Date().toISOString().split('T')[0], status, payment_status, id]
    );

    await connection.commit();

    res.json({ success: true, message: 'Goods received and inspected successfully.' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

export async function deleteOrder(req, res, next) {
  try {
    const { id } = req.params;

    // Check status
    const [po] = await pool.query('SELECT status FROM Purchase_Orders WHERE po_id = ?', [id]);
    if (po.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (po[0].status === 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed/delivered orders. Please mark as Cancelled instead.'
      });
    }

    await pool.query('DELETE FROM Purchase_Orders WHERE po_id = ?', [id]);
    res.json({ success: true, message: 'Order deleted successfully.' });
  } catch (error) {
    next(error);
  }
}
