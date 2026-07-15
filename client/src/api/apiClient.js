import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : (rawApiUrl.endsWith('/') ? `${rawApiUrl}api` : `${rawApiUrl}/api`);
export const BACKEND_BASE = API_URL.endsWith('/api') ? API_URL.substring(0, API_URL.length - 4) : API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch authorization errors (401/403)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized (token expired or company deleted/invalid)
    if (error.response && error.response.status === 401) {
      const msg = error.response.data?.message || '';
      // Don't auto logout on initial verify otp phases
      if (!msg.includes('verify your email')) {
        localStorage.removeItem('token');
        // Optional redirect to login can be handled in React context or store
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-logout'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
