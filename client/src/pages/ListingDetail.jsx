import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Building,
  User,
  Phone,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Send,
  Loader2,
  FileText,
  Bookmark,
  CheckCircle2,
  ArrowLeft,
  XCircle,
  Star,
  MessageSquare,
  Copy
} from 'lucide-react';
import apiClient, { BACKEND_BASE } from '../api/apiClient';
import useAuthStore from '../store/authStore';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [listing, setListing] = useState(null);
  const [contactAccess, setContactAccess] = useState('NONE'); // NONE, REQUESTED (PENDING), ACCEPTED, DECLINED, OWNER
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gated request modal states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState('overview'); // overview, photos, reviews, contact

  // Reviews states
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  
  // Image Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Reveal phone number state
  const [isRevealed, setIsRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchListingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/listings/${id}`);
      setListing(res.data.listing);
      setContactAccess(res.data.contactAccess);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load listing details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const res = await apiClient.get(`/reviews/listing/${id}`);
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchListingDetails();
    fetchReviews();
  }, [id]);

  const handleRequestContactSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRequest(true);
    try {
      await apiClient.post('/contact-requests', {
        listingId: listing._id,
        message: requestMessage,
      });

      setRequestSuccess(true);
      setContactAccess('REQUESTED');
      setTimeout(() => {
        setShowRequestModal(false);
        fetchListingDetails();
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit contact request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingReview(true);
    try {
      await apiClient.post('/reviews', {
        listingId: id,
        rating: newRating,
        comment: newComment,
      });
      setNewComment('');
      setNewRating(5);
      fetchReviews();
      fetchListingDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-4">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="font-bold text-navy-900 text-lg">Error Loading Listing</h3>
        <p className="text-slate-500 text-xs">{error || 'The requested listing does not exist or you do not have permission to view it.'}</p>
        <Link to="/marketplace" className="inline-block bg-brand-primary text-white px-4 py-2 rounded-lg text-xs font-bold">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const isOwner = contactAccess === 'OWNER';

  const renderStars = (rating) => {
    const stars = [];
    const floor = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= floor) {
        stars.push(<Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />);
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-slate-300" />);
      }
    }
    return stars;
  };

  return (
    <div className="space-y-6">
      {/* Back to Marketplace */}
      <div>
        <Link to="/marketplace" className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-navy-900 font-semibold mb-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Textile Directory</span>
        </Link>
      </div>

      {/* E-commerce Style Product Section (Above the fold) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column: Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              {listing.photoUrls && listing.photoUrls.length > 0 ? (
                <img
                  src={listing.photoUrls[activeImageIndex].startsWith('http') ? listing.photoUrls[activeImageIndex] : `${BACKEND_BASE}/uploads/${listing.photoUrls[activeImageIndex]}`}
                  alt={listing.title}
                  className="w-full h-full object-contain bg-white"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold bg-slate-100">
                  No Photo Available
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {listing.photoUrls && listing.photoUrls.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {listing.photoUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx ? 'border-sky-500 opacity-100 shadow-sm' : 'border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url.startsWith('http') ? url : `${BACKEND_BASE}/uploads/${url}`} className="w-full h-full object-cover bg-white" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details & Buy Box */}
          <div className="flex flex-col space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-sky-600 uppercase bg-sky-50 px-2.5 py-1 rounded border border-sky-100">
                  {listing.categoryId?.name}
                </span>
                <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Verified Supplier</span>
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-extrabold text-navy-900 leading-tight">{listing.title}</h1>
              
              <div className="flex items-center space-x-2 text-sm pb-4 border-b border-slate-100">
                <span className="font-bold text-slate-800">{listing.ratingAvg ? listing.ratingAvg.toFixed(1) : '0.0'}</span>
                <div className="flex items-center">
                  {renderStars(listing.ratingAvg || 0)}
                </div>
                <span className="text-sky-600 hover:underline cursor-pointer font-medium" onClick={() => setActiveTab('reviews')}>
                  {listing.reviewCount || 0} customer reviews
                </span>
              </div>
            </div>

            {/* Price & Quantity Buy Box */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-5">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Price</p>
                  <p className="text-3xl font-black text-navy-900">
                    {listing.fields?.priceExpectationPerKg ? `₹${listing.fields.priceExpectationPerKg}` : 'Negotiable'}
                    {listing.fields?.priceExpectationPerKg && <span className="text-sm text-slate-500 font-bold"> / KG</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Available Qty</p>
                  <p className="text-xl font-bold text-sky-600">{listing.fields?.quantityKg || 'N/A'} KG</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-200">
                {!token ? (
                  <button
                    onClick={() => navigate('/login', { state: { from: `/listings/${id}` } })}
                    className="w-full bg-brand-primary hover:bg-sky-600 text-white font-bold py-4 rounded-lg text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                  >
                    <Phone className="h-4.5 w-4.5" />
                    <span>Login to See Seller Contact Details</span>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold uppercase tracking-wider">Contact Person</span>
                        <span className="font-bold text-navy-900">{listing.companyId?.contactPersonName || 'B2B Supplier'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-2 border-t border-sky-100/50">
                        <span className="text-slate-400 font-semibold uppercase tracking-wider">Phone Number</span>
                        {isRevealed ? (
                          <div className="flex items-center space-x-1.5">
                            <a href={`tel:${listing.companyId?.contactPhone}`} className="font-extrabold text-sky-600 hover:underline select-all">
                              {listing.companyId?.contactPhone || 'N/A'}
                            </a>
                            {listing.companyId?.contactPhone && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(listing.companyId.contactPhone);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-slate-100 transition-all flex items-center justify-center"
                                title="Copy to clipboard"
                              >
                                {copied ? (
                                  <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">Copied!</span>
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-slate-400 select-none">
                            {listing.companyId?.contactPhone ? `${listing.companyId.contactPhone.substring(0, 4)}••••••••` : '••••••••••'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex w-full">
                      {!isRevealed ? (
                        <button
                          onClick={() => setIsRevealed(true)}
                          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3.5 rounded-lg text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                        >
                          <Phone className="h-4 w-4" />
                          <span>Reveal Number</span>
                        </button>
                      ) : (
                        <a
                          href={`tel:${listing.companyId?.contactPhone}`}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-lg text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-sm text-center animate-fade-in"
                        >
                          <Phone className="h-4 w-4" />
                          <span>Call: {listing.companyId?.contactPhone || 'N/A'}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* High-level specs summary */}
            <div className="space-y-3 flex-1">
              <h3 className="font-bold text-sm text-slate-800">Quick Specifications:</h3>
              <ul className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                {Object.entries(listing.fields || {}).map(([key, val]) => {
                  if (['priceExpectationPerKg', 'quantityKg', 'location'].includes(key)) return null;
                  const displayLabel = key.replace(/([A-Z])/g, ' $1');
                  const displayVal = Array.isArray(val) ? val.join(', ') : val.toString();
                  return (
                    <li key={key} className="flex items-start">
                      <span className="w-4 h-4 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center mr-2 mt-0 flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-sky-500" />
                      </span>
                      <span className="text-slate-600 capitalize">
                        <span className="font-semibold text-slate-700">{displayLabel}:</span> {displayVal.replace('_', ' ')}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Seller info footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500">
              <div className="flex items-center space-x-2">
                <Building className="h-4.5 w-4.5 text-slate-400" />
                <span className="font-bold text-slate-700 uppercase tracking-wide">{listing.companyId?.name}</span>
              </div>
              <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-6">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{listing.fields?.location || listing.companyId?.city}, {listing.companyId?.state}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-t border-slate-100 pt-4 gap-4 overflow-x-auto">
          {[
            { id: 'overview', label: 'Company Overview & Specs' },
            { id: 'reviews', label: `Reviews & Ratings (${reviews.length})` },
            { id: 'contact', label: 'Seller Details (Gated)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-600 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-navy-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Tab Panel Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="font-bold text-sm text-navy-900 border-b border-slate-100 pb-2 mb-4">Material Specifications</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <tbody>
                      {Object.entries(listing.fields || {}).map(([key, val]) => {
                        if (['location'].includes(key)) return null;
                        const displayLabel = key.replace(/([A-Z])/g, ' $1');
                        const displayVal = Array.isArray(val) ? val.join(', ') : val.toString();
                        return (
                          <tr key={key} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="py-3 font-semibold text-slate-500 w-1/3 capitalize">{displayLabel}</td>
                            <td className="py-3 font-medium text-navy-900 uppercase">{displayVal.replace('_', ' ')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Review submit form */}
              {!isOwner && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-navy-900 border-b border-slate-100 pb-2">Rate this Supplier</h3>
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-semibold text-slate-500">Your Rating:</span>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((starsCount) => (
                          <button
                            key={starsCount}
                            type="button"
                            onClick={() => setNewRating(starsCount)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                starsCount <= newRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <textarea
                        rows={3}
                        required
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a feedback review about product quality, pricing, or communication experience..."
                        className="w-full px-3 py-2 border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg text-xs"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="bg-brand-primary hover:bg-navy-800 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        {submittingReview ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Posting...</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Submit Review</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Reviews list */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-navy-900 border-b border-slate-100 pb-2">Customer Feedback</h3>
                
                {loadingReviews ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No written reviews listed yet. Submit the first review above!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {reviews.map((rev) => (
                      <div key={rev._id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-xs text-navy-900">{rev.reviewerName}</p>
                            <p className="text-[9px] text-slate-400">
                              {rev.reviewerCompanyId?.city || 'Verified Buyer'}, {rev.reviewerCompanyId?.state || ''}
                            </p>
                          </div>
                          <div className="flex items-center">
                            {renderStars(rev.rating)}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed italic">
                          "{rev.comment}"
                        </p>
                        <p className="text-[9px] text-slate-400 text-right">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-navy-900 border-b border-slate-100 pb-2">Compliance Gated Address Info</h3>
              
              {!token ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-4">
                  <ShieldAlert className="h-8 w-8 text-slate-400 mx-auto" />
                  <h4 className="font-bold text-navy-900 text-sm">Authentication Required</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    You must be logged in to view or request access to the seller's contact details.
                  </p>
                  <Link
                    to="/login"
                    state={{ from: `/listings/${id}` }}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 px-6 rounded-lg text-xs transition-colors inline-flex items-center space-x-1.5"
                  >
                    <span>Log In to Account</span>
                  </Link>
                </div>
              ) : token ? (
                <div className="space-y-4 text-xs">
                  <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl space-y-3">
                    <div className="flex items-center space-x-2 text-sky-800 font-bold">
                      <ShieldCheck className="h-4 w-4 text-sky-600" />
                      <span>Contact Details Unlocked</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Contact Person</p>
                        <p className="font-semibold text-navy-900">{listing.companyId?.contactPersonName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">GST Registration Number</p>
                        <p className="font-semibold text-navy-900">{listing.companyId?.gstNumber || 'VERIFIED'}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <a href={`tel:${listing.companyId?.contactPhone}`} className="text-navy-900 hover:text-sky-600 font-semibold">
                          {listing.companyId?.contactPhone}
                        </a>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <a
                          href={`tel:${listing.companyId?.contactPhone}`}
                          className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 rounded text-center text-[11px] transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>Call Seller Now</span>
                        </a>
                        <a
                          href={`https://wa.me/91${listing.companyId?.contactPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-brand-primary hover:bg-sky-600 text-white font-bold py-2 rounded text-center text-[11px] transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                        >
                          <span className="font-bold text-xs">💬</span>
                          <span>WhatsApp Seller</span>
                        </a>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Corporate Email</p>
                        <a href={`mailto:${listing.companyId?.contactEmail}`} className="font-bold text-sky-600 hover:underline">
                          {listing.companyId?.contactEmail}
                        </a>
                      </div>
                    </div>
                    <div className="space-y-1 border-t border-sky-100/50 pt-2.5">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Office Address</p>
                      <p className="text-slate-700">{listing.companyId?.address}, {listing.companyId?.city}, {listing.companyId?.state}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-4">
                  <ShieldAlert className="h-8 w-8 text-slate-400 mx-auto" />
                  <h4 className="font-bold text-navy-900 text-sm">Corporate Safety Protocol</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    To maintain strict privacy and safety guidelines, the directory gates direct emails, mobile numbers, and precise factory addresses. Click "Get Best Price" or submit an enquiry to request access.
                  </p>
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="bg-sky-500 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg text-xs transition-colors inline-flex items-center space-x-1.5"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send Deal Enquiry</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side Info: Summary parameters */}
        <div className="space-y-6 lg:col-span-1 animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-sm text-navy-900 border-b border-slate-100 pb-2">Trade Parameters</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Lot Quantity</p>
                <p className="text-base font-bold text-navy-900">{listing.fields?.quantityKg || 'N/A'} KG</p>
              </div>
              <div className="space-y-0.5 text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Target Price</p>
                <p className="text-base font-bold text-sky-600">
                  {listing.fields?.priceExpectationPerKg ? `₹${listing.fields.priceExpectationPerKg}/KG` : 'Negotiable'}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Communication Access</span>
              
              {contactAccess === 'ACCEPTED' || isOwner ? (
                <div className="flex items-center space-x-2 text-xs text-blue-700 bg-blue-50/50 border border-blue-100 p-3 rounded-lg">
                  <ShieldCheck className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span>Seller direct phone/email unlocked.</span>
                </div>
              ) : contactAccess === 'REQUESTED' ? (
                <div className="flex flex-col items-center text-center p-4 bg-amber-50/50 border border-amber-200 rounded-lg space-y-2">
                  <Clock className="h-6 w-6 text-brand-orange animate-pulse" />
                  <p className="font-bold text-xs text-amber-800">Enquiry Pending Approval</p>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    We notified the mill manager. You will receive an email notice when they confirm details sharing.
                  </p>
                </div>
              ) : contactAccess === 'DECLINED' ? (
                <div className="flex flex-col items-center text-center p-4 bg-red-50/50 border border-red-200 rounded-lg space-y-2">
                  <XCircle className="h-6 w-6 text-red-500" />
                  <p className="font-bold text-xs text-red-800">Enquiry Declined</p>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    This seller chose not to share contact details for this specific lot request.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start space-x-2 text-[10px] text-slate-500 bg-slate-50 p-3 rounded-lg">
                    <ShieldAlert className="h-4.5 w-4.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>Company addresses, emails and phone parameters are private until an inquiry is accepted.</span>
                  </div>
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="w-full bg-sky-500 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Send className="h-4 w-4" />
                    <span>Submit Enquiry / Price Ask</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry message submission modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-sm text-navy-900 flex items-center space-x-1.5">
                <FileText className="h-4.5 w-4.5 text-sky-600" />
                <span>Submit Trade Enquiry</span>
              </h3>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {requestSuccess ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="h-12 w-12 text-blue-500 mx-auto" />
                <h4 className="font-bold text-navy-900 text-sm">Request Submitted!</h4>
                <p className="text-xs text-slate-500">
                  Seller has been notified. We will update you once contact access is approved.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestContactSubmit} className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Provide a brief intro message to help the seller approve your request (e.g. quantity demands, transport schedules).
                </p>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Introduction Message</label>
                  <textarea
                    rows={3}
                    required
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="We are recyclers looking to lift this yarn/fabric lot next week. Please share contact..."
                    className="w-full px-3 py-2 border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg text-xs"
                  />
                </div>
                <div className="flex justify-end space-x-3 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="px-4 py-2 bg-sky-500 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 disabled:opacity-50"
                  >
                    {submittingRequest ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Submit Request</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetail;
