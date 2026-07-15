import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import useAdminAuthStore from '../store/adminAuthStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const AdminLogin = () => {
  const { login, loading, error: authError } = useAdminAuthStore();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setSubmitError(null);
    const result = await login(data.email, data.password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setSubmitError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10 animate-scale-up">
        {/* Banner Header */}
        <div className="bg-slate-950 px-8 py-6 text-center border-b border-slate-800 flex flex-col items-center">
          <div className="h-11 w-11 bg-brand-green rounded-xl flex items-center justify-center font-bold text-white text-xl mb-3 shadow-md shadow-blue-500/20">
            A
          </div>
          <h2 className="text-lg font-bold text-white">Administration Login</h2>
          <p className="text-xs text-slate-400 mt-1">Access TextileWasteHub management panel</p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {(submitError || authError) && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700 font-medium">{submitError || authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  placeholder="admin@textilewastehub.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                  {...register('password')}
                />
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-green hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg text-sm transition-all focus:outline-none shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Logging In...</span>
                </>
              ) : (
                <span>Access Console</span>
              )}
            </button>
          </form>

          {/* Privacy statement footer */}
          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <span className="text-[11px] text-slate-400 inline-flex items-center space-x-1.5 justify-center">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Restricted Compliance Access Only</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
