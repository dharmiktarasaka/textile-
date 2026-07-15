import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, Loader2, AlertCircle, Building2, User, Phone, Mail, MapPin } from 'lucide-react';
import useAuthStore from '../store/authStore';

const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
const phoneRegex = /^[6-9]\d{9}$/;

const completeProfileSchema = z.object({
  name: z.string().min(2, 'Company registered name must be at least 2 characters'),
  gstNumber: z
    .string()
    .toUpperCase()
    .trim()
    .regex(gstRegex, 'Invalid Indian GSTIN format (15 characters, e.g. 24AAAAC1234A1Z1)'),
  companyType: z.enum(['MILL', 'TRADER', 'RECYCLER', 'EXPORTER', 'OTHER'], {
    errorMap: () => ({ message: 'Please select a company type' }),
  }),
  contactPersonName: z.string().min(2, 'Contact person name is required'),
  contactEmail: z.string().email('Invalid email address').trim().toLowerCase(),
  contactPhone: z.string().regex(phoneRegex, 'Invalid phone number (10-digits starting with 6-9)'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City hub is required'),
  state: z.string().min(2, 'State hub is required'),
  role: z.enum(['SELLER', 'BUYER', 'BOTH'], {
    errorMap: () => ({ message: 'Please select a profile role' }),
  }),
});

const CompleteProfile = () => {
  const { user, completeGoogleProfile, loading, error: authError } = useAuthStore();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      companyType: 'OTHER',
      role: 'BOTH',
    }
  });

  // Prepopulate values from Google user object
  useEffect(() => {
    if (user) {
      if (user.contactEmail) {
        setValue('contactEmail', user.contactEmail);
      }
      if (user.contactPersonName) {
        setValue('contactPersonName', user.contactPersonName);
      }
      if (user.name && !user.name.includes('@')) {
        setValue('name', user.name);
      }
      if (user.contactPhone && user.contactPhone !== '0000000000') {
        setValue('contactPhone', user.contactPhone);
      }
      if (user.address && !user.address.includes('Please enter')) {
        setValue('address', user.address);
      }
      if (user.city && !user.city.includes('Please enter')) {
        setValue('city', user.city);
      }
      if (user.state && !user.state.includes('Please enter')) {
        setValue('state', user.state);
      }
    }
  }, [user, setValue]);

  const onSubmit = async (data) => {
    setSubmitError(null);
    const result = await completeGoogleProfile(data);
    if (result.success) {
      const { company } = result;
      // After completing details, redirect to document upload for admin verification
      if (company.verificationStatus === 'PENDING' && !company.verificationDocUrl) {
        navigate('/upload-document');
      } else {
        navigate('/dashboard');
      }
    } else {
      setSubmitError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 py-12 relative">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10 animate-scale-up">
        {/* Banner header */}
        <div className="bg-brand-primary px-8 py-6 text-center border-b border-blue-700 flex flex-col items-center">
          <div className="h-10 w-10 bg-brand-primary rounded-lg flex items-center justify-center font-bold text-white text-xl mb-2 shadow-md shadow-sky-500/20">
            G
          </div>
          <h2 className="text-xl font-bold text-white">Complete Business Profile</h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete the details below to complete your Google sign-in onboarding.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {(submitError || authError) && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700 font-medium">{submitError || authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Company Credentials */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-slate-100 pb-2">
                  Company details
                </h3>

                {/* Company Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Company Registered Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Shree Krishna Textile Mills"
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                      errors.name ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-brand-primary focus:ring-sky-50'
                    }`}
                    {...register('name')}
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
                </div>

                {/* GST Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">GSTIN Number (15 chars)</label>
                  <input
                    type="text"
                    placeholder="e.g. 24AAAAC1234A1Z1"
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                      errors.gstNumber ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-brand-primary focus:ring-sky-50'
                    }`}
                    {...register('gstNumber')}
                  />
                  {errors.gstNumber && <p className="text-xs text-red-600 mt-1">{errors.gstNumber.message}</p>}
                </div>

                {/* Company Type */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Company Segment/Type</label>
                  <select
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                      errors.companyType ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-brand-primary focus:ring-sky-50'
                    }`}
                    {...register('companyType')}
                  >
                    <option value="MILL">Mill (Generates waste)</option>
                    <option value="TRADER">Trader (Buys/Sells)</option>
                    <option value="RECYCLER">Recycler (Consumes waste)</option>
                    <option value="EXPORTER">Exporter (Bulk shipments)</option>
                    <option value="OTHER">Other Business</option>
                  </select>
                  {errors.companyType && <p className="text-xs text-red-600 mt-1">{errors.companyType.message}</p>}
                </div>

                {/* Role / Profile Type */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">I want to participate as</label>
                  <select
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                      errors.role ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-brand-primary focus:ring-sky-50'
                    }`}
                    {...register('role')}
                  >
                    <option value="BOTH">Both (Buy & Sell)</option>
                    <option value="SELLER">Seller Only (List waste stocks)</option>
                    <option value="BUYER">Buyer Only (Search waste stocks)</option>
                  </select>
                  {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role.message}</p>}
                </div>
              </div>

              {/* Right Column: Contact & Location */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-slate-100 pb-2">
                  Contact & Locations
                </h3>

                {/* Contact Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Contact Person Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                        errors.contactPersonName ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-brand-primary focus:ring-sky-50'
                      }`}
                      {...register('contactPersonName')}
                    />
                  </div>
                  {errors.contactPersonName && <p className="text-xs text-red-600 mt-1">{errors.contactPersonName.message}</p>}
                </div>

                {/* Contact Email */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Official Contact Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      placeholder="name@company.com"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                        errors.contactEmail ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-brand-primary focus:ring-sky-50'
                      }`}
                      {...register('contactEmail')}
                    />
                  </div>
                  {errors.contactEmail && <p className="text-xs text-red-600 mt-1">{errors.contactEmail.message}</p>}
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Contact Phone (10 Digits)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                        errors.contactPhone ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-brand-primary focus:ring-sky-50'
                      }`}
                      {...register('contactPhone')}
                    />
                  </div>
                  {errors.contactPhone && <p className="text-xs text-red-600 mt-1">{errors.contactPhone.message}</p>}
                </div>

                {/* City & State */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">City Hub</label>
                    <input
                      type="text"
                      placeholder="e.g. Surat"
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                        errors.city ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-brand-primary focus:ring-sky-50'
                      }`}
                      {...register('city')}
                    />
                    {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city.message}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">State Hub</label>
                    <input
                      type="text"
                      placeholder="e.g. Gujarat"
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                        errors.state ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-brand-primary focus:ring-sky-50'
                      }`}
                      {...register('state')}
                    />
                    {errors.state && <p className="text-xs text-red-600 mt-1">{errors.state.message}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Address (Full-width) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Factory / Office Address</label>
              <div className="relative">
                <span className="absolute top-3.5 left-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="h-4 w-4" />
                </span>
                <textarea
                  placeholder="Plot no, industrial area, road address details..."
                  rows={2}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                    errors.address ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-brand-primary focus:ring-sky-50'
                  }`}
                  {...register('address')}
                />
              </div>
              {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address.message}</p>}
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg text-sm transition-all focus:outline-none shadow-lg shadow-sky-500/10 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Saving Profile details...</span>
                </>
              ) : (
                <span>Complete Onboarding</span>
              )}
            </button>
          </form>

          {/* Secure indicator */}
          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <span className="text-[11px] text-slate-400 inline-flex items-center space-x-1.5 justify-center">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              <span>Gated Verification-Required Portal Access</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
