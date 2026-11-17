# 💎 Aurum Procure: Supplier & Procurement Performance Analytics Platform

> An enterprise-grade, responsive, full-stack Supplier & Procurement Performance Analytics platform engineered for retail and e-commerce jewellery enterprises.

---

## 🌟 Executive Summary

**Aurum Procure** is an enterprise analytics platform that empowers jewellery retail executives, procurement managers, and supply chain analysts to monitor vendor reliability, procurement expenditure, shipment delays, product defect rates, and supplier quality compliance.

Built without any Python dependencies, the platform harnesses a high-performance **MySQL 8.0** relational core with complex analytical SQL views, window functions, and Common Table Expressions (CTEs), exposed via a modular **Node.js & Express** REST API and rendered through a luxury-themed **React (Vite) + Tailwind CSS + Recharts** interface.

---

## 🏛️ Technology Stack

| Layer | Technologies | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, JavaScript, Tailwind CSS, Recharts, Lucide Icons, React Router 6 | Modern, desktop-first, luxury dark-themed dashboard with responsive charts & tables |
| **Backend** | Node.js, Express.js, MySQL2 (Promise Pool), JWT, Bcrypt.js, Multer | Modular REST API with role-based access control, transaction integrity, and error handling |
| **Database** | MySQL 8.0 Community Server | Primary relational database with DDL constraints, foreign keys, indexes, and analytical views |
| **Data Analytics** | SQL (MySQL), MS Excel (CSV import/export), Power BI Desktop (DAX) | Multi-tool analytics architecture sharing an identical relational semantic foundation |

> **Strict Compliance**: Zero Python, Pandas, NumPy, MongoDB, Firebase, or Supabase. All logic, data generation, and analytics are implemented in JavaScript and SQL.

---

## 🗄️ Relational Database Architecture

The platform uses a normalized relational schema (`jewellery_procurement_db`) with 6 core tables and 5 reusable analytical views:

### Tables
1. **`Suppliers`**: 25 specialized jewellery vendors across India (Surat, Mumbai, Jaipur, Kolkata, Chennai, Thrissur).
2. **`Products`**: 125 jewellery products (Gold 22K/18K/24K, Platinum 950, Sterling Silver 925, Diamonds VVS, Emeralds, Rubies, Pearls, Tanzanite).
3. **`Purchase_Orders`**: 1,250 purchase orders spanning 14 months of historical procurement.
4. **`Procurement_Details`**: 3,101 line items tracking ordered, received, defective, and accepted quantities with unit pricing.
5. **`Supplier_Payments`**: 1,179 settlement payments tracking payment methods (RTGS, NEFT, LC), amounts, and UTR reference codes.
6. **`Users`**: Role-based authentication (`admin` and `analyst` accounts with bcrypt password hashes).

### Analytical SQL Views (`database/views.sql`)
- `vw_supplier_performance`: Comprehensive supplier reliability score, on-time delivery rate, quality compliance, and tier classifications.
- `vw_monthly_procurement`: Chronological monthly expenditure, order counts, and defect trends.
- `vw_supplier_quality`: Inspection metrics, unit defect percentages, and scrap write-off values.
- `vw_delivery_performance`: Contractual SLA vs actual lead times and late delivery delays.
- `vw_procurement_cost_analysis`: Product category and metal purity cost aggregations.

### Advanced SQL Query Showcase (`database/analytics_queries.sql`)
The repository includes a SQL showcase featuring:
- **CTEs (Common Table Expressions)** for multi-stage reliability scoring.
- **Window Functions**: `RANK()`, `DENSE_RANK()`, `ROW_NUMBER()`, `NTILE(4)`, `LAG()` for MoM spend velocity, and `AVG() OVER (PARTITION BY ...)` for category benchmark variance.
- **Complex Aggregations**: `HAVING`, multi-table `INNER JOIN` and `LEFT JOIN`, conditional `CASE WHEN` logic.

---

## 📐 Supplier Reliability Scoring Model

Suppliers are ranked via a mathematically weighted reliability formula:

$$\text{Reliability Score} = (\text{OTD Score} \times 40\%) + (\text{Quality Score} \times 35\%) + (\text{Fulfilment Score} \times 25\%)$$

Where:
- **On-Time Delivery (OTD) Score (40%)**:
  $$\text{OTD Rate} = \left(\frac{\text{Delivered Orders where } \text{actual\_date} \le \text{expected\_date}}{\text{Total Delivered Orders}}\right) \times 100$$
- **Quality Score (35%)**:
  $$\text{Quality Score} = \max\left(0, 100 - \left(\frac{\text{Total Defective Units}}{\text{Total Received Units}} \times 100\right)\right)$$
- **Fulfilment Score (25%)**:
  $$\text{Fulfilment Rate} = \min\left(100, \left(\frac{\text{Total Received Units}}{\text{Total Ordered Units}} \times 100\right)\right)$$

### Performance Tiers
- **Tier 1 - Elite**: Score $\ge 90.0$ (Emerald Badge)
- **Tier 2 - Reliable**: Score $80.0 - 89.9$ (Blue Badge)
- **Tier 3 - Watchlist**: Score $70.0 - 79.9$ (Amber Badge)
- **Tier 4 - High Risk**: Score $< 70.0$ (Rose Badge)

---

## 🖥️ Web Application Features

### 1. Executive Dashboard Overview (`/`)
- **6 KPI Cards**: Total Spend (INR Cr/L), Total POs, Active Suppliers, Avg Delivery Lead (days), On-Time Delivery Rate (%), Overall Defect Rate (%).
- **5 Recharts Visualizations**:
  - Monthly Procurement Expenditure (AreaChart with gold gradient).
  - Supplier-wise Purchase Value (Horizontal BarChart).
  - Purchase Orders by Status (Donut Chart).
  - Category-wise Procurement Spend (BarChart).
  - Delivery Performance Trends (LineChart with on-time rate & turnaround days).

### 2. Supplier Management & Deep-Dive Profiles (`/suppliers`, `/suppliers/:id`)
- Search by name, code, contact, or city; filter by 7 jewellery categories and status.
- Add New Supplier & Edit Supplier dialogs with complete input validation.
- **Individual Supplier Profile**:
  - Live SVG radial reliability gauge with score breakdown.
  - Spend history area chart.
  - Purchase orders ledger with delay indicators and defect item tallies.

### 3. Procurement & Purchase Orders (`/orders`)
- Full lifecycle order management (Pending, In Transit, Delivered, Partially Received, Cancelled).
- Filters for Delayed Orders and Incomplete Deliveries.
- **Create PO Modal**: Dynamic line item builder supporting multi-product selection, quantities, unit prices, auto-calculated 3% GST and shipping costs.
- **Goods Receiving & QC Inspection Modal**: Record received units, flag defective units, calculate accepted units, and update delivery dates.

### 4. Supplier Performance Analytics (`/supplier-performance`)
- Interactive Scatter Chart mapping Delivery Rate (X-axis) vs Quality Score (Y-axis) sized by spend.
- Performance Tier Summary Cards.
- Top 10 and Bottom 10 supplier league tables.

### 5. Cost & Procurement Analytics (`/procurement-analytics`)
- Month-over-Month (MoM) Spend Growth & Velocity chart (using SQL `LAG`).
- Cumulative running spend trend chart.
- Supplier Pareto Chart (80/20 spend concentration line).
- Category cost variations and metal purity benchmark comparison.

### 6. Quality & Delivery Analytics (`/quality-analysis`)
- Defect Rate by Vendor Bar Chart against the 2.5% quality limit.
- Scrap financial loss write-offs by product category.
- Delivery lead time SLA deviation table.

### 7. Dynamic Reports & CSV Export (`/reports`)
- Multi-criteria slicer: Date range, Supplier, Product Category, Order Status.
- Real-time preview data table with dynamic KPI totals.
- 1-Click Excel CSV Export streaming formatted data directly from MySQL.

### 8. MS Excel Integration & CSV Data Center (`/csv-center`)
- Visual 6-step Excel-to-MySQL workflow.
- CSV File Upload with dry-run schema validation and error detection before committing to MySQL.
- Downloadable Excel CSV templates for Suppliers, Products, and Purchase Orders.

### 9. Settings & Diagnostics (`/settings`)
- Live MySQL connection status (Host, Port, Database, active tables).
- User management table displaying role assignments and departments.
- Mathematical scoring specifications.

---

## 🔐 Authentication & Roles

The platform provides pre-seeded accounts with JWT session management:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@jewelprocure.com` | `admin123` | Full Access: Create/Edit Suppliers, Create POs, Receive Goods & QC, Commit CSVs |
| **Analyst** | `analyst@jewelprocure.com` | `analyst123` | Read-Only & BI: View Dashboards, Slicers, Export Reports, Preview CSVs |

> On the login page, single-click **Quick-Fill Role Buttons** are provided for instant evaluation.

---

## 📊 Power BI Integration

The `powerbi/` directory includes resources for building executive Power BI reports:
- `powerbi/PowerBI_Architecture_Guide.md`: MySQL DirectQuery/Import connection guide and Star Schema dimensional model.
- `powerbi/DAX_Measures_Reference.dax`: 20+ DAX measures (Total Spend, OTD %, Defect Rate %, Supplier Reliability Score, MoM Spend Growth, etc.).
- `powerbi/PowerBI_Dashboard_Build_Manual.md`: Step-by-step instructions for 4 report pages:
  1. *Procurement Overview*
  2. *Supplier Performance*
  3. *Cost Analysis*
  4. *Quality & Delivery Analysis*

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18+ or v22+)
- MySQL Server 8.0+

### 1. Database Configuration
The backend comes pre-configured for local MySQL on port `3307` or `3306`. Check `backend/.env`:
```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=jewellery_procurement_db
JWT_SECRET=jewel_procure_super_secret_jwt_key_2026_enterprise_analytics_token
```

To initialize tables, create views, and seed the synthetic dataset:
```bash
cd backend
npm run db:setup
```

### 2. Start the Backend API
```bash
cd backend
npm start
# Server listens on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 3. Start the Frontend Dashboard
```bash
cd frontend
npm run dev
# Dashboard launches on http://localhost:5173
```

Log in with:
- **Admin**: `admin@jewelprocure.com` / `admin123`
- **Analyst**: `analyst@jewelprocure.com` / `analyst123`

---

## 📂 Repository Structure

```
├── backend/
│   ├── src/
│   │   ├── config/db.js               # MySQL2 promise pool connection
│   │   ├── controllers/               # Express controllers for Auth, Suppliers, Orders, etc.
│   │   ├── middleware/                # JWT verification, Role authorization, Error handler
│   │   ├── routes/                    # REST API routes
│   │   ├── scripts/
│   │   │   ├── generateData.js        # Synthetic data generator (NO Python)
│   │   │   ├── initDb.js              # Database & Views creation script
│   │   │   ├── seedDb.js              # Database batch seeding script
│   │   │   └── exportCsvs.js          # CSV export for Excel & Power BI
│   │   └── server.js                  # Express server entry point
│   ├── .env                           # Environment configuration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/                # Reusable StatCards, Badges, Tables, Gauges, Modals
│   │   ├── context/                   # AuthContext, FilterContext
│   │   ├── pages/                     # Dashboard, Suppliers, Orders, Cost, Quality, Reports, etc.
│   │   ├── services/api.js            # Axios client with JWT interceptors
│   │   ├── App.jsx                    # React Router with ProtectedRoute
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── database/
│   ├── schema.sql                     # Complete DDL tables, constraints, foreign keys
│   ├── views.sql                      # 5 MySQL analytical views
│   └── analytics_queries.sql          # Advanced SQL queries showcase (CTEs, Window Functions)
├── data_csv/                          # Excel-compatible CSV datasets
│   ├── suppliers.csv                  # 25 suppliers
│   ├── products.csv                   # 125 jewellery products
│   ├── purchase_orders.csv            # 1,250 purchase orders
│   ├── procurement_details.csv        # 3,101 line items
│   ├── supplier_payments.csv          # 1,179 payments
│   └── templates/                     # Blank Excel CSV templates
├── powerbi/
│   ├── PowerBI_Architecture_Guide.md  # MySQL connection & Star Schema model
│   ├── DAX_Measures_Reference.dax     # 20+ production-grade DAX measures
│   └── PowerBI_Dashboard_Build_Manual.md # Guide for 4 report pages
└── README.md
```

---

## 📄 License
MIT License. Built for jewellery retail & e-commerce enterprise supply chain intelligence.
