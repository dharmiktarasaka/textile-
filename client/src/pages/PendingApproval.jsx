import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, RefreshCw, LogOut, CheckCircle2, ShieldAlert } from 'lucide-react';
import useAuthStore from '../store/authStore';

const PendingApproval = () => {
  const { user, fetchMe, logout } = useAuthStore();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMe();
    setRefreshing(false);
  };

  useEffect(() => {
    // Check onboarding parameters
    if (user) {
      if (!user.emailVerified) {
        navigate('/verify-otp');
      } else if (!user.verificationDocUrl) {
        navigate('/upload-document');
      } else if (user.verificationStatus === 'VERIFIED') {
        navigate('/dashboard');
      } else if (user.verificationStatus === 'REJECTED') {
        navigate('/rejected');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    // Auto refresh every 10 seconds to check approval
    const interval = setInterval(() => {
      fetchMe();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchMe]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10 animate-scale-up">
        {/* Body Banner */}
        <div className="p-8 text-center flex flex-col items-center">
          <div className="h-16 w-16 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-center mb-6 text-brand-primary animate-pulse">
            <Clock className="h-8 w-8" />
          </div>

          <h2 className="text-xl font-bold text-navy-900">Awaiting Admin Verification</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-sm">
            Your registration documents have been uploaded and are being reviewed by the TextileWasteHub compliance team.
          </p>

          <div className="my-6 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 text-left space-y-2.5 w-full">
            <div className="flex justify-between">
              <span className="font-semibold">Company Name:</span>
              <span className="text-navy-900 font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">GSTIN:</span>
              <span className="text-navy-900 font-medium">{user?.gstNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Verification Status:</span>
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold border border-amber-200 uppercase">
                {user?.verificationStatus}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-6">
            We will verify your application shortly. This page checks for approval status automatically.
          </p>

          <div className="flex flex-col w-full gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full bg-brand-primary hover:bg-navy-800 text-white font-bold py-3 rounded-lg text-sm transition-all flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Check Status Now'}</span>
            </button>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-3 rounded-lg text-sm transition-all flex items-center justify-center space-x-1.5"
            >
              <LogOut className="h-4 w-4 text-slate-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
