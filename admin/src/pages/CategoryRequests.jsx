import React, { useEffect, useState } from 'react';
import {
  Lightbulb, CheckCircle2, XCircle, Clock, RefreshCw,
  AlertCircle, Loader2, Building, ChevronRight,
} from 'lucide-react';
import adminApiClient from '../api/apiClient';

const STATUS_BADGE = {
  PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  APPROVED: { label: 'Approved', cls: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-400' },
};

const CategoryRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // { id, name }
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await adminApiClient.get(`/admin/category-requests?status=${filter}`);
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('Failed to load category requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [filter]);

  const handleApprove = async (id, name) => {
    setActionLoading(id + '_approve');
    try {
      await adminApiClient.post(`/admin/category-requests/${id}/approve`);
      showToast(`✅ Category "${name}" approved and is now live on the marketplace!`);
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Approval failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id + '_reject');
    try {
      await adminApiClient.post(`/admin/category-requests/${rejectModal.id}/reject`, {
        reason: rejectReason || 'Does not meet marketplace category guidelines.',
      });
      showToast(`Category "${rejectModal.name}" request rejected.`, 'error');
      setRejectModal(null);
      setRejectReason('');
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Rejection failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const counts = {
    PENDING: requests.length,
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center space-x-2 px-5 py-3 rounded-xl shadow-xl border text-sm font-semibold animate-fade-in ${
          toast.type === 'error'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-sky-50 text-sky-700 border-sky-200'
        }`}>
          {toast.type === 'error'
            ? <XCircle className="h-4 w-4" />
            : <CheckCircle2 className="h-4 w-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Lightbulb className="h-6 w-6 text-amber-500" />
            <span>Category Requests</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review new category suggestions submitted by verified sellers. Approved categories go live immediately.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-sky-600 border border-slate-200 hover:border-sky-300 px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-0">
        {['PENDING', 'APPROVED', 'REJECTED'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              filter === s
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Lightbulb className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">No {filter.toLowerCase()} category requests</p>
          <p className="text-xs text-slate-400 mt-1">When sellers suggest new categories, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const badge = STATUS_BADGE[req.status] || STATUS_BADGE.PENDING;
            return (
              <div
                key={req._id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h3 className="font-bold text-sm text-slate-900">{req.name}</h3>
                        <span className={`inline-flex items-center space-x-1 text-[9px] font-bold border px-2 py-0.5 rounded-full ${badge.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          <span>{badge.label}</span>
                        </span>
                      </div>
                      {req.description && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{req.description}</p>
                      )}
                      <div className="flex items-center space-x-3 mt-2 text-[10px] text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Building className="h-3 w-3" />
                          <span>{req.suggestedBy?.name}</span>
                        </span>
                        <span>{req.suggestedBy?.city}, {req.suggestedBy?.state}</span>
                        <span>{new Date(req.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                      {req.status === 'REJECTED' && req.rejectionReason && (
                        <div className="mt-2 flex items-start space-x-1.5 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                          <AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-[10px] text-red-600">{req.rejectionReason}</p>
                        </div>
                      )}
                      {req.status === 'APPROVED' && req.approvedCategoryId && (
                        <div className="mt-2 flex items-center space-x-1.5 bg-sky-50 border border-sky-100 px-3 py-2 rounded-lg">
                          <CheckCircle2 className="h-3 w-3 text-sky-500" />
                          <p className="text-[10px] text-sky-700 font-semibold">
                            Category "{req.approvedCategoryId.name}" is now live on the marketplace.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions — only for pending */}
                  {req.status === 'PENDING' && (
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(req._id, req.name)}
                        disabled={!!actionLoading}
                        className="flex items-center space-x-1.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                      >
                        {actionLoading === req._id + '_approve' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => { setRejectModal({ id: req._id, name: req.name }); setRejectReason(''); }}
                        disabled={!!actionLoading}
                        className="flex items-center space-x-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 m-4">
            <div className="flex items-center space-x-2 mb-4">
              <XCircle className="h-5 w-5 text-red-500" />
              <h3 className="font-bold text-slate-900 text-sm">Reject Category Request</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Rejecting <span className="font-semibold text-slate-700">"{rejectModal.name}"</span>. The seller will be notified with your reason.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional, defaults to 'Does not meet marketplace category guidelines.')"
              className="w-full px-3 py-2 border border-slate-200 focus:border-red-400 focus:outline-none rounded-lg text-xs resize-none mb-4"
            />
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!!actionLoading}
                className="flex items-center space-x-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                {actionLoading === rejectModal.id + '_reject' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryRequests;
