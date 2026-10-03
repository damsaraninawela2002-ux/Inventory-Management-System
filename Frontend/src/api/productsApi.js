import axiosInstance from './axiosInstance';

export const productsApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    
    const response = await axiosInstance.get(`/products?${query.toString()}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosInstance.get(`/products/${id}`);
    return response.data;
  },

  create: async (productData) => {
    const response = await axiosInstance.post('/products', productData);
    return response.data;
  },

  update: async (id, productData) => {
    const response = await axiosInstance.put(`/products/${id}`, productData);
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosInstance.delete(`/products/${id}`);
    return response.data;
  },

  updateStock: async (id, stockData) => {
    // stockData: { action: 'add'|'remove'|'set', amount: number } or { quantityChange: number }
    const response = await axiosInstance.patch(`/products/${id}/stock`, stockData);
    return response.data;
  },

  getLowStock: async () => {
    const response = await axiosInstance.get('/products/low-stock');
    return response.data;
  },

  getCategories: async () => {
    const response = await axiosInstance.get('/products/categories');
    return response.data;
  },

  getStats: async () => {
    const response = await axiosInstance.get('/products/stats');
    return response.data;
  }
};
