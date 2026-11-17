-- ============================================================================
-- JEWELLERY PROCUREMENT & SUPPLIER PERFORMANCE ANALYTICS PLATFORM
-- Database Schema Definition (MySQL 8.0+)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS jewellery_procurement_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE jewellery_procurement_db;

-- Disable foreign key checks during schema creation
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables to allow clean re-runs if necessary
DROP TABLE IF EXISTS Supplier_Payments;
DROP TABLE IF EXISTS Procurement_Details;
DROP TABLE IF EXISTS Purchase_Orders;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS Suppliers;
DROP TABLE IF EXISTS Users;

-- ============================================================================
-- 1. USERS TABLE (Role-Based Authentication: Admin / Analyst)
-- ============================================================================
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'analyst') NOT NULL DEFAULT 'analyst',
    department VARCHAR(50) DEFAULT 'Procurement & Supply Chain',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. SUPPLIERS TABLE
-- ============================================================================
CREATE TABLE Suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_code VARCHAR(20) NOT NULL UNIQUE,
    supplier_name VARCHAR(150) NOT NULL,
    category VARCHAR(60) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    city VARCHAR(60) NOT NULL,
    country VARCHAR(60) NOT NULL DEFAULT 'India',
    tax_id VARCHAR(50) NOT NULL,
    payment_terms VARCHAR(30) NOT NULL DEFAULT 'Net 30',
    lead_time_days INT NOT NULL DEFAULT 14,
    status ENUM('Active', 'Inactive', 'Under Review', 'Suspended') NOT NULL DEFAULT 'Active',
    rating DECIMAL(3, 2) NOT NULL DEFAULT 4.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_supplier_status (status),
    INDEX idx_supplier_category (category),
    INDEX idx_supplier_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. PRODUCTS TABLE (Jewellery & Gemstones)
-- ============================================================================
CREATE TABLE Products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(40) NOT NULL UNIQUE,
    product_name VARCHAR(160) NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(60) NULL,
    metal_type VARCHAR(40) NOT NULL,
    purity VARCHAR(30) NOT NULL,
    gemstone VARCHAR(50) NOT NULL DEFAULT 'None',
    unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'Pieces',
    base_unit_cost DECIMAL(12, 2) NOT NULL,
    standard_lead_days INT NOT NULL DEFAULT 10,
    min_order_qty INT NOT NULL DEFAULT 5,
    stock_level INT NOT NULL DEFAULT 0,
    reorder_point INT NOT NULL DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_product_category (category),
    INDEX idx_product_metal (metal_type),
    INDEX idx_product_gemstone (gemstone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. PURCHASE_ORDERS TABLE
-- ============================================================================
CREATE TABLE Purchase_Orders (
    po_id INT AUTO_INCREMENT PRIMARY KEY,
    po_number VARCHAR(30) NOT NULL UNIQUE,
    supplier_id INT NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE NOT NULL,
    actual_delivery_date DATE NULL,
    status ENUM('Pending', 'In Transit', 'Delivered', 'Partially Received', 'Cancelled') NOT NULL DEFAULT 'Pending',
    total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('Unpaid', 'Partially Paid', 'Paid') NOT NULL DEFAULT 'Unpaid',
    notes TEXT NULL,
    created_by VARCHAR(60) DEFAULT 'Procurement Team',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_po_supplier
        FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_po_supplier (supplier_id),
    INDEX idx_po_status (status),
    INDEX idx_po_order_date (order_date),
    INDEX idx_po_expected_date (expected_delivery_date),
    INDEX idx_po_actual_date (actual_delivery_date),
    INDEX idx_po_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. PROCUREMENT_DETAILS TABLE (Line Items)
-- ============================================================================
CREATE TABLE Procurement_Details (
    detail_id INT AUTO_INCREMENT PRIMARY KEY,
    po_id INT NOT NULL,
    product_id INT NOT NULL,
    ordered_qty INT NOT NULL,
    received_qty INT NOT NULL DEFAULT 0,
    defective_qty INT NOT NULL DEFAULT 0,
    accepted_qty INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(12, 2) NOT NULL,
    line_total DECIMAL(14, 2) NOT NULL,
    remarks VARCHAR(255) NULL,
    CONSTRAINT fk_pd_po
        FOREIGN KEY (po_id) REFERENCES Purchase_Orders(po_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_pd_product
        FOREIGN KEY (product_id) REFERENCES Products(product_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_pd_po (po_id),
    INDEX idx_pd_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. SUPPLIER_PAYMENTS TABLE
-- ============================================================================
CREATE TABLE Supplier_Payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_number VARCHAR(30) NOT NULL UNIQUE,
    po_id INT NOT NULL,
    supplier_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount_paid DECIMAL(14, 2) NOT NULL,
    payment_method ENUM('Bank Transfer (NEFT/RTGS)', 'Wire Transfer', 'Letter of Credit', 'Cheque', 'Corporate Card') NOT NULL DEFAULT 'Bank Transfer (NEFT/RTGS)',
    payment_status ENUM('Completed', 'Pending', 'Failed') NOT NULL DEFAULT 'Completed',
    transaction_reference VARCHAR(100) NOT NULL,
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_po
        FOREIGN KEY (po_id) REFERENCES Purchase_Orders(po_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pay_supplier
        FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_pay_po (po_id),
    INDEX idx_pay_supplier (supplier_id),
    INDEX idx_pay_date (payment_date),
    INDEX idx_pay_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
