import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Loader2,
  FileText,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import apiClient from '../api/apiClient';

const CompanyReviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [signedDocUrl, setSignedDocUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rejection modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null); // 'APPROVED', 'REJECTED', 'PROFILE_APPROVED', 'PROFILE_REJECTED'
  const [actionType, setActionType] = useState('REGISTRATION'); // 'REGISTRATION' or 'PROFILE_UPDATE'

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/admin/companies/${id}`);
      setCompany(res.data.company);
      setSignedDocUrl(res.data.signedDocUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyDetails();
  }, [id]);

  const handleApprove = async () => {
    if (!window.confirm(`Are you sure you want to APPROVE ${company?.name}? This will unlock marketplace trade instantly.`)) return;

    setSubmittingAction(true);
    try {
      await apiClient.post(`/admin/companies/${id}/approve`);
      setActionSuccess('APPROVED');
      setTimeout(() => {
        navigate('/pending-reviews');
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Approval action failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleApproveProfileUpdate = async () => {
    if (!window.confirm(`Are you sure you want to APPROVE the profile changes for ${company?.name}? This will update their official business credentials.`)) return;

    setSubmittingAction(true);
    try {
      await apiClient.post(`/admin/companies/${id}/approve-profile-update`);
      setActionSuccess('PROFILE_APPROVED');
      setTimeout(() => {
        navigate('/pending-reviews');
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Profile update approval failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  const triggerReject = (type) => {
    setActionType(type);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('Please specify a rejection reason');
      return;
    }

    setSubmittingAction(true);
    try {
      if (actionType === 'PROFILE_UPDATE') {
        await apiClient.post(`/admin/companies/${id}/reject-profile-update`, {
          reason: rejectReason,
        });
        setActionSuccess('PROFILE_REJECTED');
      } else {
        await apiClient.post(`/admin/companies/${id}/reject`, {
          reason: rejectReason,
        });
        setActionSuccess('REJECTED');
      }
      setShowRejectModal(false);
      setTimeout(() => {
        navigate('/pending-reviews');
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection action failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-4">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="font-bold text-slate-900 text-lg">Error Loading Company Details</h3>
        <p className="text-slate-500 text-xs">{error || 'The requested company does not exist.'}</p>
        <Link to="/pending-reviews" className="inline-block bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold">
          Back to Queue
        </Link>
      </div>
    );
  }

  const hasPendingChange = company.pendingProfileUpdate?.hasPendingChange;
  const pending = company.pendingProfileUpdate || {};

  // Utility to determine if a field is modified in the pending changes
  const isChanged = (field, pendingVal) => {
    if (!hasPendingChange) return false;
    const currentVal = company[field];
    return currentVal !== pendingVal;
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link to="/pending-reviews" className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold mb-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Registration Queue</span>
        </Link>
      </div>

      {actionSuccess && (
        <div className={`p-4 rounded-xl border flex items-start space-x-3 shadow ${
          actionSuccess.includes('APPROVED')
            ? 'bg-blue-50 border-blue-200 text-blue-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {actionSuccess.includes('APPROVED') ? (
            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
          <div>
            <h4 className="font-bold text-sm">
              {actionSuccess === 'APPROVED' && 'Company Verified Successfully'}
              {actionSuccess === 'REJECTED' && 'Company Registration Rejected'}
              {actionSuccess === 'PROFILE_APPROVED' && 'Profile Update Approved'}
              {actionSuccess === 'PROFILE_REJECTED' && 'Profile Update Rejected'}
            </h4>
            <p className="text-xs mt-1">Audit log updated. Email notifications sent to enterprise. Redirecting...</p>
          </div>
        </div>
      )}

      {hasPendingChange && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-start space-x-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-xs text-amber-800 uppercase tracking-wider">Pending Profile Update Request</h4>
            <p className="text-xs text-amber-700 mt-1">
              This company has requested changes to their official business profile details. Review the changes highlighted in yellow below before approving.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Company Data details */}
        <div className="lg:col-span-2 space-y-6">
          
          {hasPendingChange ? (
            /* Side-by-side profile changes detail card */
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Profile Update Comparison</h2>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded border uppercase text-amber-800 bg-amber-50 border-amber-200 animate-pulse">
                  Change Request Pending
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-150">
                {/* Current Details Column */}
                <div className="space-y-4">
                  <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider pb-1">Current Registered Profile</h3>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Company Name</p>
                    <p className="font-semibold text-slate-800 text-xs bg-slate-50 px-2 py-1.5 rounded mt-0.5">{company.name}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">GSTIN Number</p>
                    <p className="font-mono font-semibold text-slate-800 text-xs bg-slate-50 px-2 py-1.5 rounded mt-0.5">{company.gstNumber}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Company Type</p>
                      <p className="font-semibold text-slate-800 text-xs bg-slate-50 px-2 py-1.5 rounded mt-0.5 uppercase">{company.companyType}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Marketplace Role</p>
                      <p className="font-semibold text-slate-800 text-xs bg-slate-50 px-2 py-1.5 rounded mt-0.5 uppercase">{company.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Person</p>
                      <p className="font-semibold text-slate-800 text-xs bg-slate-50 px-2 py-1.5 rounded mt-0.5">{company.contactPersonName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                      <p className="font-semibold text-slate-800 text-xs bg-slate-50 px-2 py-1.5 rounded mt-0.5">{company.contactPhone}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Email</p>
                    <p className="font-semibold text-slate-800 text-xs bg-slate-50 px-2 py-1.5 rounded mt-0.5 break-all">{company.contactEmail}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">City Hub</p>
                      <p className="font-semibold text-slate-800 text-xs bg-slate-50 px-2 py-1.5 rounded mt-0.5">{company.city}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">State Hub</p>
                      <p className="font-semibold text-slate-800 text-xs bg-slate-50 px-2 py-1.5 rounded mt-0.5">{company.state}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Factory / Office Address</p>
                    <p className="text-slate-800 text-xs bg-slate-50 px-2 py-1.5 rounded mt-0.5 whitespace-pre-line">{company.address}</p>
                  </div>
                </div>

                {/* Proposed Changes Column */}
                <div className="space-y-4 md:pl-6 pt-4 md:pt-0">
                  <h3 className="font-bold text-xs text-amber-600 uppercase tracking-wider pb-1">Proposed Profile Changes</h3>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Company Name</p>
                    <p className={`font-semibold text-xs px-2 py-1.5 rounded mt-0.5 border ${
                      isChanged('name', pending.name)
                        ? 'text-amber-800 bg-amber-50/50 border-amber-200 font-bold'
                        : 'text-slate-500 bg-slate-50/20 border-slate-100'
                    }`}>{pending.name}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">GSTIN Number</p>
                    <p className={`font-mono font-semibold text-xs px-2 py-1.5 rounded mt-0.5 border ${
                      isChanged('gstNumber', pending.gstNumber)
                        ? 'text-amber-800 bg-amber-50/50 border-amber-200 font-bold'
                        : 'text-slate-500 bg-slate-50/20 border-slate-100'
                    }`}>{pending.gstNumber}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Company Type</p>
                      <p className={`font-semibold text-xs px-2 py-1.5 rounded mt-0.5 border uppercase ${
                        isChanged('companyType', pending.companyType)
                          ? 'text-amber-800 bg-amber-50/50 border-amber-200 font-bold'
                          : 'text-slate-500 bg-slate-50/20 border-slate-100'
                      }`}>{pending.companyType}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Marketplace Role</p>
                      <p className={`font-semibold text-xs px-2 py-1.5 rounded mt-0.5 border uppercase ${
                        isChanged('role', pending.role)
                          ? 'text-amber-800 bg-amber-50/50 border-amber-200 font-bold'
                          : 'text-slate-500 bg-slate-50/20 border-slate-100'
                      }`}>{pending.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Person</p>
                      <p className={`font-semibold text-xs px-2 py-1.5 rounded mt-0.5 border ${
                        isChanged('contactPersonName', pending.contactPersonName)
                          ? 'text-amber-800 bg-amber-50/50 border-amber-200 font-bold'
                          : 'text-slate-500 bg-slate-50/20 border-slate-100'
                      }`}>{pending.contactPersonName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                      <p className={`font-semibold text-xs px-2 py-1.5 rounded mt-0.5 border ${
                        isChanged('contactPhone', pending.contactPhone)
                          ? 'text-amber-800 bg-amber-50/50 border-amber-200 font-bold'
                          : 'text-slate-500 bg-slate-50/20 border-slate-100'
                      }`}>{pending.contactPhone}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Email</p>
                    <p className={`font-semibold text-xs px-2 py-1.5 rounded mt-0.5 border break-all ${
                      isChanged('contactEmail', pending.contactEmail)
                        ? 'text-amber-800 bg-amber-50/50 border-amber-200 font-bold'
                        : 'text-slate-500 bg-slate-50/20 border-slate-100'
                    }`}>{pending.contactEmail}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">City Hub</p>
                      <p className={`font-semibold text-xs px-2 py-1.5 rounded mt-0.5 border ${
                        isChanged('city', pending.city)
                          ? 'text-amber-800 bg-amber-50/50 border-amber-200 font-bold'
                          : 'text-slate-500 bg-slate-50/20 border-slate-100'
                      }`}>{pending.city}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">State Hub</p>
                      <p className={`font-semibold text-xs px-2 py-1.5 rounded mt-0.5 border ${
                        isChanged('state', pending.state)
                          ? 'text-amber-800 bg-amber-50/50 border-amber-200 font-bold'
                          : 'text-slate-500 bg-slate-50/20 border-slate-100'
                      }`}>{pending.state}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Factory / Office Address</p>
                    <p className={`text-xs px-2 py-1.5 rounded mt-0.5 border whitespace-pre-line leading-relaxed ${
                      isChanged('address', pending.address)
                        ? 'text-amber-800 bg-amber-50/50 border-amber-200 font-bold'
                        : 'text-slate-500 bg-slate-50/20 border-slate-100'
                    }`}>{pending.address}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Standard company information details card */
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Enterprise Information</h2>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase ${
                  company.verificationStatus === 'VERIFIED'
                    ? 'text-blue-800 bg-blue-50 border-blue-200'
                    : company.verificationStatus === 'REJECTED'
                    ? 'text-red-800 bg-red-50 border-red-200'
                    : 'text-amber-800 bg-amber-50 border-amber-200 animate-pulse'
                }`}>
                  {company.verificationStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-slate-600 font-medium">
                <div className="sm:col-span-2 space-y-0.5">
                  <p className="font-bold text-slate-400 uppercase tracking-wider">Registered Enterprise Name</p>
                  <p className="text-sm font-bold text-slate-900 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100">{company.name}</p>
                </div>

                <div className="space-y-0.5">
                  <p className="font-bold text-slate-400 uppercase tracking-wider">Indian GSTIN ID</p>
                  <p className="text-sm font-mono font-bold text-slate-900 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100">{company.gstNumber}</p>
                </div>

                <div className="space-y-0.5">
                  <p className="font-bold text-slate-400 uppercase tracking-wider">Sector Type</p>
                  <p className="text-sm font-bold text-slate-900 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100 uppercase">{company.companyType}</p>
                </div>

                <div className="space-y-0.5">
                  <p className="font-bold text-slate-400 uppercase tracking-wider">Contact Person</p>
                  <p className="text-sm font-bold text-slate-900 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100">{company.contactPersonName}</p>
                </div>

                <div className="space-y-0.5">
                  <p className="font-bold text-slate-400 uppercase tracking-wider">Mobile Number</p>
                  <p className="text-sm font-bold text-slate-900 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100">{company.contactPhone}</p>
                </div>

                <div className="sm:col-span-2 space-y-0.5">
                  <p className="font-bold text-slate-400 uppercase tracking-wider">Contact Email</p>
                  <p className="text-sm font-bold text-slate-900 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100 break-all">{company.contactEmail}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:col-span-2">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-400 uppercase tracking-wider">City Hub</p>
                    <p className="text-sm font-bold text-slate-900 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100">{company.city}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-400 uppercase tracking-wider">State</p>
                    <p className="text-sm font-bold text-slate-900 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100">{company.state}</p>
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-0.5">
                  <p className="font-bold text-slate-400 uppercase tracking-wider">Office Address</p>
                  <p className="text-xs text-slate-700 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100 whitespace-pre-line leading-relaxed">{company.address}</p>
                </div>
              </div>
            </div>
          )}

          {/* Verification documents view frame */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              GST / Registration Document
            </h3>

            {signedDocUrl ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-lg border border-slate-150">
                  <span className="text-xs text-slate-500 font-semibold truncate max-w-[200px] flex items-center space-x-1.5">
                    <FileText className="h-4.5 w-4.5 text-slate-400 flex-shrink-0" />
                    <span>{company.verificationDocUrl}</span>
                  </span>
                  <a
                    href={signedDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-blue-600 hover:text-sky-700 hover:underline flex items-center space-x-0.5"
                  >
                    <span>Open Private File</span>
                    <Clock className="h-3 w-3 text-slate-400 ml-1" title="URL expires in 15m" />
                  </a>
                </div>

                {/* PDF/Image Preview frame */}
                <div className="border border-slate-200 rounded-lg overflow-hidden h-96 bg-slate-100 relative">
                  {company.verificationDocUrl.toLowerCase().endsWith('.pdf') ? (
                    <iframe src={signedDocUrl} className="w-full h-full" title="GST Doc Viewer" />
                  ) : (
                    <img src={signedDocUrl} alt="GST Doc" className="w-full h-full object-contain" />
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-lg border border-slate-200 py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
                <AlertTriangle className="h-8 w-8 text-slate-400" />
                <p className="font-bold text-slate-600">No Verification Document Uploaded</p>
                <p className="text-[10px] text-slate-400">Account submitted details but did not upload GST cert file yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Decisions panel */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Audit Decisions
            </h3>

            {hasPendingChange ? (
              /* Profile Update Audit Actions */
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-250 p-3 rounded-lg text-[11px] text-amber-700 font-semibold mb-2">
                  Verify the proposed profile changes carefully against their uploaded tax documentation before approving.
                </div>

                <button
                  onClick={handleApproveProfileUpdate}
                  disabled={submittingAction || actionSuccess !== null}
                  className="w-full bg-brand-green hover:bg-emerald-600 text-white font-bold py-3 rounded-lg text-xs transition-colors flex items-center justify-center space-x-1.5 shadow"
                >
                  {submittingAction && actionSuccess === 'PROFILE_APPROVED' ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4.5 w-4.5" />
                  )}
                  <span>Approve Profile Update</span>
                </button>

                <button
                  onClick={() => triggerReject('PROFILE_UPDATE')}
                  disabled={submittingAction || actionSuccess !== null}
                  className="w-full border border-red-200 text-red-500 hover:bg-red-50 font-bold py-3 rounded-lg text-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <XCircle className="h-4.5 w-4.5" />
                  <span>Reject Profile Update</span>
                </button>
              </div>
            ) : company.verificationStatus === 'PENDING' ? (
              /* Standard Company Application Audit Actions */
              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  disabled={submittingAction || actionSuccess !== null}
                  className="w-full bg-brand-green hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-xs transition-colors flex items-center justify-center space-x-1.5 shadow"
                >
                  {submittingAction && actionSuccess === 'APPROVED' ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4.5 w-4.5" />
                  )}
                  <span>Approve & Verify Company</span>
                </button>

                <button
                  onClick={() => triggerReject('REGISTRATION')}
                  disabled={submittingAction || actionSuccess !== null}
                  className="w-full border border-red-200 text-red-500 hover:bg-red-50 font-bold py-3 rounded-lg text-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <XCircle className="h-4.5 w-4.5" />
                  <span>Reject Application</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-xs text-slate-500 space-y-2.5 text-center">
                <ShieldCheck className="h-6 w-6 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700">Audit Completed</p>
                <p className="text-[10px] text-slate-400">
                  This company has already been processed and is in status: <strong>{company.verificationStatus}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                <XCircle className="h-4.5 w-4.5 text-red-500" />
                <span>Specify Rejection Reason</span>
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Provide feedback to the company so they can correct their details and resubmit.
              </p>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rejection Reason</label>
                <textarea
                  rows={4}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={actionType === 'PROFILE_UPDATE' ? "e.g. The GSTIN change does not match your uploaded documents. Please enter the correct number." : "e.g. The uploaded GST document is cropped / illegible. Please upload REG-06 page 1 & 2 fully."}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-red-500 focus:outline-none rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end space-x-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1 disabled:opacity-50"
                >
                  {submittingAction ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Rejection</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyReviewDetail;
