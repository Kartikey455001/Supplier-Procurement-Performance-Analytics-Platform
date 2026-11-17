import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Request interceptor to attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aurum_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
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
    return `/api/reports/export-csv?${query}`;
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
  getTemplateUrl: (name) => `/api/import/template/${name}`,
};

// System Health API
export const systemApi = {
  getHealth: () => api.get('/health'),
};

export default api;
