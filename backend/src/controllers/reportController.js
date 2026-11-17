import pool from '../config/db.js';

export async function generateReport(req, res, next) {
  try {
    const {
      startDate,
      endDate,
      supplier_id,
      category,
      status,
      limit = 100,
      offset = 0
    } = req.query;

    let baseQuery = `
      SELECT 
        po.po_number,
        po.order_date,
        po.expected_delivery_date,
        po.actual_delivery_date,
        po.status AS order_status,
        po.payment_status,
        s.supplier_name,
        s.supplier_code,
        s.category AS supplier_category,
        p.sku,
        p.product_name,
        p.category AS product_category,
        p.metal_type,
        p.purity,
        pd.ordered_qty,
        pd.received_qty,
        pd.defective_qty,
        pd.accepted_qty,
        pd.unit_price,
        pd.line_total,
        DATEDIFF(po.actual_delivery_date, po.expected_delivery_date) AS delay_days,
        CASE 
          WHEN po.actual_delivery_date IS NOT NULL AND po.actual_delivery_date <= po.expected_delivery_date THEN 'On-Time'
          WHEN po.actual_delivery_date IS NOT NULL AND po.actual_delivery_date > po.expected_delivery_date THEN 'Delayed'
          WHEN po.status IN ('Pending', 'In Transit') AND po.expected_delivery_date < CURDATE() THEN 'Overdue'
          ELSE 'In Schedule'
        END AS delivery_status
      FROM Purchase_Orders po
      JOIN Suppliers s ON po.supplier_id = s.supplier_id
      JOIN Procurement_Details pd ON po.po_id = pd.po_id
      JOIN Products p ON pd.product_id = p.product_id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      baseQuery += ` AND po.order_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      baseQuery += ` AND po.order_date <= ?`;
      params.push(endDate);
    }
    if (supplier_id) {
      baseQuery += ` AND po.supplier_id = ?`;
      params.push(supplier_id);
    }
    if (category) {
      baseQuery += ` AND p.category = ?`;
      params.push(category);
    }
    if (status) {
      baseQuery += ` AND po.status = ?`;
      params.push(status);
    }

    // Clone query for count
    const countQuery = `SELECT COUNT(*) AS total FROM (${baseQuery}) AS subq`;
    const [countRows] = await pool.query(countQuery, params);

    // Summary aggregates for current filter
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT po_number) AS total_orders,
        COUNT(DISTINCT supplier_name) AS suppliers_involved,
        COALESCE(SUM(ordered_qty), 0) AS total_ordered_qty,
        COALESCE(SUM(received_qty), 0) AS total_received_qty,
        COALESCE(SUM(defective_qty), 0) AS total_defective_qty,
        ROUND(COALESCE(SUM(line_total), 0), 2) AS total_report_spend,
        ROUND(
          CASE WHEN SUM(received_qty) > 0 THEN (SUM(defective_qty) / SUM(received_qty)) * 100 ELSE 0.0 END, 2
        ) AS defect_rate_pct
      FROM (${baseQuery}) AS subq_summary
    `;
    const [summaryRows] = await pool.query(summaryQuery, params);

    baseQuery += ` ORDER BY po.order_date DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(baseQuery, params);

    res.json({
      success: true,
      total: countRows[0].total,
      summary: summaryRows[0],
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

export async function exportReportCsv(req, res, next) {
  try {
    const { startDate, endDate, supplier_id, category, status } = req.query;

    let query = `
      SELECT 
        po.po_number,
        po.order_date,
        po.expected_delivery_date,
        COALESCE(po.actual_delivery_date, '') AS actual_delivery_date,
        po.status AS order_status,
        po.payment_status,
        s.supplier_name,
        s.supplier_code,
        s.category AS supplier_category,
        p.sku,
        p.product_name,
        p.category AS product_category,
        p.metal_type,
        p.purity,
        pd.ordered_qty,
        pd.received_qty,
        pd.defective_qty,
        pd.accepted_qty,
        pd.unit_price,
        pd.line_total,
        COALESCE(DATEDIFF(po.actual_delivery_date, po.expected_delivery_date), '') AS delay_days,
        CASE 
          WHEN po.actual_delivery_date IS NOT NULL AND po.actual_delivery_date <= po.expected_delivery_date THEN 'On-Time'
          WHEN po.actual_delivery_date IS NOT NULL AND po.actual_delivery_date > po.expected_delivery_date THEN 'Delayed'
          WHEN po.status IN ('Pending', 'In Transit') AND po.expected_delivery_date < CURDATE() THEN 'Overdue'
          ELSE 'In Schedule'
        END AS delivery_compliance
      FROM Purchase_Orders po
      JOIN Suppliers s ON po.supplier_id = s.supplier_id
      JOIN Procurement_Details pd ON po.po_id = pd.po_id
      JOIN Products p ON pd.product_id = p.product_id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ` AND po.order_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND po.order_date <= ?`;
      params.push(endDate);
    }
    if (supplier_id) {
      query += ` AND po.supplier_id = ?`;
      params.push(supplier_id);
    }
    if (category) {
      query += ` AND p.category = ?`;
      params.push(category);
    }
    if (status) {
      query += ` AND po.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY po.order_date DESC`;

    const [rows] = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No records found matching filters for export.' });
    }

    // Build CSV
    const headers = Object.keys(rows[0]);
    const csvLines = [];
    csvLines.push(headers.map(h => `"${h}"`).join(','));

    for (const r of rows) {
      const line = headers.map(h => {
        const val = r[h];
        if (val === null || val === undefined) return '""';
        if (val instanceof Date) return `"${val.toISOString().split('T')[0]}"`;
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',');
      csvLines.push(line);
    }

    const csvContent = csvLines.join('\r\n');
    const filename = `Procurement_Report_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
}
