import React, { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, User, Check, X, Clock, HelpCircle, Inbox, Send, AlertTriangle } from 'lucide-react';
import apiClient from '../api/apiClient';

const ContactRequests = () => {
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/contact-requests/me');
      setSentRequests(res.data.sent);
      setReceivedRequests(res.data.received);
    } catch (err) {
      console.error('Failed to load contact requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleResponse = async (id, status) => {
    const actionLabel = status === 'ACCEPTED' ? 'Accept' : 'Decline';
    if (!window.confirm(`Are you sure you want to ${actionLabel} this request?`)) return;
    
    setActionLoading(id);
    try {
      await apiClient.patch(`/contact-requests/${id}`, { status });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update request');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 font-sans">Contact Requests</h1>
        <p className="text-xs text-slate-500 mt-1">Manage B2B connection permits. Contact details are shared only when request is Accepted.</p>
      </div>

      {/* Tabs selectors */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex items-center space-x-2 px-6 py-3.5 text-xs font-bold transition-all border-b-2 uppercase tracking-wider ${
            activeTab === 'received'
              ? 'border-sky-500 text-sky-600 bg-blue-50/10'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Inbox className="h-4 w-4" />
          <span>Received Requests ({receivedRequests.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex items-center space-x-2 px-6 py-3.5 text-xs font-bold transition-all border-b-2 uppercase tracking-wider ${
            activeTab === 'sent'
              ? 'border-sky-500 text-sky-600 bg-blue-50/10'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Send className="h-4 w-4" />
          <span>Sent Enquiries ({sentRequests.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {activeTab === 'received' ? (
            /* RECEIVED REQUESTS PANEL */
            receivedRequests.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-500 text-xs shadow-sm max-w-xl mx-auto">
                <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold">No inquiries received.</p>
                <p className="text-slate-400 mt-1">When other companies request contact for your listings, they will show here.</p>
              </div>
            ) : (
              receivedRequests.map((reqItem) => (
                <div key={reqItem._id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 hover:shadow transition-shadow">
                  {/* Left Side: Listing detail & buyer request message */}
                  <div className="space-y-4 flex-1">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">For Listing:</p>
                      <h3 className="font-bold text-sm text-navy-900 leading-snug">{reqItem.listingId?.title}</h3>
                    </div>

                    <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 bg-navy-100 rounded-full flex items-center justify-center font-bold text-navy-800 text-[10px]">
                          {reqItem.buyerCompanyId?.name?.charAt(0)}
                        </div>
                        <p className="text-xs font-bold text-navy-900">{reqItem.buyerCompanyId?.name}</p>
                      </div>

                      {reqItem.message && (
                        <p className="text-xs text-slate-600 font-medium italic border-l-2 border-slate-300 pl-3">
                          "{reqItem.message}"
                        </p>
                      )}
                    </div>

                    {/* Shared Info (Visible only if accepted) */}
                    {reqItem.status === 'ACCEPTED' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-blue-50/20 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-center space-x-2.5">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-navy-900 font-medium">{reqItem.buyerCompanyId?.contactPersonName} (Buyer)</span>
                        </div>
                        <div className="flex items-center space-x-2.5">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <a href={`tel:${reqItem.buyerCompanyId?.contactPhone}`} className="text-navy-900 hover:text-sky-600 font-bold">
                            {reqItem.buyerCompanyId?.contactPhone}
                          </a>
                        </div>
                        <div className="flex items-center space-x-2.5">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <a href={`mailto:${reqItem.buyerCompanyId?.contactEmail}`} className="text-navy-900 hover:text-sky-600 font-bold break-all">
                            {reqItem.buyerCompanyId?.contactEmail}
                          </a>
                        </div>
                        <div className="flex items-center space-x-2.5">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600 truncate">{reqItem.buyerCompanyId?.city}, {reqItem.buyerCompanyId?.state}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Status or Action triggers */}
                  <div className="flex flex-row md:flex-col items-center justify-end gap-3 self-center">
                    {reqItem.status === 'REQUESTED' ? (
                      <>
                        <button
                          onClick={() => handleResponse(reqItem._id, 'ACCEPTED')}
                          disabled={actionLoading !== null}
                          className="bg-sky-500 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center space-x-1 shadow shadow-brand-primary/20"
                        >
                          <Check className="h-4 w-4" />
                          <span>Accept Request</span>
                        </button>
                        <button
                          onClick={() => handleResponse(reqItem._id, 'DECLINED')}
                          disabled={actionLoading !== null}
                          className="border border-slate-200 hover:bg-slate-50 text-red-500 font-semibold px-4 py-2 rounded-lg text-xs flex items-center space-x-1"
                        >
                          <X className="h-4 w-4" />
                          <span>Decline</span>
                        </button>
                      </>
                    ) : reqItem.status === 'ACCEPTED' ? (
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full uppercase flex items-center space-x-1">
                        <Check className="h-3.5 w-3.5" />
                        <span>Accepted</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-800 bg-red-50 border border-red-200 px-3 py-1 rounded-full uppercase flex items-center space-x-1">
                        <X className="h-3.5 w-3.5" />
                        <span>Declined</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )
          ) : (
            /* SENT REQUESTS PANEL */
            sentRequests.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-500 text-xs shadow-sm max-w-xl mx-auto">
                <Send className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold">No sent inquiries.</p>
                <p className="text-slate-400 mt-1">Browse marketplace listings and request contact details to initiate trades.</p>
              </div>
            ) : (
              sentRequests.map((reqItem) => (
                <div key={reqItem._id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 hover:shadow transition-shadow">
                  {/* Left Side: listing detail & contact if unlocked */}
                  <div className="space-y-4 flex-1">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">For Seller Listing:</p>
                      <h3 className="font-bold text-sm text-navy-900 leading-snug">{reqItem.listingId?.title}</h3>
                    </div>

                    <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-2 text-xs">
                      <p className="font-bold text-slate-700">Seller Enterprise: {reqItem.sellerCompanyId?.name}</p>
                      {reqItem.message && (
                        <p className="text-slate-500 italic">"Your Message: {reqItem.message}"</p>
                      )}
                    </div>

                    {/* Shared Info (Unlocked if Accepted) */}
                    {reqItem.status === 'ACCEPTED' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-blue-50/20 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-center space-x-2.5">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-navy-900 font-medium">{reqItem.sellerCompanyId?.contactPersonName} (Seller)</span>
                        </div>
                        <div className="flex items-center space-x-2.5">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <a href={`tel:${reqItem.sellerCompanyId?.contactPhone}`} className="text-navy-900 hover:text-sky-600 font-bold">
                            {reqItem.sellerCompanyId?.contactPhone}
                          </a>
                        </div>
                        <div className="flex items-center space-x-2.5">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <a href={`mailto:${reqItem.sellerCompanyId?.contactEmail}`} className="text-navy-900 hover:text-sky-600 font-bold break-all">
                            {reqItem.sellerCompanyId?.contactEmail}
                          </a>
                        </div>
                        <div className="flex items-center space-x-2.5">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600 truncate">{reqItem.sellerCompanyId?.city}, {reqItem.sellerCompanyId?.state}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[10px] text-slate-400 flex items-center space-x-2.5">
                        <AlertTriangle className="h-4.5 w-4.5 text-slate-400" />
                        <span>Seller contact credentials remain gated until they approve your inquiry.</span>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Status badge */}
                  <div className="self-center">
                    {reqItem.status === 'REQUESTED' ? (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full uppercase flex items-center space-x-1">
                        <Clock className="h-3.5 w-3.5 animate-pulse text-amber-500" />
                        <span>Requested</span>
                      </span>
                    ) : reqItem.status === 'ACCEPTED' ? (
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full uppercase flex items-center space-x-1">
                        <Check className="h-3.5 w-3.5 text-blue-500" />
                        <span>Accepted</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-800 bg-red-50 border border-red-200 px-3 py-1 rounded-full uppercase flex items-center space-x-1">
                        <X className="h-3.5 w-3.5 text-red-500" />
                        <span>Declined</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            ))}
          </div>
        )}
      </div>
  );
};

export default ContactRequests;
