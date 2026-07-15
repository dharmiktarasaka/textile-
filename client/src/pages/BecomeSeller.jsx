import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  CheckCircle2,
  Package,
  TrendingUp,
  Users,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const SELLER_BENEFITS = [
  {
    icon: Package,
    title: 'List Waste Products',
    description: 'Upload textile waste lots with photos, quantity, and pricing for buyers to discover.',
  },
  {
    icon: Users,
    title: 'Connect with Buyers',
    description: 'Receive contact requests from verified recyclers, mills, and exporters nationwide.',
  },
  {
    icon: TrendingUp,
    title: 'Seller Analytics',
    description: 'Track your listings, views, contact requests, and sales performance in one dashboard.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Badge',
    description: 'Your verified status builds trust with buyers and increases response rate.',
  },
];

const BecomeSeller = () => {
  const navigate = useNavigate();
  const { user, switchToSeller, loading } = useAuthStore();
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleActivate = async () => {
    if (!agreed) {
      setError('Please agree to the seller terms before continuing.');
      return;
    }
    setError('');
    const result = await switchToSeller();
    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } else {
      setError(result.error || 'Something went wrong. Please try again.');
    }
  };

  // Already a seller — redirect them
  if (user?.role === 'SELLER' || user?.role === 'BOTH') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-10 max-w-md w-full text-center">
          <div className="h-16 w-16 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-sky-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">You're already a seller!</h2>
          <p className="text-sm text-slate-500 mb-6">Your account already has seller privileges. Go to your dashboard to manage listings.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-sky-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-200">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Become a Seller</h1>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Activate seller access to list textile waste products and connect with verified buyers across India.
          </p>
        </div>

        {/* Company confirm card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Activating Seller for</p>
              <p className="text-lg font-bold text-slate-900">{user?.name}</p>
              <p className="text-sm text-slate-500">{user?.city}, {user?.state} · {user?.companyType}</p>
            </div>
            <div className="flex items-center space-x-1 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Verified</span>
            </div>
          </div>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {SELLER_BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.title}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-sky-300 hover:shadow-md transition-all duration-200"
              >
                <div className="h-9 w-9 rounded-lg bg-sky-50 flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-sky-500" />
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-1">{benefit.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>

        {/* Terms agree + CTA */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

          {success ? (
            <div className="text-center py-4">
              <CheckCircle2 className="h-12 w-12 text-sky-500 mx-auto mb-3" />
              <p className="text-lg font-bold text-slate-900 mb-1">Seller Access Activated!</p>
              <p className="text-sm text-slate-500">Redirecting you to the Seller Dashboard...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start space-x-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <label className="flex items-start space-x-3 cursor-pointer mb-5 group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    onClick={() => setAgreed(!agreed)}
                    className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                      agreed ? 'bg-sky-500 border-sky-500' : 'border-slate-300 hover:border-sky-400'
                    }`}
                  >
                    {agreed && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                  </div>
                </div>
                <span className="text-sm text-slate-600 leading-relaxed">
                  I agree to TextileWasteHub's{' '}
                  <span className="text-sky-600 font-medium hover:underline cursor-pointer">Seller Terms & Conditions</span>
                  {' '}and confirm this company's information is accurate. I understand that listing fake or misleading products may result in account suspension.
                </span>
              </label>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActivate}
                  disabled={loading || !agreed}
                  className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center space-x-2 text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Activating...</span>
                    </>
                  ) : (
                    <>
                      <span>Activate Seller Access</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Back link */}
        <p className="text-center text-xs text-slate-400 mt-4">
          <button onClick={() => navigate(-1)} className="hover:text-sky-500 transition-colors">
            ← Back
          </button>
        </p>
      </div>
    </div>
  );
};

export default BecomeSeller;
