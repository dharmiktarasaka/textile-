import { create } from 'zustand';
import apiClient from '../api/apiClient';

const useAdminAuthStore = create((set) => ({
  admin: localStorage.getItem('adminToken') ? { email: 'admin@textilewastehub.com' } : null,
  token: localStorage.getItem('adminToken') || null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.post('/admin/login', { email, password });
      const { token, admin } = res.data;
      localStorage.setItem('adminToken', token);
      set({ token, admin, loading: false });
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Admin login failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  logout: () => {
    localStorage.removeItem('adminToken');
    set({ token: null, admin: null, error: null });
  },
}));

export default useAdminAuthStore;
