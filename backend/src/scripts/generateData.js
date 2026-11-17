import bcrypt from 'bcryptjs';

// Seeded pseudorandom number generator for reproducible and consistent data
let seed = 123456789;
function pseudoRandom() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

function randInt(min, max) {
  return Math.floor(pseudoRandom() * (max - min + 1)) + min;
}

function randChoice(arr) {
  return arr[Math.floor(pseudoRandom() * arr.length)];
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export async function generateSyntheticData() {
  console.log('[DataGen] Generating synthetic dataset for Jewellery Procurement Analytics...');

  // 1. USERS
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const analystHash = await bcrypt.hash('analyst123', salt);

  const users = [
    {
      username: 'admin',
      email: 'admin@jewelprocure.com',
      password_hash: adminHash,
      full_name: 'Vikram Malhotra',
      role: 'admin',
      department: 'Executive Procurement Management',
      is_active: 1
    },
    {
      username: 'analyst',
      email: 'analyst@jewelprocure.com',
      password_hash: analystHash,
      full_name: 'Ananya Sharma',
      role: 'analyst',
      department: 'Supply Chain Analytics & QA',
      is_active: 1
    }
  ];

  // 2. SUPPLIERS (25 realistic jewellery suppliers with distinct performance characteristics)
  const supplierTemplates = [
    { name: 'Surat Diamond Cutters Ltd', city: 'Surat', category: 'Cut & Polished Diamonds', terms: 'Net 30', lead: 10, otdRate: 0.96, defectRate: 0.008, fulRate: 0.99 },
    { name: 'Royal Gems & Precious Stones Corp', city: 'Jaipur', category: 'Natural Gemstones & Pearls', terms: 'Net 45', lead: 14, otdRate: 0.94, defectRate: 0.012, fulRate: 0.98 },
    { name: 'Aura Fine Platinum & Mounts', city: 'Mumbai', category: 'Platinum 950 Findings & Mounts', terms: 'Net 30', lead: 12, otdRate: 0.95, defectRate: 0.009, fulRate: 0.99 },
    { name: 'Kalyan Bullion & Gold Casting', city: 'Thrissur', category: 'Gold Bullion & Fine Casting', terms: 'Net 15', lead: 8, otdRate: 0.93, defectRate: 0.014, fulRate: 0.98 },
    { name: 'Tanisha Diamond Crafts Ltd', city: 'Mumbai', category: 'Cut & Polished Diamonds', terms: 'Net 30', lead: 11, otdRate: 0.92, defectRate: 0.015, fulRate: 0.97 },
    { name: 'Jaipur Emerald & Ruby Guild', city: 'Jaipur', category: 'Natural Gemstones & Pearls', terms: 'Net 45', lead: 15, otdRate: 0.89, defectRate: 0.021, fulRate: 0.95 },
    { name: 'Zaveri Heritage Gold Works', city: 'Mumbai', category: 'Gold Bullion & Fine Casting', terms: 'Net 30', lead: 10, otdRate: 0.91, defectRate: 0.018, fulRate: 0.96 },
    { name: 'Coimbatore Gold Chains & Casting', city: 'Coimbatore', category: 'Gold Bullion & Fine Casting', terms: 'Net 30', lead: 9, otdRate: 0.90, defectRate: 0.022, fulRate: 0.96 },
    { name: 'Hyderabad South Sea Pearl Exports', city: 'Hyderabad', category: 'Natural Gemstones & Pearls', terms: 'Net 60', lead: 18, otdRate: 0.86, defectRate: 0.025, fulRate: 0.94 },
    { name: 'Kolkata Filigree & Silver Ornaments', city: 'Kolkata', category: 'Sterling Silver Ornaments', terms: 'Net 30', lead: 12, otdRate: 0.87, defectRate: 0.028, fulRate: 0.93 },
    { name: 'Navratna Gemstone Traders', city: 'Jaipur', category: 'Natural Gemstones & Pearls', terms: 'Net 45', lead: 14, otdRate: 0.88, defectRate: 0.024, fulRate: 0.95 },
    { name: 'Apex Lab-Grown Diamonds Co', city: 'Surat', category: 'Cut & Polished Diamonds', terms: 'Net 30', lead: 10, otdRate: 0.93, defectRate: 0.011, fulRate: 0.98 },
    { name: 'Rajkot Antique Gold Artistry', city: 'Rajkot', category: 'Gold Bullion & Fine Casting', terms: 'Net 30', lead: 13, otdRate: 0.85, defectRate: 0.031, fulRate: 0.92 },
    { name: 'Delhi Bullion & Refining House', city: 'New Delhi', category: 'Gold Bullion & Fine Casting', terms: 'Net 15', lead: 7, otdRate: 0.92, defectRate: 0.016, fulRate: 0.97 },
    { name: 'Platinum Luxe International', city: 'Bangalore', category: 'Platinum 950 Findings & Mounts', terms: 'Net 30', lead: 14, otdRate: 0.91, defectRate: 0.015, fulRate: 0.97 },
    { name: 'Chennai Temple Jewellery Guild', city: 'Chennai', category: 'Gold Bullion & Fine Casting', terms: 'Net 45', lead: 16, otdRate: 0.84, defectRate: 0.035, fulRate: 0.91 },
    { name: 'Manubhai Gemstone Lapidary', city: 'Ahmedabad', category: 'Natural Gemstones & Pearls', terms: 'Net 30', lead: 12, otdRate: 0.83, defectRate: 0.038, fulRate: 0.90 },
    { name: 'Shree Krishna Silver Refiners', city: 'Agra', category: 'Sterling Silver Ornaments', terms: 'Net 30', lead: 11, otdRate: 0.82, defectRate: 0.040, fulRate: 0.89 },
    { name: 'Swarnalata Diamond Jewellery Works', city: 'Surat', category: 'Cut & Polished Diamonds', terms: 'Net 45', lead: 12, otdRate: 0.86, defectRate: 0.029, fulRate: 0.93 },
    { name: 'Imperial Findings & Alloys', city: 'Mumbai', category: 'Platinum 950 Findings & Mounts', terms: 'Net 30', lead: 10, otdRate: 0.85, defectRate: 0.032, fulRate: 0.92 },
    { name: 'Bhavnagar Solitaire Cutters', city: 'Bhavnagar', category: 'Cut & Polished Diamonds', terms: 'Net 30', lead: 13, otdRate: 0.80, defectRate: 0.046, fulRate: 0.88 },
    { name: 'Bengal Silver & Alloy Artisans', city: 'Kolkata', category: 'Sterling Silver Ornaments', terms: 'Net 45', lead: 17, otdRate: 0.74, defectRate: 0.058, fulRate: 0.84 },
    { name: 'Deccan Polki & Heritage Jewels', city: 'Hyderabad', category: 'Natural Gemstones & Pearls', terms: 'Net 60', lead: 20, otdRate: 0.73, defectRate: 0.062, fulRate: 0.83 },
    { name: 'Vintage Craft Gem Traders', city: 'Varanasi', category: 'Natural Gemstones & Pearls', terms: 'Net 45', lead: 19, otdRate: 0.71, defectRate: 0.068, fulRate: 0.81 },
    { name: 'Western Bullion & Casting Co', city: 'Pune', category: 'Gold Bullion & Fine Casting', terms: 'Net 30', lead: 15, otdRate: 0.69, defectRate: 0.075, fulRate: 0.79 }
  ];

  const suppliers = supplierTemplates.map((t, idx) => {
    const id = idx + 1;
    const code = `SUP-${String(id).padStart(3, '0')}`;
    const baseRating = (t.otdRate * 2.5 + (1 - t.defectRate) * 2.5).toFixed(2);
    return {
      supplier_id: id,
      supplier_code: code,
      supplier_name: t.name,
      category: t.category,
      contact_person: `Manager ${t.name.split(' ')[0]}`,
      email: `procurement@${t.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone: `+91 ${randInt(98000, 99999)} ${randInt(10000, 99999)}`,
      city: t.city,
      country: 'India',
      tax_id: `27AAAC${randInt(1000, 9999)}A1Z${randInt(1, 9)}`,
      payment_terms: t.terms,
      lead_time_days: t.lead,
      status: id === 24 ? 'Under Review' : id === 25 ? 'Suspended' : 'Active',
      rating: parseFloat(baseRating),
      _otdRate: t.otdRate,
      _defectRate: t.defectRate,
      _fulRate: t.fulRate
    };
  });

  // 3. PRODUCTS (125 realistic jewellery products across 6 core categories)
  const categories = [
    { cat: 'Rings', prefix: 'RNG', metals: ['Gold 22K', 'Gold 18K', 'Platinum 950', 'Sterling Silver 925'] },
    { cat: 'Necklaces', prefix: 'NCK', metals: ['Gold 22K', 'Gold 18K', 'Platinum 950', 'Sterling Silver 925'] },
    { cat: 'Bracelets', prefix: 'BRC', metals: ['Gold 22K', 'Gold 18K', 'Platinum 950', 'Sterling Silver 925'] },
    { cat: 'Earrings', prefix: 'EAR', metals: ['Gold 22K', 'Gold 18K', 'Platinum 950', 'Sterling Silver 925'] },
    { cat: 'Bangles', prefix: 'BNG', metals: ['Gold 22K', 'Gold 18K', 'Gold 24K', 'Sterling Silver 925'] },
    { cat: 'Pendants', prefix: 'PND', metals: ['Gold 18K', 'Platinum 950', 'Sterling Silver 925'] }
  ];

  const gemstones = [
    'None', 'Natural Diamond VVS', 'Diamond SI', 'Emerald', 'Ruby', 
    'Sapphire', 'Freshwater Pearl', 'South Sea Pearl', 'Tanzanite'
  ];

  const productTemplates = [
    // Rings
    { name: 'Solitaire Classic Diamond Ring 1.0ct', cat: 'Rings', metal: 'Gold 18K', purity: '18K (750)', gem: 'Natural Diamond VVS', cost: 185000, lead: 12 },
    { name: 'Eternity Platinum Wedding Band', cat: 'Rings', metal: 'Platinum 950', purity: 'Pt950', gem: 'Natural Diamond VVS', cost: 95000, lead: 14 },
    { name: 'Traditional 22K Gold Filigree Ring', cat: 'Rings', metal: 'Gold 22K', purity: '22K (916)', gem: 'None', cost: 42000, lead: 8 },
    { name: 'Royal Emerald Halo Cocktail Ring', cat: 'Rings', metal: 'Gold 18K', purity: '18K (750)', gem: 'Emerald', cost: 135000, lead: 14 },
    { name: 'Burma Ruby Pavé Cluster Ring', cat: 'Rings', metal: 'Gold 18K', purity: '18K (750)', gem: 'Ruby', cost: 120000, lead: 10 },
    { name: 'Blue Sapphire Modern Platinum Ring', cat: 'Rings', metal: 'Platinum 950', purity: 'Pt950', gem: 'Sapphire', cost: 155000, lead: 15 },
    { name: 'Vintage Sterling Silver Solitaire Ring', cat: 'Rings', metal: 'Sterling Silver 925', purity: '925 Silver', gem: 'Diamond SI', cost: 6500, lead: 6 },
    { name: 'Bridal Dual-Tone Floral Diamond Ring', cat: 'Rings', metal: 'Gold 18K', purity: '18K (750)', gem: 'Natural Diamond VVS', cost: 110000, lead: 11 },
    { name: 'Classic 22K Men Plain Signet Ring', cat: 'Rings', metal: 'Gold 22K', purity: '22K (916)', gem: 'None', cost: 68000, lead: 7 },
    { name: 'Tanzanite Pear-Cut Cocktail Ring', cat: 'Rings', metal: 'Platinum 950', purity: 'Pt950', gem: 'Tanzanite', cost: 140000, lead: 16 },

    // Necklaces
    { name: 'Maharani Heritage Polki Kundan Haar', cat: 'Necklaces', metal: 'Gold 22K', purity: '22K (916)', gem: 'Natural Diamond VVS', cost: 420000, lead: 20 },
    { name: 'Diamond Tennis Rivière Necklace 8ct', cat: 'Necklaces', metal: 'Gold 18K', purity: '18K (750)', gem: 'Natural Diamond VVS', cost: 480000, lead: 18 },
    { name: '22K Temple Gold Nakshi Choker', cat: 'Necklaces', metal: 'Gold 22K', purity: '22K (916)', gem: 'Ruby', cost: 260000, lead: 15 },
    { name: 'South Sea Cultured Pearl Strand', cat: 'Necklaces', metal: 'Gold 18K', purity: '18K (750)', gem: 'South Sea Pearl', cost: 195000, lead: 14 },
    { name: 'Minimalist Platinum Floating Diamond Chain', cat: 'Necklaces', metal: 'Platinum 950', purity: 'Pt950', gem: 'Natural Diamond VVS', cost: 82000, lead: 10 },
    { name: 'Sterling Silver Layered Bohemian Collar', cat: 'Necklaces', metal: 'Sterling Silver 925', purity: '925 Silver', gem: 'None', cost: 12500, lead: 7 },
    { name: 'Emerald Cascading Bridal Collar Necklace', cat: 'Necklaces', metal: 'Gold 18K', purity: '18K (750)', gem: 'Emerald', cost: 360000, lead: 18 },
    { name: '22K Sleek Rope Gold Chain 24-inch', cat: 'Necklaces', metal: 'Gold 22K', purity: '22K (916)', gem: 'None', cost: 145000, lead: 8 },

    // Bangles
    { name: '22K Traditional Broad Bangles (Pair)', cat: 'Bangles', metal: 'Gold 22K', purity: '22K (916)', gem: 'None', cost: 285000, lead: 12 },
    { name: 'Diamond Eternity Line Bangles (Pair)', cat: 'Bangles', metal: 'Gold 18K', purity: '18K (750)', gem: 'Natural Diamond VVS', cost: 340000, lead: 16 },
    { name: 'Antique 22K Ruby Encrusted Kada', cat: 'Bangles', metal: 'Gold 22K', purity: '22K (916)', gem: 'Ruby', cost: 215000, lead: 14 },
    { name: 'Platinum Daily Sleek Oval Bangle', cat: 'Bangles', metal: 'Platinum 950', purity: 'Pt950', gem: 'Diamond SI', cost: 110000, lead: 12 },
    { name: 'Sterling Silver Filigree Temple Bangles', cat: 'Bangles', metal: 'Sterling Silver 925', purity: '925 Silver', gem: 'None', cost: 9500, lead: 6 },
    { name: '24K Investment Pure Gold Churi (Set of 4)', cat: 'Bangles', metal: 'Gold 24K', purity: '24K (999)', gem: 'None', cost: 410000, lead: 10 },

    // Bracelets
    { name: 'Diamond Tennis Bracelet 4.5ct VVS', cat: 'Bracelets', metal: 'Gold 18K', purity: '18K (750)', gem: 'Natural Diamond VVS', cost: 240000, lead: 14 },
    { name: 'Men 22K Solid Gold Figaro Bracelet', cat: 'Bracelets', metal: 'Gold 22K', purity: '22K (916)', gem: 'None', cost: 165000, lead: 9 },
    { name: 'Platinum Interlocking Link Chain Bracelet', cat: 'Bracelets', metal: 'Platinum 950', purity: 'Pt950', gem: 'None', cost: 88000, lead: 11 },
    { name: 'Emerald & Diamond Bezel Link Bracelet', cat: 'Bracelets', metal: 'Gold 18K', purity: '18K (750)', gem: 'Emerald', cost: 190000, lead: 15 },
    { name: 'Sterling Silver Adjustable Bolo Bracelet', cat: 'Bracelets', metal: 'Sterling Silver 925', purity: '925 Silver', gem: 'Freshwater Pearl', cost: 7200, lead: 5 },

    // Earrings
    { name: 'Diamond Stud Earrings 1.5ct Solitaire', cat: 'Earrings', metal: 'Gold 18K', purity: '18K (750)', gem: 'Natural Diamond VVS', cost: 175000, lead: 10 },
    { name: '22K Royal Peacock Jhumkas with Pearls', cat: 'Earrings', metal: 'Gold 22K', purity: '22K (916)', gem: 'Freshwater Pearl', cost: 125000, lead: 12 },
    { name: 'Platinum Diamond Curved Huggie Earrings', cat: 'Earrings', metal: 'Platinum 950', purity: 'Pt950', gem: 'Diamond SI', cost: 58000, lead: 8 },
    { name: 'Burma Ruby Teardrop Chandelier Earrings', cat: 'Earrings', metal: 'Gold 18K', purity: '18K (750)', gem: 'Ruby', cost: 145000, lead: 14 },
    { name: 'Sterling Silver Chandbali Earrings', cat: 'Earrings', metal: 'Sterling Silver 925', purity: '925 Silver', gem: 'None', cost: 8500, lead: 6 },
    { name: 'Blue Sapphire Diamond Cluster Tops', cat: 'Earrings', metal: 'Gold 18K', purity: '18K (750)', gem: 'Sapphire', cost: 98000, lead: 11 },

    // Pendants
    { name: 'Solitaire Floating Diamond Pendant', cat: 'Pendants', metal: 'Gold 18K', purity: '18K (750)', gem: 'Natural Diamond VVS', cost: 85000, lead: 9 },
    { name: 'Platinum Celestial Star Diamond Pendant', cat: 'Pendants', metal: 'Platinum 950', purity: 'Pt950', gem: 'Natural Diamond VVS', cost: 62000, lead: 10 },
    { name: 'Zodiac 22K Gold Embossed Coin Pendant', cat: 'Pendants', metal: 'Gold 22K', purity: '22K (916)', gem: 'None', cost: 38000, lead: 7 },
    { name: 'Colombian Emerald Drop Teardrop Pendant', cat: 'Pendants', metal: 'Gold 18K', purity: '18K (750)', gem: 'Emerald', cost: 76000, lead: 11 },
    { name: 'Sterling Silver Tree of Life Locket', cat: 'Pendants', metal: 'Sterling Silver 925', purity: '925 Silver', gem: 'None', cost: 4800, lead: 5 },
    { name: 'Tanzanite Cushion Cut Modern Pendant', cat: 'Pendants', metal: 'Platinum 950', purity: 'Pt950', gem: 'Tanzanite', cost: 92000, lead: 12 }
  ];

  // Generate 125 products by expanding with variations
  const products = [];
  let prodId = 1;

  for (let i = 0; i < productTemplates.length; i++) {
    const t = productTemplates[i];
    const sku = `JWL-${t.cat.slice(0, 3).toUpperCase()}-${String(prodId).padStart(4, '0')}`;
    products.push({
      product_id: prodId,
      sku,
      product_name: t.name,
      category: t.cat,
      subcategory: `${t.metal} Luxury`,
      metal_type: t.metal,
      purity: t.purity,
      gemstone: t.gem,
      unit_of_measure: 'Pieces',
      base_unit_cost: t.cost,
      standard_lead_days: t.lead,
      min_order_qty: t.cat === 'Necklaces' || t.cat === 'Bangles' ? 3 : 5,
      stock_level: randInt(15, 80),
      reorder_point: randInt(10, 25)
    });
    prodId++;
  }

  // Generate additional products to reach 125 products
  const subcatModifiers = ['Classic', 'Imperial', 'Aura', 'Celestial', 'Opulent', 'Heritage', 'Artisan', 'Prestige'];
  while (products.length < 125) {
    const catObj = randChoice(categories);
    const metal = randChoice(catObj.metals);
    const gem = randChoice(gemstones);
    const modifier = randChoice(subcatModifiers);
    const purity = metal.includes('22K') ? '22K (916)' : metal.includes('18K') ? '18K (750)' : metal.includes('24K') ? '24K (999)' : metal.includes('Platinum') ? 'Pt950' : '925 Silver';
    
    let baseCost = randInt(15000, 160000);
    if (metal.includes('Silver')) baseCost = randInt(3500, 18000);
    if (gem.includes('Diamond') || gem.includes('Emerald')) baseCost += randInt(40000, 120000);

    const name = `${modifier} ${metal} ${gem !== 'None' ? gem + ' ' : ''}${catObj.cat.slice(0, -1)} Model-${prodId}`;
    const sku = `JWL-${catObj.prefix}-${String(prodId).padStart(4, '0')}`;

    products.push({
      product_id: prodId,
      sku,
      product_name: name,
      category: catObj.cat,
      subcategory: `${modifier} Collection`,
      metal_type: metal,
      purity,
      gemstone: gem,
      unit_of_measure: 'Pieces',
      base_unit_cost: baseCost,
      standard_lead_days: randInt(7, 16),
      min_order_qty: randInt(3, 10),
      stock_level: randInt(10, 70),
      reorder_point: randInt(10, 20)
    });
    prodId++;
  }

  // 4. PURCHASE ORDERS (1,250 purchase orders spanning 14 months)
  // Date range: 2025-10-01 to 2026-11-15
  const startDate = new Date('2025-10-01T00:00:00Z');
  const endDate = new Date('2026-11-15T00:00:00Z');
  const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

  const purchaseOrders = [];
  const procurementDetails = [];
  const supplierPayments = [];

  let detailId = 1;
  let paymentId = 1;

  for (let poIdx = 1; poIdx <= 1250; poIdx++) {
    const poNumber = `PO-${poIdx <= 300 ? '2025' : '2026'}-${String(poIdx).padStart(5, '0')}`;
    
    // Select supplier with slight weighting towards reliable suppliers
    const supplier = randChoice(suppliers);
    
    // Order date distributed across the 14 months
    const dayOffset = Math.floor((poIdx / 1250) * totalDays) + randInt(-3, 3);
    const clampedOffset = Math.max(0, Math.min(totalDays, dayOffset));
    const orderDateObj = new Date(startDate.getTime() + clampedOffset * 24 * 60 * 60 * 1000);
    const orderDate = orderDateObj.toISOString().split('T')[0];

    const contractualLead = supplier.lead_time_days;
    const expectedDeliveryDate = addDays(orderDate, contractualLead);

    // Determine status based on order recency
    const daysSinceOrder = Math.floor((endDate - orderDateObj) / (1000 * 60 * 60 * 24));
    
    let status = 'Delivered';
    let actualDeliveryDate = null;
    let paymentStatus = 'Paid';

    if (daysSinceOrder < 8) {
      status = randChoice(['Pending', 'In Transit']);
      paymentStatus = 'Unpaid';
    } else if (daysSinceOrder < 20) {
      status = randChoice(['In Transit', 'Partially Received', 'Delivered']);
      paymentStatus = status === 'Delivered' ? 'Paid' : 'Unpaid';
    } else {
      // Historical orders
      const roll = pseudoRandom();
      if (roll < 0.02) {
        status = 'Cancelled';
        paymentStatus = 'Unpaid';
      } else if (roll < 0.06) {
        status = 'Partially Received';
        paymentStatus = 'Partially Paid';
      } else {
        status = 'Delivered';
        paymentStatus = pseudoRandom() < 0.95 ? 'Paid' : 'Partially Paid';
      }
    }

    // Realistic delivery timing for Delivered or Partially Received
    if (status === 'Delivered' || status === 'Partially Received') {
      const isLate = pseudoRandom() > supplier._otdRate;
      if (isLate) {
        // Delayed by 2 to 14 days
        const delayDays = randInt(2, 14);
        actualDeliveryDate = addDays(expectedDeliveryDate, delayDays);
      } else {
        // On time or 1-2 days early
        const earlyDays = randInt(-2, 0);
        actualDeliveryDate = addDays(expectedDeliveryDate, earlyDays);
      }
    }

    // Select 1 to 4 line items
    const itemCount = randInt(1, 4);
    const selectedProducts = [];
    while (selectedProducts.length < itemCount) {
      const p = randChoice(products);
      if (!selectedProducts.includes(p)) selectedProducts.push(p);
    }

    let poTotal = 0;
    const poDetailsForThisOrder = [];

    for (const prod of selectedProducts) {
      const orderedQty = randInt(prod.min_order_qty, prod.min_order_qty * 6);
      let receivedQty = 0;
      let defectiveQty = 0;
      let acceptedQty = 0;

      if (status === 'Delivered') {
        receivedQty = orderedQty;
        // Quality defect roll
        const hasDefects = pseudoRandom() < (supplier._defectRate * 3.5);
        if (hasDefects) {
          defectiveQty = Math.max(1, Math.round(receivedQty * (supplier._defectRate * randInt(15, 35) / 10)));
          if (defectiveQty > receivedQty) defectiveQty = receivedQty;
        }
        acceptedQty = receivedQty - defectiveQty;
      } else if (status === 'Partially Received') {
        receivedQty = Math.round(orderedQty * (supplier._fulRate * 0.75));
        defectiveQty = Math.round(receivedQty * supplier._defectRate);
        acceptedQty = receivedQty - defectiveQty;
      }

      // Small price variance based on supplier
      const priceVariationFactor = 0.95 + (pseudoRandom() * 0.10); // +-5%
      const unitPrice = Math.round(prod.base_unit_cost * priceVariationFactor);
      const lineTotal = orderedQty * unitPrice;

      poTotal += lineTotal;

      const detail = {
        detail_id: detailId++,
        po_id: poIdx,
        product_id: prod.product_id,
        ordered_qty: orderedQty,
        received_qty: receivedQty,
        defective_qty: defectiveQty,
        accepted_qty: acceptedQty,
        unit_price: unitPrice,
        line_total: lineTotal,
        remarks: defectiveQty > 0 ? `${defectiveQty} units rejected due to surface finishing or setting flaws` : 'Passed Quality Control'
      };

      poDetailsForThisOrder.push(detail);
      procurementDetails.push(detail);
    }

    const taxAmount = Math.round(poTotal * 0.03); // 3% GST
    const shippingCost = randChoice([0, 1500, 2500, 5000]);
    const finalAmount = poTotal + taxAmount + shippingCost;

    purchaseOrders.push({
      po_id: poIdx,
      po_number: poNumber,
      supplier_id: supplier.supplier_id,
      order_date: orderDate,
      expected_delivery_date: expectedDeliveryDate,
      actual_delivery_date: actualDeliveryDate,
      status,
      total_amount: finalAmount,
      tax_amount: taxAmount,
      shipping_cost: shippingCost,
      payment_status: paymentStatus,
      notes: status === 'Cancelled' ? 'Cancelled due to material specification change' : `Procurement order for ${selectedProducts.map(p => p.category).join(', ')}`,
      created_by: randChoice(['Vikram Malhotra', 'Ananya Sharma', 'Procurement Desk'])
    });

    // Generate Supplier Payment if paid or partially paid
    if (paymentStatus === 'Paid' || paymentStatus === 'Partially Paid') {
      const paymentDate = actualDeliveryDate ? addDays(actualDeliveryDate, randInt(3, 20)) : addDays(orderDate, 15);
      const amountPaid = paymentStatus === 'Paid' ? finalAmount : Math.round(finalAmount * 0.60);
      const paymentNumber = `PAY-${orderDate.slice(0, 4)}-${String(paymentId).padStart(5, '0')}`;
      
      supplierPayments.push({
        payment_id: paymentId++,
        payment_number: paymentNumber,
        po_id: poIdx,
        supplier_id: supplier.supplier_id,
        payment_date: paymentDate,
        amount_paid: amountPaid,
        payment_method: randChoice(['Bank Transfer (NEFT/RTGS)', 'Wire Transfer', 'Letter of Credit']),
        payment_status: 'Completed',
        transaction_reference: `UTR${randInt(1000000000, 9999999999)}`,
        notes: `Settlement for order ${poNumber}`
      });
    }
  }

  // Clean helper attributes from suppliers before export
  const cleanSuppliers = suppliers.map(({ _otdRate, _defectRate, _fulRate, ...s }) => s);

  console.log(`[DataGen Summary]`);
  console.log(` - Suppliers: ${cleanSuppliers.length}`);
  console.log(` - Products: ${products.length}`);
  console.log(` - Purchase Orders: ${purchaseOrders.length}`);
  console.log(` - Procurement Details (Line Items): ${procurementDetails.length}`);
  console.log(` - Supplier Payments: ${supplierPayments.length}`);

  return {
    users,
    suppliers: cleanSuppliers,
    products,
    purchaseOrders,
    procurementDetails,
    supplierPayments
  };
}
