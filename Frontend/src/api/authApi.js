import axiosInstance from './axiosInstance';

export const authApi = {
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  }
};
