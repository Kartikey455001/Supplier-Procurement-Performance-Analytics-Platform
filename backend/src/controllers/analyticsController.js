import pool from '../config/db.js';

export async function getDashboardOverview(req, res, next) {
  try {
    const { startDate, endDate } = req.query;

    let dateFilterPo = '';
    const dateParams = [];
    if (startDate && endDate) {
      dateFilterPo = ' AND po.order_date BETWEEN ? AND ?';
      dateParams.push(startDate, endDate);
    }

    // 1. Executive KPI Cards
    const [kpiRows] = await pool.query(
      `SELECT 
        COUNT(DISTINCT po.po_id) AS total_orders,
        ROUND(COALESCE(SUM(po.total_amount), 0), 2) AS total_spend,
        COUNT(DISTINCT s.supplier_id) AS active_suppliers,
        ROUND(COALESCE(AVG(CASE 
          WHEN po.status = 'Delivered' AND po.actual_delivery_date IS NOT NULL 
          THEN DATEDIFF(po.actual_delivery_date, po.order_date) 
        END), 0), 1) AS avg_delivery_time_days,
        ROUND(
          CASE 
            WHEN COUNT(DISTINCT CASE WHEN po.status = 'Delivered' THEN po.po_id END) > 0 
            THEN (COUNT(DISTINCT CASE WHEN po.status = 'Delivered' AND po.actual_delivery_date <= po.expected_delivery_date THEN po.po_id END) / 
                  COUNT(DISTINCT CASE WHEN po.status = 'Delivered' THEN po.po_id END)) * 100 
            ELSE 100.00 
          END, 2
        ) AS on_time_delivery_rate,
        ROUND(
          CASE 
            WHEN SUM(pd.received_qty) > 0 
            THEN (SUM(pd.defective_qty) / SUM(pd.received_qty)) * 100 
            ELSE 0.00 
          END, 2
        ) AS overall_defect_rate,
        COALESCE(SUM(pd.defective_qty), 0) AS total_defective_qty,
        COALESCE(SUM(pd.received_qty), 0) AS total_received_qty
      FROM Purchase_Orders po
      JOIN Suppliers s ON po.supplier_id = s.supplier_id AND s.status = 'Active'
      LEFT JOIN Procurement_Details pd ON po.po_id = pd.po_id
      WHERE 1=1 ${dateFilterPo}`,
      dateParams
    );

    // 2. Monthly Procurement Expenditure
    const [monthlySpend] = await pool.query(
      `SELECT 
        period_month,
        month_label,
        total_orders,
        total_spend,
        avg_order_value,
        on_time_rate,
        defect_rate
      FROM vw_monthly_procurement
      ORDER BY period_month ASC`
    );

    // 3. Top 8 Suppliers by Purchase Value + Others
    const [supplierSpendRows] = await pool.query(
      `SELECT 
        s.supplier_name,
        s.supplier_code,
        s.category,
        ROUND(SUM(po.total_amount), 2) AS total_value,
        COUNT(po.po_id) AS po_count
      FROM Purchase_Orders po
      JOIN Suppliers s ON po.supplier_id = s.supplier_id
      WHERE po.status != 'Cancelled' ${dateFilterPo}
      GROUP BY s.supplier_id, s.supplier_name, s.supplier_code, s.category
      ORDER BY total_value DESC`,
      dateParams
    );

    const top8Suppliers = supplierSpendRows.slice(0, 8);
    const otherSuppliers = supplierSpendRows.slice(8);
    if (otherSuppliers.length > 0) {
      const otherTotal = otherSuppliers.reduce((acc, curr) => acc + parseFloat(curr.total_value), 0);
      const otherOrders = otherSuppliers.reduce((acc, curr) => acc + curr.po_count, 0);
      top8Suppliers.push({
        supplier_name: 'Other Suppliers (Combined)',
        supplier_code: 'OTHER',
        category: 'Various',
        total_value: Math.round(otherTotal * 100) / 100,
        po_count: otherOrders
      });
    }

    // 4. Purchase Orders by Status
    const [statusDistribution] = await pool.query(
      `SELECT 
        po.status,
        COUNT(po.po_id) AS count,
        ROUND(SUM(po.total_amount), 2) AS total_amount
      FROM Purchase_Orders po
      WHERE 1=1 ${dateFilterPo}
      GROUP BY po.status
      ORDER BY count DESC`,
      dateParams
    );

    // 5. Category-wise Procurement Spend
    const [categorySpend] = await pool.query(
      `SELECT 
        p.category,
        ROUND(SUM(pd.line_total), 2) AS spend,
        SUM(pd.ordered_qty) AS units_ordered,
        COUNT(DISTINCT pd.product_id) AS distinct_products
      FROM Procurement_Details pd
      JOIN Products p ON pd.product_id = p.product_id
      JOIN Purchase_Orders po ON pd.po_id = po.po_id
      WHERE po.status != 'Cancelled' ${dateFilterPo}
      GROUP BY p.category
      ORDER BY spend DESC`,
      dateParams
    );

    // 6. Delivery Performance Trends
    const [deliveryTrends] = await pool.query(
      `SELECT 
        DATE_FORMAT(po.order_date, '%b %Y') AS month_label,
        DATE_FORMAT(po.order_date, '%Y-%m') AS period_month,
        ROUND(AVG(CASE 
          WHEN po.status = 'Delivered' AND po.actual_delivery_date IS NOT NULL 
          THEN DATEDIFF(po.actual_delivery_date, po.order_date) 
        END), 1) AS avg_delivery_days,
        ROUND(
          (COUNT(CASE WHEN po.status = 'Delivered' AND po.actual_delivery_date <= po.expected_delivery_date THEN 1 END) / 
           COUNT(CASE WHEN po.status = 'Delivered' THEN 1 END)) * 100, 
          2
        ) AS on_time_pct,
        COUNT(CASE WHEN po.actual_delivery_date > po.expected_delivery_date THEN 1 END) AS delayed_orders_count
      FROM Purchase_Orders po
      WHERE po.status = 'Delivered'
      GROUP BY DATE_FORMAT(po.order_date, '%Y-%m'), DATE_FORMAT(po.order_date, '%b %Y')
      ORDER BY period_month ASC`
    );

    res.json({
      success: true,
      data: {
        kpi: kpiRows[0],
        monthlySpend,
        supplierSpend: top8Suppliers,
        statusDistribution,
        categorySpend,
        deliveryTrends
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getSupplierPerformanceAnalytics(req, res, next) {
  try {
    // 1. All Suppliers with Reliability Metrics & Ranking
    const [rankings] = await pool.query(
      `SELECT 
        supplier_id,
        supplier_code,
        supplier_name,
        supplier_category,
        city,
        total_orders,
        total_spend,
        completed_orders,
        on_time_orders,
        delayed_orders,
        avg_delivery_days,
        on_time_delivery_rate,
        quality_score,
        fulfilment_rate,
        defect_rate,
        reliability_score,
        performance_tier,
        DENSE_RANK() OVER (ORDER BY reliability_score DESC) AS rank_position
      FROM vw_supplier_performance
      ORDER BY reliability_score DESC`
    );

    const top10 = rankings.slice(0, 10);
    const bottom10 = [...rankings].reverse().slice(0, 10);

    // 2. Scatter Plot Data: On-Time Delivery Rate vs Quality Score vs Total Spend
    const scatterData = rankings.map(s => ({
      name: s.supplier_name,
      code: s.supplier_code,
      otd: parseFloat(s.on_time_delivery_rate),
      quality: parseFloat(s.quality_score),
      fulfilment: parseFloat(s.fulfilment_rate),
      reliability: parseFloat(s.reliability_score),
      spend: parseFloat(s.total_spend),
      orders: s.total_orders,
      tier: s.performance_tier
    }));

    // 3. Performance Tier Breakdown Summary
    const tierCounts = {
      Elite: rankings.filter(r => r.performance_tier === 'Elite').length,
      Reliable: rankings.filter(r => r.performance_tier === 'Reliable').length,
      Watchlist: rankings.filter(r => r.performance_tier === 'Watchlist').length,
      'High Risk': rankings.filter(r => r.performance_tier === 'High Risk').length
    };

    res.json({
      success: true,
      data: {
        rankings,
        top10,
        bottom10,
        scatterData,
        tierCounts
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getCostAnalytics(req, res, next) {
  try {
    // 1. Month-over-Month (MoM) Spend Growth & Cumulative Running Spend
    const [momTrends] = await pool.query(
      `WITH MonthlySpendAgg AS (
        SELECT 
          DATE_FORMAT(order_date, '%Y-%m') AS order_month,
          DATE_FORMAT(order_date, '%b %Y') AS month_label,
          COUNT(po_id) AS total_pos,
          SUM(total_amount) AS monthly_spend
        FROM Purchase_Orders
        WHERE status != 'Cancelled'
        GROUP BY DATE_FORMAT(order_date, '%Y-%m'), DATE_FORMAT(order_date, '%b %Y')
      )
      SELECT 
        order_month,
        month_label,
        total_pos,
        ROUND(monthly_spend, 2) AS monthly_spend,
        ROUND(LAG(monthly_spend, 1) OVER (ORDER BY order_month ASC), 2) AS previous_month_spend,
        ROUND(
          CASE 
            WHEN LAG(monthly_spend, 1) OVER (ORDER BY order_month ASC) > 0 
            THEN ((monthly_spend - LAG(monthly_spend, 1) OVER (ORDER BY order_month ASC)) / LAG(monthly_spend, 1) OVER (ORDER BY order_month ASC)) * 100 
            ELSE 0.00 
          END, 2
        ) AS mom_growth_pct,
        ROUND(SUM(monthly_spend) OVER (ORDER BY order_month ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 2) AS cumulative_spend
      FROM MonthlySpendAgg
      ORDER BY order_month ASC`
    );

    // 2. Supplier Spend Breakdown & Pareto Analysis (Cumulative Percentage)
    const [paretoRows] = await pool.query(
      `WITH SupplierSpendRank AS (
        SELECT 
          s.supplier_name,
          s.supplier_code,
          s.category,
          ROUND(SUM(po.total_amount), 2) AS spend
        FROM Purchase_Orders po
        JOIN Suppliers s ON po.supplier_id = s.supplier_id
        WHERE po.status != 'Cancelled'
        GROUP BY s.supplier_id, s.supplier_name, s.supplier_code, s.category
      )
      SELECT 
        supplier_name,
        supplier_code,
        category,
        spend,
        ROUND(
          (SUM(spend) OVER (ORDER BY spend DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) / 
           SUM(spend) OVER ()) * 100, 2
        ) AS cumulative_pct
      FROM SupplierSpendRank
      ORDER BY spend DESC`
    );

    // 3. Category & Metal Cost Breakdown
    const [categoryCost] = await pool.query(
      `SELECT * FROM vw_procurement_cost_analysis ORDER BY total_procurement_spend DESC`
    );

    // 4. Cost Variation across Suppliers for Identical Categories
    const [costVariation] = await pool.query(
      `SELECT 
        p.category AS product_category,
        s.supplier_name,
        COUNT(DISTINCT pd.product_id) AS products_supplied,
        ROUND(AVG(pd.unit_price), 2) AS avg_unit_price,
        ROUND(MIN(pd.unit_price), 2) AS min_unit_price,
        ROUND(MAX(pd.unit_price), 2) AS max_unit_price
      FROM Procurement_Details pd
      JOIN Products p ON pd.product_id = p.product_id
      JOIN Purchase_Orders po ON pd.po_id = po.po_id
      JOIN Suppliers s ON po.supplier_id = s.supplier_id
      GROUP BY p.category, s.supplier_name
      ORDER BY p.category ASC, avg_unit_price DESC`
    );

    res.json({
      success: true,
      data: {
        momTrends,
        pareto: paretoRows,
        categoryCost,
        costVariation
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getQualityDeliveryAnalytics(req, res, next) {
  try {
    // 1. Overall Quality & Delivery Summary Metrics
    const [kpiRows] = await pool.query(
      `SELECT 
        COALESCE(SUM(pd.received_qty), 0) AS total_inspected_qty,
        COALESCE(SUM(pd.defective_qty), 0) AS total_defective_qty,
        COALESCE(SUM(pd.accepted_qty), 0) AS total_accepted_qty,
        ROUND(
          CASE 
            WHEN SUM(pd.received_qty) > 0 
            THEN (SUM(pd.defective_qty) / SUM(pd.received_qty)) * 100 
            ELSE 0.00 
          END, 2
        ) AS defect_rate_pct,
        ROUND(COALESCE(SUM(pd.defective_qty * pd.unit_price), 0), 2) AS total_defect_financial_loss,
        COUNT(DISTINCT CASE WHEN po.status = 'Delivered' AND po.actual_delivery_date > po.expected_delivery_date THEN po.po_id END) AS delayed_orders_count,
        ROUND(AVG(CASE 
          WHEN po.status = 'Delivered' AND po.actual_delivery_date > po.expected_delivery_date 
          THEN DATEDIFF(po.actual_delivery_date, po.expected_delivery_date) 
        END), 1) AS avg_delay_days,
        COUNT(DISTINCT CASE WHEN po.status = 'Partially Received' THEN po.po_id END) AS incomplete_orders_count
      FROM Purchase_Orders po
      LEFT JOIN Procurement_Details pd ON po.po_id = pd.po_id`
    );

    // 2. Quality & Defect Analysis by Supplier
    const [supplierQuality] = await pool.query(
      `SELECT 
        s.supplier_id,
        s.supplier_code,
        s.supplier_name,
        s.category AS supplier_category,
        COALESCE(SUM(pd.received_qty), 0) AS units_inspected,
        COALESCE(SUM(pd.defective_qty), 0) AS defective_units,
        COALESCE(SUM(pd.accepted_qty), 0) AS accepted_units,
        ROUND(
          CASE 
            WHEN SUM(pd.received_qty) > 0 
            THEN (SUM(pd.defective_qty) / SUM(pd.received_qty)) * 100 
            ELSE 0.00 
          END, 2
        ) AS defect_rate_pct,
        ROUND(
          CASE 
            WHEN SUM(pd.received_qty) > 0 
            THEN (SUM(pd.accepted_qty) / SUM(pd.received_qty)) * 100 
            ELSE 100.00 
          END, 2
        ) AS quality_score_pct,
        ROUND(COALESCE(SUM(pd.defective_qty * pd.unit_price), 0), 2) AS financial_loss
      FROM Suppliers s
      JOIN Purchase_Orders po ON s.supplier_id = po.supplier_id
      JOIN Procurement_Details pd ON po.po_id = pd.po_id
      WHERE po.status IN ('Delivered', 'Partially Received')
      GROUP BY s.supplier_id, s.supplier_code, s.supplier_name, s.category
      ORDER BY defect_rate_pct DESC`
    );

    // 3. Delivery Performance by Supplier
    const [deliveryPerformance] = await pool.query(
      `SELECT * FROM vw_delivery_performance ORDER BY on_time_delivery_pct ASC`
    );

    // 4. Defect Breakdown by Jewellery Category
    const [categoryDefects] = await pool.query(
      `SELECT 
        p.category,
        SUM(pd.received_qty) AS units_inspected,
        SUM(pd.defective_qty) AS defective_units,
        ROUND((SUM(pd.defective_qty) / SUM(pd.received_qty)) * 100, 2) AS defect_rate_pct,
        ROUND(SUM(pd.defective_qty * pd.unit_price), 2) AS scrap_loss
      FROM Procurement_Details pd
      JOIN Products p ON pd.product_id = p.product_id
      JOIN Purchase_Orders po ON pd.po_id = po.po_id
      WHERE po.status IN ('Delivered', 'Partially Received')
      GROUP BY p.category
      ORDER BY scrap_loss DESC`
    );

    res.json({
      success: true,
      data: {
        summary: kpiRows[0],
        supplierQuality,
        deliveryPerformance,
        categoryDefects
      }
    });
  } catch (error) {
    next(error);
  }
}
