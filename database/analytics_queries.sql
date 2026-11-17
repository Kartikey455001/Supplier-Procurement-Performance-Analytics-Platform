-- ============================================================================
-- JEWELLERY PROCUREMENT & SUPPLIER PERFORMANCE ANALYTICS PLATFORM
-- SQL Analytics Showcase & Complex Query Library (MySQL 8.0+)
-- ============================================================================
-- This script contains production-grade SQL analytical queries demonstrating:
--  1. SELECT, WHERE, and Complex Filtering
--  2. GROUP BY and HAVING Clauses
--  3. INNER JOIN, LEFT JOIN, and Multi-Table Joins
--  4. Conditional Logic with CASE WHEN Expressions
--  5. Aggregate Functions (SUM, AVG, COUNT, MIN, MAX, STDDEV)
--  6. Correlated and Uncorrelated Subqueries
--  7. Common Table Expressions (CTEs)
--  8. Advanced Window Functions (ROW_NUMBER, RANK, DENSE_RANK, LAG, NTILE, Moving Averages)
-- ============================================================================

USE jewellery_procurement_db;

-- ============================================================================
-- QUERY 1: Supplier Reliability Ranking with Multi-Factor Scoring Model
-- Demonstrates: CTE, INNER JOIN, LEFT JOIN, CASE WHEN, Window Function (RANK, DENSE_RANK)
-- Business Goal: Rank all active jewellery suppliers by their weighted Reliability Score.
-- Formula: (On-Time Delivery * 40%) + (Quality Score * 35%) + (Fulfilment Score * 25%)
-- ============================================================================
WITH SupplierRawMetrics AS (
    SELECT 
        s.supplier_id,
        s.supplier_code,
        s.supplier_name,
        s.category,
        s.payment_terms,
        COUNT(DISTINCT po.po_id) AS total_orders,
        SUM(po.total_amount) AS total_procurement_value,
        COUNT(DISTINCT CASE WHEN po.status = 'Delivered' THEN po.po_id END) AS completed_orders,
        COUNT(DISTINCT CASE 
            WHEN po.status = 'Delivered' AND po.actual_delivery_date <= po.expected_delivery_date 
            THEN po.po_id 
        END) AS on_time_orders,
        COALESCE(SUM(pd.ordered_qty), 0) AS total_ordered_qty,
        COALESCE(SUM(pd.received_qty), 0) AS total_received_qty,
        COALESCE(SUM(pd.defective_qty), 0) AS total_defective_qty
    FROM Suppliers s
    LEFT JOIN Purchase_Orders po ON s.supplier_id = po.supplier_id
    LEFT JOIN Procurement_Details pd ON po.po_id = pd.po_id
    WHERE s.status = 'Active'
    GROUP BY s.supplier_id, s.supplier_code, s.supplier_name, s.category, s.payment_terms
    HAVING COUNT(DISTINCT po.po_id) >= 5 -- Only evaluate established suppliers
),
SupplierScores AS (
    SELECT 
        supplier_id,
        supplier_code,
        supplier_name,
        category,
        total_orders,
        total_procurement_value,
        ROUND(
            CASE WHEN completed_orders > 0 
                THEN (on_time_orders / completed_orders) * 100 
                ELSE 100.0 
            END, 2
        ) AS on_time_delivery_score,
        ROUND(
            CASE WHEN total_received_qty > 0 
                THEN GREATEST(0.0, 100.0 - ((total_defective_qty / total_received_qty) * 100)) 
                ELSE 100.0 
            END, 2
        ) AS quality_score,
        ROUND(
            CASE WHEN total_ordered_qty > 0 
                THEN LEAST(100.0, (total_received_qty / total_ordered_qty) * 100) 
                ELSE 100.0 
            END, 2
        ) AS fulfilment_score
    FROM SupplierRawMetrics
)
SELECT 
    supplier_code,
    supplier_name,
    category,
    total_orders,
    ROUND(total_procurement_value, 2) AS total_spend_inr,
    on_time_delivery_score,
    quality_score,
    fulfilment_score,
    ROUND(
        (on_time_delivery_score * 0.40) + 
        (quality_score * 0.35) + 
        (fulfilment_score * 0.25), 
        2
    ) AS supplier_reliability_score,
    CASE 
        WHEN ((on_time_delivery_score * 0.40) + (quality_score * 0.35) + (fulfilment_score * 0.25)) >= 90.0 THEN 'Tier 1 (Elite)'
        WHEN ((on_time_delivery_score * 0.40) + (quality_score * 0.35) + (fulfilment_score * 0.25)) >= 80.0 THEN 'Tier 2 (Reliable)'
        WHEN ((on_time_delivery_score * 0.40) + (quality_score * 0.35) + (fulfilment_score * 0.25)) >= 70.0 THEN 'Tier 3 (Watchlist)'
        ELSE 'Tier 4 (High Risk)'
    END AS performance_tier,
    DENSE_RANK() OVER (
        ORDER BY ((on_time_delivery_score * 0.40) + (quality_score * 0.35) + (fulfilment_score * 0.25)) DESC
    ) AS rank_by_reliability
FROM SupplierScores
ORDER BY supplier_reliability_score DESC;

-- ============================================================================
-- QUERY 2: Month-over-Month (MoM) Spend Growth & Cumulative Running Spend
-- Demonstrates: Window Functions (LAG, SUM OVER), CTE, DATE functions, Subquery
-- Business Goal: Track monthly procurement expenditure velocity and MoM expansion rate.
-- ============================================================================
WITH MonthlyAggregates AS (
    SELECT 
        DATE_FORMAT(order_date, '%Y-%m') AS order_month,
        YEAR(order_date) AS order_year,
        MONTH(order_date) AS month_number,
        COUNT(po_id) AS total_pos,
        SUM(total_amount) AS monthly_spend
    FROM Purchase_Orders
    WHERE status != 'Cancelled'
    GROUP BY DATE_FORMAT(order_date, '%Y-%m'), YEAR(order_date), MONTH(order_date)
)
SELECT 
    order_month,
    total_pos,
    ROUND(monthly_spend, 2) AS monthly_spend,
    ROUND(
        LAG(monthly_spend, 1) OVER (ORDER BY order_month ASC), 
        2
    ) AS previous_month_spend,
    ROUND(
        (monthly_spend - LAG(monthly_spend, 1) OVER (ORDER BY order_month ASC)), 
        2
    ) AS net_spend_change,
    ROUND(
        CASE 
            WHEN LAG(monthly_spend, 1) OVER (ORDER BY order_month ASC) > 0 
            THEN ((monthly_spend - LAG(monthly_spend, 1) OVER (ORDER BY order_month ASC)) / LAG(monthly_spend, 1) OVER (ORDER BY order_month ASC)) * 100 
            ELSE 0.00 
        END, 
        2
    ) AS mom_growth_pct,
    ROUND(
        SUM(monthly_spend) OVER (ORDER BY order_month ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 
        2
    ) AS cumulative_running_spend
FROM MonthlyAggregates
ORDER BY order_month ASC;

-- ============================================================================
-- QUERY 3: Supplier Price Variance vs Category Benchmark Average
-- Demonstrates: Window Functions (AVG OVER PARTITION BY), Subqueries, Joins, CASE
-- Business Goal: Detect suppliers overcharging for comparable metal & jewellery categories.
-- ============================================================================
SELECT 
    s.supplier_name,
    p.category AS product_category,
    p.metal_type,
    p.purity,
    p.sku,
    p.product_name,
    ROUND(pd.unit_price, 2) AS supplier_unit_price,
    ROUND(
        AVG(pd.unit_price) OVER (PARTITION BY p.category, p.metal_type, p.purity), 
        2
    ) AS category_benchmark_avg_cost,
    ROUND(
        pd.unit_price - AVG(pd.unit_price) OVER (PARTITION BY p.category, p.metal_type, p.purity), 
        2
    ) AS variance_from_benchmark,
    ROUND(
        ((pd.unit_price - AVG(pd.unit_price) OVER (PARTITION BY p.category, p.metal_type, p.purity)) / 
          AVG(pd.unit_price) OVER (PARTITION BY p.category, p.metal_type, p.purity)) * 100, 
        2
    ) AS percentage_variance,
    CASE 
        WHEN pd.unit_price > 1.10 * AVG(pd.unit_price) OVER (PARTITION BY p.category, p.metal_type, p.purity) THEN 'High Cost (>10% Premium)'
        WHEN pd.unit_price < 0.90 * AVG(pd.unit_price) OVER (PARTITION BY p.category, p.metal_type, p.purity) THEN 'Cost Advantage (>10% Discount)'
        ELSE 'Fair Market Range'
    END AS cost_position_tier
FROM Procurement_Details pd
JOIN Purchase_Orders po ON pd.po_id = po.po_id
JOIN Suppliers s ON po.supplier_id = s.supplier_id
JOIN Products p ON pd.product_id = p.product_id
WHERE po.status = 'Delivered'
ORDER BY percentage_variance DESC;

-- ============================================================================
-- QUERY 4: Defect Cost Impact & Return Rate by Product Category and Supplier
-- Demonstrates: GROUP BY, HAVING, Aggregate Functions, Complex CASE WHEN, Joins
-- Business Goal: Identify which jewellery categories suffer highest financial loss from defects.
-- ============================================================================
SELECT 
    p.category AS jewellery_category,
    s.supplier_name,
    COUNT(DISTINCT po.po_id) AS total_orders_involved,
    SUM(pd.received_qty) AS total_units_received,
    SUM(pd.defective_qty) AS total_defective_units,
    ROUND(
        (SUM(pd.defective_qty) / SUM(pd.received_qty)) * 100, 
        2
    ) AS category_defect_rate_pct,
    ROUND(SUM(pd.defective_qty * pd.unit_price), 2) AS total_scrap_loss_inr,
    ROUND(AVG(pd.unit_price), 2) AS avg_unit_cost,
    CASE 
        WHEN (SUM(pd.defective_qty) / SUM(pd.received_qty)) * 100 > 5.0 THEN 'CRITICAL QUALITY BREACH'
        WHEN (SUM(pd.defective_qty) / SUM(pd.received_qty)) * 100 > 2.5 THEN 'ELEVATED DEFECT RISK'
        ELSE 'ACCEPTABLE QUALITY'
    END AS quality_action_status
FROM Procurement_Details pd
JOIN Products p ON pd.product_id = p.product_id
JOIN Purchase_Orders po ON pd.po_id = po.po_id
JOIN Suppliers s ON po.supplier_id = s.supplier_id
WHERE po.status IN ('Delivered', 'Partially Received')
GROUP BY p.category, s.supplier_name
HAVING SUM(pd.received_qty) > 50 AND SUM(pd.defective_qty) > 0
ORDER BY total_scrap_loss_inr DESC;

-- ============================================================================
-- QUERY 5: Supplier Delivery Delay Severity & Lead Time Deviation
-- Demonstrates: Correlated Subquery / CTE, DATEDIFF, Aggregate Functions, Window NTILE
-- Business Goal: Classify delivery delays into quartiles and identify serial offenders.
-- ============================================================================
WITH DeliveryMetrics AS (
    SELECT 
        s.supplier_name,
        s.category AS supplier_category,
        s.lead_time_days AS contractual_lead_days,
        po.po_number,
        po.order_date,
        po.expected_delivery_date,
        po.actual_delivery_date,
        DATEDIFF(po.actual_delivery_date, po.order_date) AS actual_lead_days,
        DATEDIFF(po.actual_delivery_date, po.expected_delivery_date) AS delay_in_days,
        CASE 
            WHEN po.actual_delivery_date <= po.expected_delivery_date THEN 0
            ELSE DATEDIFF(po.actual_delivery_date, po.expected_delivery_date)
        END AS positive_delay_days
    FROM Purchase_Orders po
    JOIN Suppliers s ON po.supplier_id = s.supplier_id
    WHERE po.status = 'Delivered' AND po.actual_delivery_date IS NOT NULL
)
SELECT 
    supplier_name,
    supplier_category,
    contractual_lead_days,
    COUNT(po_number) AS total_deliveries,
    COUNT(CASE WHEN delay_in_days > 0 THEN 1 END) AS delayed_deliveries_count,
    ROUND(
        (COUNT(CASE WHEN delay_in_days <= 0 THEN 1 END) / COUNT(po_number)) * 100, 
        2
    ) AS on_time_delivery_pct,
    ROUND(AVG(actual_lead_days), 1) AS avg_turnaround_days,
    ROUND(AVG(CASE WHEN delay_in_days > 0 THEN delay_in_days END), 1) AS avg_delay_when_late_days,
    MAX(delay_in_days) AS longest_recorded_delay_days,
    NTILE(4) OVER (ORDER BY AVG(CASE WHEN delay_in_days > 0 THEN delay_in_days ELSE 0 END) DESC) AS delay_severity_quartile
FROM DeliveryMetrics
GROUP BY supplier_name, supplier_category, contractual_lead_days
ORDER BY delayed_deliveries_count DESC, avg_delay_when_late_days DESC;

-- ============================================================================
-- QUERY 6: Top 10 and Bottom 10 Suppliers by Performance Score
-- Demonstrates: UNION ALL, Subquery, Window Function (ROW_NUMBER)
-- Business Goal: Executive dashboard slice showing top performers vs underperformers.
-- ============================================================================
WITH RankedSuppliers AS (
    SELECT 
        supplier_id,
        supplier_code,
        supplier_name,
        supplier_category,
        reliability_score,
        on_time_delivery_rate,
        quality_score,
        fulfilment_rate,
        total_spend,
        ROW_NUMBER() OVER (ORDER BY reliability_score DESC) AS best_rank,
        ROW_NUMBER() OVER (ORDER BY reliability_score ASC) AS worst_rank
    FROM vw_supplier_performance
    WHERE total_orders >= 5
)
SELECT 
    'Top 10 Performers' AS cohort_type,
    best_rank AS ranking,
    supplier_code,
    supplier_name,
    supplier_category,
    reliability_score,
    on_time_delivery_rate,
    quality_score,
    fulfilment_rate,
    total_spend
FROM RankedSuppliers
WHERE best_rank <= 10

UNION ALL

SELECT 
    'Bottom 10 Performers' AS cohort_type,
    worst_rank AS ranking,
    supplier_code,
    supplier_name,
    supplier_category,
    reliability_score,
    on_time_delivery_rate,
    quality_score,
    fulfilment_rate,
    total_spend
FROM RankedSuppliers
WHERE worst_rank <= 10
ORDER BY cohort_type DESC, ranking ASC;
