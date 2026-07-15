import React, { useState } from 'react';
import { User, Building, MapPin, Phone, Mail, ShieldCheck, Edit, Save, X, AlertTriangle, Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import apiClient from '../api/apiClient';

const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
const phoneRegex = /^[6-9]\d{9}$/;

const Profile = () => {
  const { user, fetchMe } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Editable Form states
  const [name, setName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [role, setRole] = useState('');

  const hasPendingChange = user?.pendingProfileUpdate?.hasPendingChange;

  const startEditing = () => {
    if (hasPendingChange) return;
    setError(null);
    setSuccessMsg(null);
    setName(user?.name || '');
    setGstNumber(user?.gstNumber || '');
    setCompanyType(user?.companyType || 'OTHER');
    setContactPersonName(user?.contactPersonName || '');
    setContactPhone(user?.contactPhone || '');
    setContactEmail(user?.contactEmail || '');
    setAddress(user?.address || '');
    setCity(user?.city || '');
    setState(user?.state || '');
    setRole(user?.role || 'BOTH');
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Front-end validations
    if (!name.trim()) return setError('Company name is required');
    if (!gstNumber.trim()) return setError('GST number is required');
    // Only validate GST format if it is actually changed
    if (gstNumber.toUpperCase().trim() !== (user?.gstNumber || '').toUpperCase().trim()) {
      if (!gstRegex.test(gstNumber.toUpperCase().trim())) {
        return setError('Invalid Indian GSTIN format (15 characters, e.g. 24AAAAC1234A1Z1)');
      }
    }
    if (!contactPersonName.trim()) return setError('Contact person name is required');
    if (!contactPhone.trim()) return setError('Contact phone number is required');
    if (!phoneRegex.test(contactPhone.trim())) {
      return setError('Invalid contact phone (must be a 10-digit number starting with 6-9)');
    }
    if (!contactEmail.trim()) return setError('Contact email address is required');
    if (!address.trim()) return setError('Factory / Office address is required');
    if (!city.trim()) return setError('City hub is required');
    if (!state.trim()) return setError('State hub is required');

    setSubmitting(true);
    try {
      const res = await apiClient.patch('/company/request-profile-update', {
        name,
        gstNumber: gstNumber.toUpperCase().trim(),
        companyType,
        contactPersonName,
        contactPhone,
        contactEmail: contactEmail.toLowerCase().trim(),
        address,
        city,
        state,
        role
      });

      setSuccessMsg(res.data.message || 'Profile update requested successfully! Under review by administrators.');
      setIsEditing(false);
      
      // Refresh current user info in state
      await fetchMe();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit profile update request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 font-sans">Company Profile Settings</h1>
          <p className="text-xs text-slate-500 mt-1">Review your registered enterprise parameters, GST record IDs, and verification states.</p>
        </div>

        {!isEditing && !hasPendingChange && (
          <button
            onClick={startEditing}
            className="flex items-center space-x-2 bg-sky-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-sm shadow-sky-500/10"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {hasPendingChange && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-start space-x-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-xs text-amber-800 uppercase tracking-wider">Profile Update Request Under Review</h4>
            <p className="text-xs text-amber-700 mt-1">
              You have submitted profile changes (such as name or GST update) which are currently being reviewed by our administrative team. 
              Further edits are restricted until the current changes are verified.
            </p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg text-xs text-emerald-800 font-semibold shadow-sm">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg text-xs text-red-800 font-semibold shadow-sm flex items-center space-x-2">
          <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Card: Summary & status */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center space-y-4 md:col-span-1 h-fit">
          <div className="h-20 w-20 bg-sky-500 rounded-2xl flex items-center justify-center font-bold text-white text-3xl shadow-lg shadow-sky-500/10">
            {user?.name?.charAt(0)}
          </div>
          
          <div className="text-center space-y-1">
            <h3 className="font-bold text-lg text-navy-900">{user?.name}</h3>
            <span className="text-[10px] font-bold text-sky-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              {user?.companyType}
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 w-full text-center">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-flex items-center space-x-1.5 justify-center w-full">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
              <span>{user?.verificationStatus === 'VERIFIED' ? 'Verified Enterprise' : 'Pending Verification'}</span>
            </span>
            {user?.verifiedAt && (
              <p className="text-[10px] text-slate-400 mt-2 font-medium">
                Verified on: {new Date(user.verifiedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Right Columns: Fields details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm md:col-span-2 space-y-6">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center space-x-1.5">
            <Building className="h-4.5 w-4.5 text-sky-600" />
            <span>Business Identifiers</span>
          </h3>

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Company Registered Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50"
                  />
                </div>

                {/* GST */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50 uppercase"
                  />
                </div>

                {/* Segment */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Company Segment</label>
                  <select
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50"
                  >
                    <option value="MILL">Mill (Generates waste)</option>
                    <option value="TRADER">Trader (Buys/Sells)</option>
                    <option value="RECYCLER">Recycler (Consumes waste)</option>
                    <option value="EXPORTER">Exporter (Bulk shipments)</option>
                    <option value="OTHER">Other Business</option>
                  </select>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Marketplace Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50"
                  >
                    <option value="BOTH">Both (Buy & Sell)</option>
                    <option value="SELLER">Seller Only</option>
                    <option value="BUYER">Buyer Only</option>
                  </select>
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    value={contactPersonName}
                    onChange={(e) => setContactPersonName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50"
                  />
                </div>

                {/* Email */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Corporate Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">City Hub</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">State Hub</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Factory / Office Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none bg-slate-50"
                />
              </div>

              {/* Actions CTAs */}
              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{submitting ? 'Submitting request...' : 'Submit Changes'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={submitting}
                  className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2 rounded-lg transition-all"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              {/* GST */}
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">GSTIN Number</p>
                <p className="font-semibold text-navy-900 text-sm bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  {user?.gstNumber}
                </p>
              </div>

              {/* Sector */}
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">Company Type</p>
                <p className="font-semibold text-navy-900 text-sm bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 uppercase">
                  {user?.companyType}
                </p>
              </div>

              {/* Contact Person */}
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Person Name</p>
                <p className="font-semibold text-navy-900 text-sm bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  {user?.contactPersonName}
                </p>
              </div>

              {/* Contact Phone */}
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Phone</p>
                <p className="font-semibold text-navy-900 text-sm bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  {user?.contactPhone}
                </p>
              </div>

              {/* Contact Email */}
              <div className="sm:col-span-2">
                <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">Corporate Contact Email</p>
                <p className="font-semibold text-navy-900 text-sm bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 break-all">
                  {user?.contactEmail}
                </p>
              </div>

              {/* Hub Details */}
              <div className="grid grid-cols-2 gap-4 sm:col-span-2">
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">City Hub</p>
                  <p className="font-semibold text-navy-900 text-sm bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    {user?.city}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">State Hub</p>
                  <p className="font-semibold text-navy-900 text-sm bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    {user?.state}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">Factory / Office Address</p>
                <p className="font-semibold text-navy-900 text-sm bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  {user?.address}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
