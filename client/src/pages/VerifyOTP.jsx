import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle, MailOpen } from 'lucide-react';
import useAuthStore from '../store/authStore';

const VerifyOTP = () => {
  const { user, verifyOtp, resendOtp, loading, error: authError } = useAuthStore();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Resend cooldown state
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // If user is already verified, bypass
    if (user?.emailVerified) {
      if (user.verificationStatus === 'PENDING' && !user.verificationDocUrl) {
        navigate('/upload-document');
      } else if (user.verificationStatus === 'PENDING' && user.verificationDocUrl) {
        navigate('/pending-approval');
      } else if (user.verificationStatus === 'VERIFIED') {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6 || isNaN(Number(otp))) {
      setError('OTP must be a 6-digit numeric code');
      return;
    }

    const email = user?.contactEmail || localStorage.getItem('signupEmail');
    if (!email) {
      setError('Company email session lost. Please log in again.');
      return;
    }

    const result = await verifyOtp(email, otp);
    if (result.success) {
      setSuccessMsg('Email verified successfully!');
      setTimeout(() => {
        navigate('/upload-document');
      }, 1500);
    } else {
      setError(result.error);
    }
  };

  const handleResend = async () => {
    setError(null);
    setSuccessMsg(null);

    const email = user?.contactEmail || localStorage.getItem('signupEmail');
    if (!email) {
      setError('Company email session lost. Please sign up again.');
      return;
    }

    setResending(true);
    const result = await resendOtp(email);
    setResending(false);

    if (result.success) {
      setSuccessMsg('A new verification code has been sent successfully!');
      setResendCooldown(30);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10 animate-scale-up">
        {/* Banner Header */}
        <div className="bg-brand-primary px-8 py-6 text-center border-b border-blue-700 flex flex-col items-center">
          <div className="h-10 w-10 bg-sky-500 rounded-lg flex items-center justify-center font-bold text-white text-xl mb-3">
            T
          </div>
          <h2 className="text-xl font-bold text-white">Email Verification OTP</h2>
          <p className="text-xs text-slate-400 mt-1">We sent a verification code to {user?.contactEmail || 'your email'}</p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="bg-sky-50 border-l-4 border-sky-500 p-4 mb-6 rounded flex items-start space-x-3">
              <ShieldCheck className="h-5 w-5 text-sky-500 flex-shrink-0" />
              <p className="text-xs text-sky-700 font-medium">{successMsg}</p>
            </div>
          )}

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded flex flex-col space-y-1">
            <h4 className="text-xs font-bold text-blue-800 flex items-center space-x-1.5">
              <MailOpen className="h-4 w-4" />
              <span>Developer Notice</span>
            </h4>
            <p className="text-[11px] text-blue-700 leading-normal">
              Check the server console output to see the newly generated verification code!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider text-center mb-4">
                Enter 6-Digit OTP Code
              </label>
              <div className="flex justify-center">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-48 text-center tracking-[12px] text-2xl font-bold py-3.5 border-2 border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg bg-slate-50 focus:ring-4 focus:ring-sky-50 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || successMsg}
              className="w-full bg-sky-500 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg text-sm transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify OTP</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend Button */}
          <div className="mt-4 text-center">
            <button
              type="button"
              disabled={resending || resendCooldown > 0 || successMsg}
              onClick={handleResend}
              className="text-xs font-bold text-sky-600 hover:text-blue-700 hover:underline disabled:text-slate-400 disabled:no-underline transition-colors"
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : resending
                ? 'Regenerating new OTP...'
                : 'Resend Verification Code'}
            </button>
          </div>

          {/* Cancel / Log out link */}
          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <button
              onClick={() => {
                useAuthStore.getState().logout();
                navigate('/login');
              }}
              className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
            >
              Cancel & Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
