import axios from 'axios';
import fallbackData from './fallbackData.json';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
});

// Global state to track live connection vs demo fallback
export const connectionState = {
  isUsingFallback: false,
  apiEndpoint: getBaseUrl(),
  listeners: new Set(),
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },
  setUsingFallback(val) {
    if (this.isUsingFallback !== val) {
      this.isUsingFallback = val;
      this.listeners.forEach(fn => fn(this.isUsingFallback));
    }
  }
};

// Response interceptor
api.interceptors.response.use(
  (response) => {
    connectionState.setUsingFallback(false);
    return response.data;
  },
  (error) => {
    // If backend is unavailable (404, 502, 503, Network Error), enable fallback mode
    const isNetworkOr404 =
      !error.response ||
      error.response.status === 404 ||
      error.response.status === 502 ||
      error.response.status === 503 ||
      error.code === 'ERR_NETWORK';

    if (isNetworkOr404) {
      connectionState.setUsingFallback(true);
      const url = error.config?.url || '';

      if (url.includes('/analytics/overview')) {
        return Promise.resolve({ success: true, data: fallbackData.overview, _fallback: true });
      }
      if (url.includes('/analytics/suppliers')) {
        return Promise.resolve({ success: true, data: fallbackData.supplierAnalytics, _fallback: true });
      }
      if (url.includes('/analytics/cost')) {
        return Promise.resolve({ success: true, data: fallbackData.costAnalytics, _fallback: true });
      }
      if (url.includes('/analytics/quality-delivery')) {
        return Promise.resolve({ success: true, data: fallbackData.qualityAnalytics, _fallback: true });
      }
      if (url.includes('/suppliers/') && !url.endsWith('/suppliers')) {
        const idMatch = url.match(/\/suppliers\/(\d+)/);
        const id = idMatch ? parseInt(idMatch[1], 10) : 1;
        const sup = fallbackData.suppliers.find(s => s.supplier_id === id) || fallbackData.suppliers[0];
        return Promise.resolve({
          success: true,
          data: {
            profile: sup,
            metrics: {
              total_spend: sup?.total_spend || 5000000,
              total_orders: sup?.total_orders || 45,
              delivered_orders: sup?.total_orders || 45,
              on_time_delivery_rate: sup?.on_time_delivery_rate || 92.5,
              defect_rate: sup?.defect_rate || 0.65,
              overall_score: sup?.overall_score || 94.2
            },
            recentOrders: fallbackData.orders.slice(0, 10),
            monthlySpend: fallbackData.overview.monthlySpend.slice(0, 8)
          },
          _fallback: true
        });
      }
      if (url.includes('/suppliers')) {
        return Promise.resolve({ success: true, count: fallbackData.suppliers.length, data: fallbackData.suppliers, _fallback: true });
      }
      if (url.includes('/products/categories')) {
        return Promise.resolve({ success: true, data: ['Gold', 'Diamond', 'Silver', 'Platinum', 'Gemstones'], _fallback: true });
      }
      if (url.includes('/products')) {
        return Promise.resolve({ success: true, total: fallbackData.products.length, count: fallbackData.products.length, data: fallbackData.products, _fallback: true });
      }
      if (url.includes('/orders/') && !url.endsWith('/orders')) {
        const idMatch = url.match(/\/orders\/(\d+)/);
        const id = idMatch ? parseInt(idMatch[1], 10) : 1;
        const order = fallbackData.orders.find(o => o.po_id === id) || fallbackData.orders[0];
        return Promise.resolve({
          success: true,
          data: {
            order,
            items: [
              {
                detail_id: 1,
                product_name: 'Solitaire Diamond Ring 18K',
                sku: 'JWL-DR-001',
                ordered_qty: 10,
                received_qty: 10,
                defective_qty: 0,
                accepted_qty: 10,
                unit_price: 45000,
                line_total: 450000,
                metal_type: '18K Yellow Gold',
                karatage: '18K'
              }
            ]
          },
          _fallback: true
        });
      }
      if (url.includes('/orders')) {
        return Promise.resolve({ success: true, count: fallbackData.orders.length, total: fallbackData.orders.length, data: fallbackData.orders, _fallback: true });
      }
      if (url.includes('/health')) {
        return Promise.resolve({ status: 'online', database: 'connected', service: 'Jewellery Procurement Analytics (Local Data Mode)', _fallback: true });
      }
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          success: true,
          user: {
            id: 1,
            user_id: 1,
            full_name: 'Procurement Admin',
            username: 'admin',
            email: 'admin@jewellery-analytics.com',
            role: 'admin',
            department: 'Procurement & Supply Chain'
          },
          _fallback: true
        });
      }
      if (url.includes('/auth/users')) {
        return Promise.resolve({
          success: true,
          data: [
            {
              user_id: 1,
              full_name: 'Procurement Admin',
              username: 'admin',
              email: 'admin@jewellery-analytics.com',
              role: 'admin',
              department: 'Procurement & Supply Chain',
              is_active: 1
            }
          ],
          _fallback: true
        });
      }
      if (url.includes('/reports')) {
        return Promise.resolve({
          success: true,
          total: fallbackData.suppliers.length,
          summary: {
            total_orders: fallbackData.overview.kpi.total_orders,
            suppliers_involved: fallbackData.suppliers.length,
            total_spend: fallbackData.overview.kpi.total_spend
          },
          data: fallbackData.suppliers,
          _fallback: true
        });
      }
    }

    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// Auth APIs
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  getUsers: () => api.get('/auth/users'),
};

// Analytics APIs
export const analyticsApi = {
  getOverview: (params) => api.get('/analytics/overview', { params }),
  getSuppliers: () => api.get('/analytics/suppliers'),
  getCost: () => api.get('/analytics/cost'),
  getQualityDelivery: () => api.get('/analytics/quality-delivery'),
};

// Suppliers APIs
export const supplierApi = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

// Products APIs
export const productApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  getCategories: () => api.get('/products/categories'),
};

// Orders APIs
export const orderApi = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  receiveGoods: (id, data) => api.put(`/orders/${id}/receive`, data),
  delete: (id) => api.delete(`/orders/${id}`),
};

// Reports APIs
export const reportApi = {
  generate: (params) => api.get('/reports', { params }),
  exportCsvUrl: (params) => {
    const query = new URLSearchParams(params).toString();
    const base = getBaseUrl();
    return `${base}/reports/export-csv?${query}`;
  },
};

// Import APIs
export const importApi = {
  previewCsv: (formData) => api.post('/import/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  commitCsv: (formData) => api.post('/import/commit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getTemplateUrl: (name) => {
    const base = getBaseUrl();
    return `${base}/import/template/${name}`;
  },
};

// System Health API
export const systemApi = {
  getHealth: () => api.get('/health'),
};

export default api;
