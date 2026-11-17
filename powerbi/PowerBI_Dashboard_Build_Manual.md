# Power BI Dashboard Build Manual: 4 Interactive Report Pages

This manual provides detailed instructions for constructing the 4 analytical report pages in Power BI Desktop connecting directly to `jewellery_procurement_db`.

---

## Page 1: Procurement Overview (Executive Dashboard)

### Purpose
Executive summary dashboard providing C-level visibility into procurement spend, purchase order volume, delivery timeliness, and supplier base health.

### Visual Components & Setup

#### 1. Header & Slicers
- **Slicers (Top Ribbon)**:
  - `Dim_Date[Date]` (Relative date slicer or Date Range slider).
  - `Suppliers[category]` (Dropdown slicer).
  - `Purchase_Orders[status]` (Tile or Pill slicer).

#### 2. KPI Cards (Top Row)
Add 6 **Card (New)** or **Multi-Row Card** visuals:
1. **Total Procurement Spend**: Measure = `[Total Procurement Spend]`, Display units: Millions/Billions (INR).
2. **Total Purchase Orders**: Measure = `[Total Purchase Orders]`.
3. **Active Suppliers**: Measure = `[Active Suppliers Count]`.
4. **Average Delivery Time**: Measure = `[Average Delivery Lead Days]`, Suffix: " days".
5. **On-Time Delivery Rate**: Measure = `[On-Time Delivery Rate (%)]`, Suffix: "%".
6. **Overall Defect Rate**: Measure = `[Overall Defect Rate (%)]`, Suffix: "%".

#### 3. Monthly Procurement Expenditure (Area / Line Chart)
- **Visual Type**: Area Chart
- **X-Axis**: `Dim_Date[Year-Month]` (Sorted chronologically)
- **Y-Axis**: `[Total Procurement Spend]`
- **Formatting**: Gold stroke (`#EAB308`), linear gradient fill with 30% transparency.

#### 4. Supplier-wise Purchase Value (Bar Chart)
- **Visual Type**: Clustered Bar Chart (Horizontal)
- **Y-Axis**: `Suppliers[supplier_name]`
- **X-Axis**: `[Total Procurement Spend]`
- **Top N Filter**: Filter Top 10 by `[Total Procurement Spend]`.

#### 5. Purchase Orders by Status (Donut Chart)
- **Visual Type**: Donut Chart
- **Legend**: `Purchase_Orders[status]`
- **Values**: `[Total Purchase Orders]`
- **Data Colors**: Delivered (`#10B981`), In Transit (`#06B6D4`), Pending (`#F59E0B`), Partially Received (`#A855F7`), Cancelled (`#F43F5E`).

#### 6. Category-wise Procurement Spend (Column Chart)
- **Visual Type**: Clustered Column Chart
- **X-Axis**: `Products[category]` (Rings, Necklaces, Bangles, Bracelets, Earrings, Pendants)
- **Y-Axis**: `[Total Procurement Spend]`

---

## Page 2: Supplier Performance Analytics

### Purpose
In-depth evaluation of vendor reliability, rankings, on-time delivery rates, and quality scores.

### Visual Components & Setup

#### 1. Performance Tier KPI Cards (Top Row)
- 4 Cards displaying count of suppliers in:
  - **Tier 1 (Elite)**: Reliability Score ≥ 90.0
  - **Tier 2 (Reliable)**: Reliability Score 80.0 – 89.9
  - **Tier 3 (Watchlist)**: Reliability Score 70.0 – 79.9
  - **Tier 4 (High Risk)**: Reliability Score < 70.0

#### 2. Delivery vs Quality Quadrant (Scatter Chart)
- **Visual Type**: Scatter Chart
- **Values / Details**: `Suppliers[supplier_name]`
- **X-Axis**: `[On-Time Delivery Rate (%)]` (Scale: 60% – 100%)
- **Y-Axis**: `[Quality Compliance Score (%)]` (Scale: 90% – 100%)
- **Size / Bubble Size**: `[Total Procurement Spend]`
- **Legend / Color Category**: `[Supplier Performance Tier]`

#### 3. Top 10 & Bottom 10 Suppliers (Matrix / Table)
- **Visual Type**: Matrix Table
- **Rows**: `Suppliers[supplier_name]`, `Suppliers[supplier_code]`
- **Values**:
  - `[Supplier Reliability Score]` (Apply conditional formatting background color using `[Supplier Tier Rank Color]`)
  - `[On-Time Delivery Rate (%)]`
  - `[Quality Compliance Score (%)]`
  - `[Fulfilment Rate (%)]`
  - `[Total Procurement Spend]`
  - `[Delivered Orders Count]`

---

## Page 3: Cost & Procurement Analytics

### Purpose
Financial intelligence tracking price variance, Month-over-Month (MoM) expansion, and Pareto supplier spend distribution.

### Visual Components & Setup

#### 1. MoM Spend Growth & Volume (Line and Clustered Column Chart)
- **Visual Type**: Line and Clustered Column Chart
- **Shared X-Axis**: `Dim_Date[Year-Month]`
- **Column Values**: `[Total Procurement Spend]`
- **Line Values**: `[MoM Spend Growth (%)]`

#### 2. Supplier Spend Pareto Chart (Cumulative Share)
- **Visual Type**: Line and Clustered Column Chart
- **X-Axis**: `Suppliers[supplier_name]` (Sorted by `[Total Procurement Spend]` Descending)
- **Column Values**: `[Total Procurement Spend]`
- **Line Values**: Measure calculating cumulative spend share percentage against total spend.
- **Reference Line**: Constant line at 80% on secondary Y-axis to visualize the Pareto threshold.

#### 3. Product Category Cost & Metal Breakdown (Tree Map / Matrix)
- **Visual Type**: Treemap
- **Group**: `Products[category]`
- **Subgroup**: `Products[metal_type]`
- **Values**: `[Total Procurement Spend]`

---

## Page 4: Quality & Delivery Analytics

### Purpose
Quality assurance and logistics monitoring identifying defect rates, scrap write-offs, delayed purchase orders, and lead time SLA deviations.

### Visual Components & Setup

#### 1. Quality & Logistics KPI Cards
- Total Defective Units (`[Total Defective Units]`)
- Defect Financial Scrap Loss (`[Defect Financial Scrap Loss]`)
- Delayed Orders Count (`[Delayed Orders Count]`)
- Average Delay Days When Late (`[Average Delay Days (When Late)]`)

#### 2. Defect Rates by Supplier (Bar Chart)
- **Visual Type**: Clustered Bar Chart (Horizontal)
- **Y-Axis**: `Suppliers[supplier_name]`
- **X-Axis**: `[Overall Defect Rate (%)]`
- **Reference Line**: Constant line at 2.5% (Max Acceptable Quality Limit).

#### 3. Defect Scrap Loss by Product Category (Column Chart)
- **Visual Type**: Clustered Column Chart
- **X-Axis**: `Products[category]`
- **Y-Axis**: `[Defect Financial Scrap Loss]`

#### 4. Delivery Lead Time SLA Matrix (Table)
- **Visual Type**: Table
- **Columns**:
  - `Suppliers[supplier_code]`
  - `Suppliers[supplier_name]`
  - `Suppliers[lead_time_days]` (Contract SLA)
  - `[Average Delivery Lead Days]`
  - `[On-Time Orders Count]`
  - `[Delayed Orders Count]`
  - `[On-Time Delivery Rate (%)]`
  - `[Average Delay Days (When Late)]`
