import { create } from 'zustand';
import apiClient from '../api/apiClient';

/**
 * Derives the initial active role from localStorage or falls back to
 * the company's DB role. If role is BOTH or SELLER → 'SELLER', else 'BUYER'.
 */
const deriveActiveRole = (company) => {
  const stored = localStorage.getItem('activeRole');
  if (stored === 'SELLER' || stored === 'BUYER') return stored;
  if (company?.role === 'SELLER' || company?.role === 'BOTH') return 'SELLER';
  return 'BUYER';
};

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  activeRole: localStorage.getItem('activeRole') || 'BUYER',
  loading: false,
  error: null,

  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },

  setActiveRole: (role) => {
    localStorage.setItem('activeRole', role);
    set({ activeRole: role });
  },

  signup: async (companyData) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.post('/auth/signup', companyData);
      const { token, company } = res.data;
      localStorage.setItem('token', token);
      const activeRole = deriveActiveRole(company);
      localStorage.setItem('activeRole', activeRole);
      set({ token, user: company, activeRole, loading: false });
      return { success: true, company };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  verifyOtp: async (email, otp) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.post('/auth/verify-otp', { email, otp });
      const { token, company } = res.data;
      localStorage.setItem('token', token);
      const activeRole = deriveActiveRole(company);
      localStorage.setItem('activeRole', activeRole);
      set({ token, user: company, activeRole, loading: false });
      return { success: true, company };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Verification failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  resendOtp: async (email) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.post('/auth/resend-otp', { email });
      set({ loading: false });
      return { success: true, message: res.data.message };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Resending OTP failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { token, company } = res.data;
      localStorage.setItem('token', token);
      const activeRole = deriveActiveRole(company);
      localStorage.setItem('activeRole', activeRole);
      set({ token, user: company, activeRole, loading: false });
      return { success: true, company };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.post('/auth/google-login', { token: idToken });
      const { token, company } = res.data;
      localStorage.setItem('token', token);
      const activeRole = deriveActiveRole(company);
      localStorage.setItem('activeRole', activeRole);
      set({ token, user: company, activeRole, loading: false });
      return { success: true, company };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Google sign-in failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('activeRole');
    set({ token: null, user: null, activeRole: 'BUYER', error: null });
  },

  fetchMe: async () => {
    if (!get().token) return;
    set({ loading: true });
    try {
      const res = await apiClient.get('/company/me');
      const company = res.data.company;
      const activeRole = deriveActiveRole(company);
      localStorage.setItem('activeRole', activeRole);
      set({ user: company, activeRole, loading: false });
    } catch (err) {
      console.error('fetchMe error:', err);
      // Only logout if token is explicitly invalid or unauthorized (401 / 403)
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem('token');
        localStorage.removeItem('activeRole');
        set({ token: null, user: null, activeRole: 'BUYER', loading: false });
      } else {
        set({ loading: false });
      }
    }
  },

  /**
   * Switches the current user to Seller role.
   * Calls the backend to upgrade role if needed, then sets activeRole to SELLER.
   */
  switchToSeller: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.patch('/company/switch-to-seller');
      const company = res.data.company;
      localStorage.setItem('activeRole', 'SELLER');
      set({ user: company, activeRole: 'SELLER', loading: false });
      return { success: true, message: res.data.message };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to switch to seller';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  uploadDoc: async (file) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('document', file);

      const res = await apiClient.post('/company/upload-verification-doc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      set({ user: res.data.company, loading: false });
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Document upload failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  resubmit: async (formData) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.patch('/company/resubmit-verification', formData);
      set({ user: res.data.company, loading: false });
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Resubmission failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  completeGoogleProfile: async (profileData) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.patch('/company/complete-google-profile', profileData);
      const company = res.data.company;
      set({ user: company, loading: false });
      return { success: true, company };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Profile completion failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },
}));

export default useAuthStore;
