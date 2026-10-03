import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Log the resolved baseURL once in browser console
console.log('[API] Resolved baseURL:', baseURL);

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT Bearer token (skip for public endpoints like /health and /auth/login)
axiosInstance.interceptors.request.use(
  (config) => {
    const isPublicEndpoint = config.url?.includes('/health') || config.url?.includes('/auth/login');
    const token = localStorage.getItem('token');
    if (token && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized (auto-logout)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Never trigger auto-logout/redirect on public requests (/auth/login, /health)
    const isPublic = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/health');
    if (error.response?.status === 401 && !isPublic) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
