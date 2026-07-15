import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, Loader2, AlertCircle, CheckCircle2, LogOut } from 'lucide-react';
import useAuthStore from '../store/authStore';

const UploadDocument = () => {
  const { user, uploadDoc, loading, error: authError, logout } = useAuthStore();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // If not verified email, send back
    if (user && !user.emailVerified) {
      navigate('/verify-otp');
    }
    // If already has uploaded doc and pending
    if (user?.verificationStatus === 'PENDING' && user.verificationDocUrl) {
      navigate('/pending-approval');
    }
    if (user?.verificationStatus === 'VERIFIED') {
      navigate('/dashboard');
    }
    if (user?.verificationStatus === 'REJECTED') {
      navigate('/rejected');
    }
  }, [user, navigate]);

  const handleFileChange = (e) => {
    setError(null);
    const selected = e.target.files[0];
    if (!selected) return;

    // Check size limit (10MB)
    if (selected.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(selected.type)) {
      setError('Only PDFs, PNG, JPG, or JPEG images are allowed.');
      return;
    }

    setFile(selected);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Please select a document file first.');
      return;
    }

    const result = await uploadDoc(file);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/pending-approval');
      }, 1500);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10 animate-scale-up">
        {/* Header */}
        <div className="bg-brand-primary px-8 py-6 text-center border-b border-blue-700 flex flex-col items-center">
          <div className="h-10 w-10 bg-sky-500 rounded-lg flex items-center justify-center font-bold text-white text-xl mb-3">
            T
          </div>
          <h2 className="text-xl font-bold text-white">Business Verification</h2>
          <p className="text-xs text-slate-400 mt-1">Upload registration files to activate your marketplace trade permissions</p>
        </div>

        {/* Body */}
        <div className="p-8">
          {(error || authError) && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700 font-medium">{error || authError}</p>
            </div>
          )}

          {success && (
            <div className="bg-sky-50 border-l-4 border-sky-500 p-4 mb-6 rounded flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-sky-500 flex-shrink-0" />
              <p className="text-xs text-sky-700 font-medium">Document uploaded successfully! Redirecting...</p>
            </div>
          )}

          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 space-y-2">
            <h4 className="font-bold text-navy-900">Supported Documents:</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>GST Registration Certificate (REG-06)</li>
              <li>Udyam MSME Registration Certificate</li>
              <li>Company Incorporation Document</li>
            </ul>
            <p className="text-[10px] text-slate-400 mt-2">Max File Size: 10MB. Formats: PDF, PNG, JPG.</p>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-6">
            {/* File Drag and Drop Box */}
            <div className="flex flex-col items-center justify-center">
              <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-8 cursor-pointer hover:bg-sky-50/20 transition-all">
                <div className="flex flex-col items-center justify-center text-center">
                  <UploadCloud className="h-10 w-10 text-slate-400 mb-3" />
                  <p className="text-xs font-semibold text-slate-700">Click to upload or drag files here</p>
                  <p className="text-[10px] text-slate-400 mt-1">PDF, JPG, or PNG up to 10MB</p>
                </div>
                <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} />
              </label>
            </div>

            {/* Selected File Details */}
            {file && (
              <div className="flex items-center space-x-3 bg-slate-100 p-3.5 rounded-lg border border-slate-200">
                <FileText className="h-8 w-8 text-sky-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !file || success}
              className="w-full bg-sky-500 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg text-sm transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Uploading Document...</span>
                </>
              ) : (
                <span>Submit for Verification</span>
              )}
            </button>
          </form>

          {/* Cancel */}
          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-xs text-slate-500 hover:text-slate-700 font-semibold flex items-center justify-center space-x-1.5 mx-auto"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadDocument;
