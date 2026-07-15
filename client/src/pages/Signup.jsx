import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, Loader2, AlertCircle, Building2, User, Phone, Mail, MapPin } from 'lucide-react';
import useAuthStore from '../store/authStore';

const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
const phoneRegex = /^[6-9]\d{9}$/;

const signupSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
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
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Signup = () => {
  const { signup, loading, error: authError } = useAuthStore();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      companyType: 'MILL',
    }
  });

  const onSubmit = async (data) => {
    setSubmitError(null);
    const result = await signup(data);
    if (result.success) {
      navigate('/verify-otp');
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
          <div className="h-10 w-10 bg-sky-500 rounded-lg flex items-center justify-center font-bold text-white text-xl mb-2 shadow-md shadow-brand-primary/20">
            T
          </div>
          <h2 className="text-xl font-bold text-white">Create B2B Company Account</h2>
          <p className="text-xs text-slate-400 mt-1">
            Register your textile enterprise. Marketplace details are accessible only after admin verification.
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
              {/* Left Column: Company credentials */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-sky-600 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Company Details
                </h3>

                {/* Company Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Company Registered Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Shree Krishna Textile Mills"
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                      errors.name ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-sky-500 focus:ring-blue-100'
                    }`}
                    {...register('name')}
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
                </div>

                {/* GST Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Indian GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 24AAAAC1234A1Z1"
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-slate-50 uppercase focus:outline-none focus:ring-2 ${
                      errors.gstNumber ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-sky-500 focus:ring-blue-100'
                    }`}
                    {...register('gstNumber')}
                  />
                  {errors.gstNumber && <p className="text-xs text-red-600 mt-1">{errors.gstNumber.message}</p>}
                </div>

                {/* Company Type */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Company Sector / Type</label>
                  <select
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                      errors.companyType ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-sky-500 focus:ring-blue-100'
                    }`}
                    {...register('companyType')}
                  >
                    <option value="MILL">MILL (Spinner / Weaver / Knitters)</option>
                    <option value="TRADER">TRADER (Dealer / Broker)</option>
                    <option value="RECYCLER">RECYCLER (Fibre / Yarn Processor)</option>
                    <option value="EXPORTER">EXPORTER (Stocklots / Surplus)</option>
                    <option value="OTHER">OTHER (Manufacturer / Stitcher)</option>
                  </select>
                  {errors.companyType && <p className="text-xs text-red-600 mt-1">{errors.companyType.message}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Account Password</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                      errors.password ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-sky-500 focus:ring-blue-100'
                    }`}
                    {...register('password')}
                  />
                  {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
                </div>
              </div>

              {/* Right Column: Contact credentials */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-sky-600 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Contact & Location
                </h3>

                {/* Contact Person Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                      errors.contactPersonName ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-sky-500 focus:ring-blue-100'
                    }`}
                    {...register('contactPersonName')}
                  />
                  {errors.contactPersonName && <p className="text-xs text-red-600 mt-1">{errors.contactPersonName.message}</p>}
                </div>

                {/* Contact Email */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Corporate Contact Email</label>
                  <input
                    type="email"
                    placeholder="e.g. rajesh@company.com"
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                      errors.contactEmail ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-sky-500 focus:ring-blue-100'
                    }`}
                    {...register('contactEmail')}
                  />
                  {errors.contactEmail && <p className="text-xs text-red-600 mt-1">{errors.contactEmail.message}</p>}
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Mobile / WhatsApp Number</label>
                  <input
                    type="text"
                    placeholder="10-digit number"
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                      errors.contactPhone ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-sky-500 focus:ring-blue-100'
                    }`}
                    {...register('contactPhone')}
                  />
                  {errors.contactPhone && <p className="text-xs text-red-600 mt-1">{errors.contactPhone.message}</p>}
                </div>

                {/* City & State (Grid) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">City Hub</label>
                    <input
                      type="text"
                      placeholder="e.g. Surat"
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                        errors.city ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-sky-500 focus:ring-blue-100'
                      }`}
                      {...register('city')}
                    />
                    {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">State</label>
                    <input
                      type="text"
                      placeholder="e.g. Gujarat"
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                        errors.state ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-sky-500 focus:ring-blue-100'
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
              <textarea
                rows={2}
                placeholder="Plot Number, Industrial GIDC, Sector..."
                className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                  errors.address ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:border-sky-500 focus:ring-blue-100'
                }`}
                {...register('address')}
              />
              {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address.message}</p>}
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Already registered?{' '}
                <Link to="/login" className="text-sky-600 hover:underline font-semibold">
                  Sign In
                </Link>
              </span>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-sky-500 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-lg text-sm transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Register Company</span>
                )}
              </button>
            </div>
          </form>

          {/* Privacy statement footer */}
          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <span className="text-[11px] text-slate-400 inline-flex items-center space-x-1.5 justify-center">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              <span>Verified B2B Marketplace Environment</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
