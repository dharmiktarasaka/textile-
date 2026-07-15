import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Package, Layers, Image as ImageIcon } from 'lucide-react';
import adminApiClient, { BACKEND_BASE } from '../api/apiClient';

const ListingApprovals = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await adminApiClient.get('/admin/pending-listings');
      setListings(res.data.listings || []);
    } catch (err) {
      console.error('Failed to load pending listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this product? It will go live and buyers will be notified.')) return;
    setActionLoading(id + '_approve');
    try {
      await adminApiClient.post(`/admin/listings/${id}/approve`);
      fetchPending();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('Please provide a reason');
      return;
    }
    setActionLoading(rejectModal.id + '_reject');
    try {
      await adminApiClient.post(`/admin/listings/${rejectModal.id}/reject`, { reason: rejectReason });
      setRejectModal(null);
      setRejectReason('');
      fetchPending();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Product Approvals</h1>
        <p className="text-xs text-slate-500 mt-1">Review and approve new products submitted by sellers before they go live.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] bg-white rounded-xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center space-y-4">
          <Package className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Pending Approvals</h3>
          <p className="text-slate-400 text-xs">All submitted products have been reviewed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {listings.map((item) => (
            <div key={item._id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row">
              {/* Product Info */}
              <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{item.title}</h2>
                    <span className="text-[10px] font-bold text-sky-600 uppercase bg-sky-50 px-2 py-0.5 rounded border border-sky-100 inline-block mt-1">
                      {item.categoryId?.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase">
                    Pending
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Seller</p>
                    <p className="text-xs font-semibold text-slate-700">{item.companyId?.name}</p>
                    <p className="text-[10px] text-slate-500">{item.companyId?.contactEmail}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Location</p>
                    <p className="text-xs font-semibold text-slate-700">{item.fields?.location || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Submitted Parameters</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4">
                    {Object.entries(item.fields).map(([k, v]) => {
                      if (k === 'location') return null;
                      return (
                        <div key={k}>
                          <span className="block text-[9px] text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="block text-[11px] font-semibold text-slate-800 break-words">
                            {Array.isArray(v) ? v.join(', ') : (v || 'N/A')}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Photos & Actions */}
              <div className="w-full lg:w-80 p-6 flex flex-col justify-between bg-slate-50">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center space-x-1.5">
                    <ImageIcon className="h-4 w-4 text-sky-500" />
                    <span>Attached Photos ({item.photoUrls?.length})</span>
                  </h3>
                  {item.photoUrls && item.photoUrls.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {item.photoUrls.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white group">
                          <img 
                            src={url.startsWith('http') ? url : `${BACKEND_BASE}/uploads/${url}`} 
                            alt={`Photo ${i+1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <a 
                            href={url.startsWith('http') ? url : `${BACKEND_BASE}/uploads/${url}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold"
                          >
                            View Full
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 bg-slate-100 p-4 rounded-lg text-center mb-6">
                      No photos attached
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setRejectModal({ id: item._id, title: item.title })}
                    disabled={!!actionLoading}
                    className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleApprove(item._id)}
                    disabled={!!actionLoading}
                    className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-sky-500 border border-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-600 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {actionLoading === item._id + '_approve' ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-slate-100 bg-red-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-red-800">Reject Product</h3>
                <p className="text-[10px] text-red-600 truncate max-w-[250px]">{rejectModal.title}</p>
              </div>
              <button onClick={() => setRejectModal(null)} className="text-red-400 hover:text-red-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleRejectSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-2">Reason for rejection *</label>
                <textarea
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Photos are blurry or product details are missing..."
                  className="w-full border border-slate-200 rounded-lg p-3 text-xs min-h-[100px] focus:border-red-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!actionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingApprovals;
