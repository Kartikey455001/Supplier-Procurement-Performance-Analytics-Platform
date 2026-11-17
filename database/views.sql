-- ============================================================================
-- JEWELLERY PROCUREMENT & SUPPLIER PERFORMANCE ANALYTICS PLATFORM
-- SQL Analytical Views Definition (MySQL 8.0+)
-- ============================================================================

USE jewellery_procurement_db;

-- Drop existing views
DROP VIEW IF EXISTS vw_supplier_performance;
DROP VIEW IF EXISTS vw_monthly_procurement;
DROP VIEW IF EXISTS vw_supplier_quality;
DROP VIEW IF EXISTS vw_delivery_performance;
DROP VIEW IF EXISTS vw_procurement_cost_analysis;

-- ============================================================================
-- 1. VIEW: vw_supplier_performance
-- Comprehensive Supplier Reliability, Delivery & Quality KPIs
-- Reliability Formula: (On-Time Delivery * 40%) + (Quality Score * 35%) + (Fulfilment Score * 25%)
-- ============================================================================
CREATE VIEW vw_supplier_performance AS
WITH SupplierBaseAggregates AS (
    SELECT 
        s.supplier_id,
        s.supplier_code,
        s.supplier_name,
        s.category AS supplier_category,
        s.city,
        s.country,
        s.payment_terms,
        s.status AS supplier_status,
        COUNT(DISTINCT po.po_id) AS total_orders,
        COALESCE(SUM(po.total_amount), 0.00) AS total_spend,
        COUNT(DISTINCT CASE WHEN po.status = 'Delivered' THEN po.po_id END) AS completed_orders,
        COUNT(DISTINCT CASE 
            WHEN po.status = 'Delivered' AND po.actual_delivery_date IS NOT NULL 
                 AND po.actual_delivery_date <= po.expected_delivery_date 
            THEN po.po_id 
        END) AS on_time_orders,
        COUNT(DISTINCT CASE 
            WHEN po.status = 'Delivered' AND po.actual_delivery_date IS NOT NULL 
                 AND po.actual_delivery_date > po.expected_delivery_date 
            THEN po.po_id 
        END) AS delayed_orders,
        COUNT(DISTINCT CASE WHEN po.status = 'Partially Received' THEN po.po_id END) AS incomplete_orders,
        AVG(CASE 
            WHEN po.status = 'Delivered' AND po.actual_delivery_date IS NOT NULL 
            THEN DATEDIFF(po.actual_delivery_date, po.order_date) 
        END) AS avg_delivery_days,
        AVG(CASE 
            WHEN po.status = 'Delivered' AND po.actual_delivery_date > po.expected_delivery_date 
            THEN DATEDIFF(po.actual_delivery_date, po.expected_delivery_date) 
        END) AS avg_delay_days,
        COALESCE(SUM(pd.ordered_qty), 0) AS total_ordered_qty,
        COALESCE(SUM(pd.received_qty), 0) AS total_received_qty,
        COALESCE(SUM(pd.defective_qty), 0) AS total_defective_qty,
        COALESCE(SUM(pd.accepted_qty), 0) AS total_accepted_qty,
        COALESCE(SUM(pd.defective_qty * pd.unit_price), 0.00) AS total_defect_cost
    FROM Suppliers s
    LEFT JOIN Purchase_Orders po ON s.supplier_id = po.supplier_id
    LEFT JOIN Procurement_Details pd ON po.po_id = pd.po_id
    GROUP BY 
        s.supplier_id, s.supplier_code, s.supplier_name, s.category, 
        s.city, s.country, s.payment_terms, s.status
)
SELECT 
    supplier_id,
    supplier_code,
    supplier_name,
    supplier_category,
    city,
    country,
    payment_terms,
    supplier_status,
    total_orders,
    ROUND(total_spend, 2) AS total_spend,
    completed_orders,
    on_time_orders,
    delayed_orders,
    incomplete_orders,
    ROUND(COALESCE(avg_delivery_days, 0), 1) AS avg_delivery_days,
    ROUND(COALESCE(avg_delay_days, 0), 1) AS avg_delay_days,
    total_ordered_qty,
    total_received_qty,
    total_defective_qty,
    total_accepted_qty,
    ROUND(total_defect_cost, 2) AS total_defect_cost,
    
    -- On-Time Delivery Rate (capped at 100%)
    ROUND(
        CASE 
            WHEN completed_orders > 0 THEN (on_time_orders / completed_orders) * 100 
            ELSE 100.00 
        END, 2
    ) AS on_time_delivery_rate,
    
    -- Fulfilment Rate (received / ordered capped at 100%)
    ROUND(
        CASE 
            WHEN total_ordered_qty > 0 THEN LEAST(100.00, (total_received_qty / total_ordered_qty) * 100) 
            ELSE 100.00 
        END, 2
    ) AS fulfilment_rate,
    
    -- Defect Rate
    ROUND(
        CASE 
            WHEN total_received_qty > 0 THEN (total_defective_qty / total_received_qty) * 100 
            ELSE 0.00 
        END, 2
    ) AS defect_rate,
    
    -- Quality Score (100 - Defect Rate, bounded [0, 100])
    ROUND(
        GREATEST(0.00, 100.00 - CASE 
            WHEN total_received_qty > 0 THEN (total_defective_qty / total_received_qty) * 100 
            ELSE 0.00 
        END), 2
    ) AS quality_score,
    
    -- Reliability Score: (OTD * 40%) + (Quality * 35%) + (Fulfilment * 25%)
    ROUND(
        (
            (CASE WHEN completed_orders > 0 THEN (on_time_orders / completed_orders) * 100 ELSE 100.00 END) * 0.40
        ) + (
            GREATEST(0.00, 100.00 - CASE WHEN total_received_qty > 0 THEN (total_defective_qty / total_received_qty) * 100 ELSE 0.00 END) * 0.35
        ) + (
            (CASE WHEN total_ordered_qty > 0 THEN LEAST(100.00, (total_received_qty / total_ordered_qty) * 100) ELSE 100.00 END) * 0.25
        ), 2
    ) AS reliability_score,
    
    -- Performance Tier Assignment
    CASE 
        WHEN (
            ((CASE WHEN completed_orders > 0 THEN (on_time_orders / completed_orders) * 100 ELSE 100.00 END) * 0.40) +
            (GREATEST(0.00, 100.00 - CASE WHEN total_received_qty > 0 THEN (total_defective_qty / total_received_qty) * 100 ELSE 0.00 END) * 0.35) +
            ((CASE WHEN total_ordered_qty > 0 THEN LEAST(100.00, (total_received_qty / total_ordered_qty) * 100) ELSE 100.00 END) * 0.25)
        ) >= 90.00 THEN 'Elite'
        WHEN (
            ((CASE WHEN completed_orders > 0 THEN (on_time_orders / completed_orders) * 100 ELSE 100.00 END) * 0.40) +
            (GREATEST(0.00, 100.00 - CASE WHEN total_received_qty > 0 THEN (total_defective_qty / total_received_qty) * 100 ELSE 0.00 END) * 0.35) +
            ((CASE WHEN total_ordered_qty > 0 THEN LEAST(100.00, (total_received_qty / total_ordered_qty) * 100) ELSE 100.00 END) * 0.25)
        ) >= 80.00 THEN 'Reliable'
        WHEN (
            ((CASE WHEN completed_orders > 0 THEN (on_time_orders / completed_orders) * 100 ELSE 100.00 END) * 0.40) +
            (GREATEST(0.00, 100.00 - CASE WHEN total_received_qty > 0 THEN (total_defective_qty / total_received_qty) * 100 ELSE 0.00 END) * 0.35) +
            ((CASE WHEN total_ordered_qty > 0 THEN LEAST(100.00, (total_received_qty / total_ordered_qty) * 100) ELSE 100.00 END) * 0.25)
        ) >= 70.00 THEN 'Watchlist'
        ELSE 'High Risk'
    END AS performance_tier
FROM SupplierBaseAggregates;

-- ============================================================================
-- 2. VIEW: vw_monthly_procurement
-- Monthly Spend, Order Counts, On-Time Rates and Quality Metrics
-- ============================================================================
CREATE VIEW vw_monthly_procurement AS
SELECT 
    DATE_FORMAT(po.order_date, '%Y-%m') AS period_month,
    YEAR(po.order_date) AS order_year,
    MONTH(po.order_date) AS order_month_num,
    DATE_FORMAT(po.order_date, '%b %Y') AS month_label,
    COUNT(DISTINCT po.po_id) AS total_orders,
    ROUND(SUM(po.total_amount), 2) AS total_spend,
    ROUND(AVG(po.total_amount), 2) AS avg_order_value,
    COUNT(DISTINCT CASE WHEN po.status = 'Delivered' THEN po.po_id END) AS completed_orders,
    COUNT(DISTINCT CASE 
        WHEN po.status = 'Delivered' AND po.actual_delivery_date IS NOT NULL 
             AND po.actual_delivery_date <= po.expected_delivery_date 
        THEN po.po_id 
    END) AS on_time_orders,
    COUNT(DISTINCT CASE 
        WHEN po.status = 'Delivered' AND po.actual_delivery_date IS NOT NULL 
             AND po.actual_delivery_date > po.expected_delivery_date 
        THEN po.po_id 
    END) AS delayed_orders,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT CASE WHEN po.status = 'Delivered' THEN po.po_id END) > 0 
            THEN (COUNT(DISTINCT CASE WHEN po.status = 'Delivered' AND po.actual_delivery_date <= po.expected_delivery_date THEN po.po_id END) / 
                  COUNT(DISTINCT CASE WHEN po.status = 'Delivered' THEN po.po_id END)) * 100 
            ELSE 100.00 
        END, 2
    ) AS on_time_rate,
    COALESCE(SUM(pd.ordered_qty), 0) AS total_ordered_qty,
    COALESCE(SUM(pd.received_qty), 0) AS total_received_qty,
    COALESCE(SUM(pd.defective_qty), 0) AS total_defective_qty,
    ROUND(
        CASE 
            WHEN SUM(pd.received_qty) > 0 
            THEN (SUM(pd.defective_qty) / SUM(pd.received_qty)) * 100 
            ELSE 0.00 
        END, 2
    ) AS defect_rate
FROM Purchase_Orders po
LEFT JOIN Procurement_Details pd ON po.po_id = pd.po_id
GROUP BY 
    DATE_FORMAT(po.order_date, '%Y-%m'),
    YEAR(po.order_date),
    MONTH(po.order_date),
    DATE_FORMAT(po.order_date, '%b %Y')
ORDER BY period_month ASC;

-- ============================================================================
-- 3. VIEW: vw_supplier_quality
-- In-depth Quality, Inspection and Defect Cost Analysis by Supplier & Category
-- ============================================================================
CREATE VIEW vw_supplier_quality AS
SELECT 
    s.supplier_id,
    s.supplier_code,
    s.supplier_name,
    s.category AS supplier_category,
    p.category AS product_category,
    COUNT(DISTINCT po.po_id) AS total_orders,
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
    ROUND(COALESCE(SUM(pd.defective_qty * pd.unit_price), 0.00), 2) AS defect_financial_impact
FROM Suppliers s
JOIN Purchase_Orders po ON s.supplier_id = po.supplier_id
JOIN Procurement_Details pd ON po.po_id = pd.po_id
JOIN Products p ON pd.product_id = p.product_id
WHERE po.status IN ('Delivered', 'Partially Received')
GROUP BY 
    s.supplier_id, s.supplier_code, s.supplier_name, s.category, p.category;

-- ============================================================================
-- 4. VIEW: vw_delivery_performance
-- Delivery Performance, Lead Times, and Delays
-- ============================================================================
CREATE VIEW vw_delivery_performance AS
SELECT 
    s.supplier_id,
    s.supplier_code,
    s.supplier_name,
    s.lead_time_days AS agreed_lead_time_days,
    COUNT(DISTINCT po.po_id) AS total_dispatched_orders,
    COUNT(DISTINCT CASE 
        WHEN po.actual_delivery_date IS NOT NULL AND po.actual_delivery_date <= po.expected_delivery_date 
        THEN po.po_id 
    END) AS on_time_orders,
    COUNT(DISTINCT CASE 
        WHEN po.actual_delivery_date IS NOT NULL AND po.actual_delivery_date > po.expected_delivery_date 
        THEN po.po_id 
    END) AS delayed_orders,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT po.po_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN po.actual_delivery_date <= po.expected_delivery_date THEN po.po_id END) / COUNT(DISTINCT po.po_id)) * 100 
            ELSE 100.00 
        END, 2
    ) AS on_time_delivery_pct,
    ROUND(COALESCE(AVG(DATEDIFF(po.actual_delivery_date, po.order_date)), 0), 1) AS avg_actual_lead_days,
    ROUND(COALESCE(AVG(CASE 
        WHEN po.actual_delivery_date > po.expected_delivery_date 
        THEN DATEDIFF(po.actual_delivery_date, po.expected_delivery_date) 
    END), 0), 1) AS avg_delay_days,
    MAX(CASE 
        WHEN po.actual_delivery_date > po.expected_delivery_date 
        THEN DATEDIFF(po.actual_delivery_date, po.expected_delivery_date) 
        ELSE 0 
    END) AS max_delay_days
FROM Suppliers s
JOIN Purchase_Orders po ON s.supplier_id = po.supplier_id
WHERE po.status = 'Delivered' AND po.actual_delivery_date IS NOT NULL
GROUP BY s.supplier_id, s.supplier_code, s.supplier_name, s.lead_time_days;

-- ============================================================================
-- 5. VIEW: vw_procurement_cost_analysis
-- Category, Metal Type & Product Cost Breakdown
-- ============================================================================
CREATE VIEW vw_procurement_cost_analysis AS
SELECT 
    p.category AS product_category,
    p.metal_type,
    p.purity,
    COUNT(DISTINCT p.product_id) AS total_products,
    COUNT(DISTINCT po.supplier_id) AS active_suppliers_count,
    COALESCE(SUM(pd.ordered_qty), 0) AS total_units_ordered,
    COALESCE(SUM(pd.received_qty), 0) AS total_units_received,
    ROUND(COALESCE(SUM(pd.line_total), 0.00), 2) AS total_procurement_spend,
    ROUND(COALESCE(AVG(pd.unit_price), 0.00), 2) AS avg_unit_price,
    ROUND(MIN(pd.unit_price), 2) AS min_unit_price,
    ROUND(MAX(pd.unit_price), 2) AS max_unit_price
FROM Products p
LEFT JOIN Procurement_Details pd ON p.product_id = pd.product_id
LEFT JOIN Purchase_Orders po ON pd.po_id = po.po_id
GROUP BY p.category, p.metal_type, p.purity;
