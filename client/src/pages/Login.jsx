import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import useAuthStore from '../store/authStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const { login, loginWithGoogle, loading, error: authError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
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
      const { company } = result;
      // Handle onboarding redirection
      if (!company.emailVerified) {
        navigate('/verify-otp');
      } else if (company.googleProfileCompleted === false) {
        navigate('/complete-profile');
      } else if (company.verificationStatus === 'PENDING' && !company.verificationDocUrl) {
        navigate('/upload-document');
      } else if (company.verificationStatus === 'PENDING' && company.verificationDocUrl) {
        navigate('/pending-approval');
      } else if (company.verificationStatus === 'REJECTED') {
        navigate('/rejected');
      } else if (company.verificationStatus === 'VERIFIED') {
        // Redirect to intended route or default to dashboard
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } else {
      setSubmitError(result.error);
    }
  };

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'your-api-key-here') {
      setSubmitError('Firebase is not configured yet. Please replace the placeholders in client/.env with your actual Firebase project credentials and restart the dev server.');
      return;
    }
    setSubmitError(null);
    setGoogleLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const idToken = await userCredential.user.getIdToken();
      const result = await loginWithGoogle(idToken);
      if (result.success) {
        const { company } = result;
        if (!company.emailVerified) {
          navigate('/verify-otp');
        } else if (company.googleProfileCompleted === false) {
          navigate('/complete-profile');
        } else if (company.verificationStatus === 'PENDING' && !company.verificationDocUrl) {
          navigate('/upload-document');
        } else if (company.verificationStatus === 'PENDING' && company.verificationDocUrl) {
          navigate('/pending-approval');
        } else if (company.verificationStatus === 'REJECTED') {
          navigate('/rejected');
        } else if (company.verificationStatus === 'VERIFIED') {
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        }
      } else {
        setSubmitError(result.error);
      }
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || 'Google authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
      {/* Background overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10 animate-scale-up">
        {/* Header Branding banner */}
        <div className="bg-brand-primary px-8 py-6 text-center border-b border-blue-700 flex flex-col items-center">
          <div className="h-12 w-12 bg-sky-500 rounded-xl flex items-center justify-center font-bold text-white text-2xl mb-3 shadow-md shadow-brand-primary/20">
            T
          </div>
          <h2 className="text-xl font-bold text-white">B2B Company Access Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Enter credentials registered with TextileWasteHub</p>
        </div>

        {/* Login form body */}
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
                Contact Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  placeholder="name@company.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-slate-200 focus:border-sky-500 focus:ring-blue-100'
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
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
                      : 'border-slate-200 focus:border-sky-500 focus:ring-blue-100'
                  }`}
                  {...register('password')}
                />
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.password.message}</p>}
            </div>

            {/* CTA Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg text-sm transition-all focus:outline-none shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Google Sign In Button Container */}
          <div className="flex justify-center w-full">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 font-semibold text-sm transition-all focus:outline-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 0, 0)">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.29c1.92,-1.78 3.02,-4.4 3.02,-7.4C21.65,11.8 21.54,11.4 21.35,11.1z" fill="#4285F4" />
                    <path d="M12,20.5c2.56,0 4.72,-0.85 6.29,-2.3l-3.29,-2.6c-0.91,0.61 -2.08,0.97 -3,0.97 -2.31,0 -4.27,-1.56 -4.97,-3.66H3.61v2.68C5.17,18.73 8.35,20.5 12,20.5z" fill="#34A853" />
                    <path d="M7.03,12.91c-0.18,-0.54 -0.28,-1.11 -0.28,-1.71c0,-0.6 0.1,-1.18 0.28,-1.71V6.8H3.61C2.99,8.04 2.65,9.47 2.65,11c0,1.53 0.34,2.96 0.96,4.2l3.42,-2.29z" fill="#FBBC05" />
                    <path d="M12,6.44c1.39,0 2.65,0.48 3.63,1.41l2.72,-2.72C16.71,3.61 14.55,2.75 12,2.75c-3.65,0 -6.83,1.77 -8.39,4.72l3.42,2.29c0.7,-2.1 2.66,-3.66 4.97,-3.66z" fill="#EA4335" />
                  </g>
                </svg>
              )}
              <span>{googleLoading ? 'Connecting to Google...' : 'Sign in with Google'}</span>
            </button>
          </div>

          {/* Register links at bottom */}
          <p className="mt-6 text-center text-xs text-slate-500">
            Don't have a B2B account?{' '}
            <Link to="/signup/seller" className="text-sky-600 hover:underline font-bold">
              Register as Seller
            </Link>{' '}
            or{' '}
            <Link to="/signup/buyer" className="text-sky-600 hover:underline font-bold">
              Register as Buyer
            </Link>
          </p>

          {/* Privacy statement footer */}
          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <span className="text-[11px] text-slate-400 inline-flex items-center space-x-1.5 justify-center">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              <span>Gated Secure B2B Environment</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
