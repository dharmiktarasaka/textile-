import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertOctagon, ArrowUpRight, Loader2, AlertCircle, LogOut } from 'lucide-react';
import useAuthStore from '../store/authStore';

const phoneRegex = /^[6-9]\d{9}$/;
const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;

const resubmitSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  gstNumber: z
    .string()
    .toUpperCase()
    .trim()
    .regex(gstRegex, 'Invalid Indian GSTIN format (15 characters)'),
  companyType: z.enum(['MILL', 'TRADER', 'RECYCLER', 'EXPORTER', 'OTHER']),
  contactPersonName: z.string().min(2, 'Contact person name is required'),
  contactPhone: z.string().regex(phoneRegex, 'Invalid phone number (10-digits)'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
});

const Rejected = () => {
  const { user, resubmit, uploadDoc, loading, error: authError, logout } = useAuthStore();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState(null);
  const [resubmittingFile, setResubmittingFile] = useState(false);
  const [newFile, setNewFile] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resubmitSchema),
  });

  // Prepopulate form
  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('gstNumber', user.gstNumber);
      setValue('companyType', user.companyType);
      setValue('contactPersonName', user.contactPersonName);
      setValue('contactPhone', user.contactPhone);
      setValue('address', user.address);
      setValue('city', user.city);
      setValue('state', user.state);
    }
  }, [user, setValue]);

  useEffect(() => {
    if (user) {
      if (!user.emailVerified) {
        navigate('/verify-otp');
      } else if (user.verificationStatus === 'PENDING' && !user.verificationDocUrl) {
        navigate('/upload-document');
      } else if (user.verificationStatus === 'PENDING' && user.verificationDocUrl) {
        navigate('/pending-approval');
      } else if (user.verificationStatus === 'VERIFIED') {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const onResubmitData = async (data) => {
    setSubmitError(null);
    const result = await resubmit(data);
    if (result.success) {
      // If data is updated, check if we need to re-upload document
      if (newFile) {
        setResubmittingFile(true);
        const uploadResult = await uploadDoc(newFile);
        setResubmittingFile(false);
        if (uploadResult.success) {
          navigate('/pending-approval');
        } else {
          setSubmitError(uploadResult.error);
        }
      } else {
        navigate('/upload-document');
      }
    } else {
      setSubmitError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 py-12 relative">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10 animate-scale-up">
        {/* Rejection alert banner */}
        <div className="bg-red-500 px-8 py-6 text-white text-center flex flex-col items-center">
          <AlertOctagon className="h-10 w-10 text-white mb-2 animate-bounce" />
          <h2 className="text-xl font-bold">Verification Request Rejected</h2>
          <p className="text-xs text-red-100 mt-1">Compliance team flagged issues with your company credentials</p>
        </div>

        <div className="p-8">
          {/* Display Rejection Reason */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-8">
            <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">Rejection Feedback from Admin:</h4>
            <p className="text-sm text-red-700 font-medium leading-relaxed">
              "{user?.rejectionReason || 'No details provided. Please review registration details or re-upload GST files.'}"
            </p>
          </div>

          {(submitError || authError) && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700 font-medium">{submitError || authError}</p>
            </div>
          )}

          {/* Resubmit form */}
          <form onSubmit={handleSubmit(onResubmitData)} className="space-y-6">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-2">
              Update Registration & Resubmit
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Company Name */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Company Registered Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border text-xs bg-slate-50 focus:outline-none focus:ring-2 border-slate-200 focus:border-sky-500 focus:ring-blue-50"
                  {...register('name')}
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
              </div>

              {/* GSTIN */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">GSTIN Number</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border text-xs bg-slate-50 uppercase focus:outline-none focus:ring-2 border-slate-200 focus:border-sky-500"
                  {...register('gstNumber')}
                />
                {errors.gstNumber && <p className="text-xs text-red-600 mt-1">{errors.gstNumber.message}</p>}
              </div>

              {/* Company Type */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Company Type</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border text-xs bg-slate-50 focus:outline-none border-slate-200"
                  {...register('companyType')}
                >
                  <option value="MILL">MILL</option>
                  <option value="TRADER">TRADER</option>
                  <option value="RECYCLER">RECYCLER</option>
                  <option value="EXPORTER">EXPORTER</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              {/* Contact Person Name */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Contact Person</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border text-xs bg-slate-50 focus:outline-none border-slate-200"
                  {...register('contactPersonName')}
                />
                {errors.contactPersonName && <p className="text-xs text-red-600 mt-1">{errors.contactPersonName.message}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Contact Phone</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border text-xs bg-slate-50 focus:outline-none border-slate-200"
                  {...register('contactPhone')}
                />
                {errors.contactPhone && <p className="text-xs text-red-600 mt-1">{errors.contactPhone.message}</p>}
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">City Hub</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg border text-xs bg-slate-50 focus:outline-none border-slate-200"
                    {...register('city')}
                  />
                  {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">State</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg border text-xs bg-slate-50 focus:outline-none border-slate-200"
                    {...register('state')}
                  />
                  {errors.state && <p className="text-xs text-red-600 mt-1">{errors.state.message}</p>}
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Address</label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 rounded-lg border text-xs bg-slate-50 focus:outline-none border-slate-200"
                {...register('address')}
              />
              {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address.message}</p>}
            </div>

            {/* Reupload Document Optionally */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <label className="block text-xs font-bold text-slate-700 mb-2">Re-upload Verification Document (Optional)</label>
              <p className="text-[10px] text-slate-400 mb-3">Upload a clearer copy of your GSTIN registration or tax record.</p>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setNewFile(e.target.files[0])}
                className="text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
              />
              {newFile && <p className="text-xs text-sky-600 font-medium mt-2">New file selected: {newFile.name}</p>}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-xs text-slate-500 hover:text-slate-700 font-semibold flex items-center space-x-1"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>

              <button
                type="submit"
                disabled={loading || resubmittingFile}
                className="w-full sm:w-auto bg-sky-500 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg text-xs transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                {(loading || resubmittingFile) ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    <span>Processing Resubmission...</span>
                  </>
                ) : (
                  <span>Resubmit Information</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Rejected;
