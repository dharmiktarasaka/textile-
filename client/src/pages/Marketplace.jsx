import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, Layers, Info, Filter, RefreshCw, X, ArrowRight, ShieldCheck, Star, Send, Loader2, CheckCircle2 } from 'lucide-react';
import apiClient, { BACKEND_BASE } from '../api/apiClient';
import useAuthStore from '../store/authStore';

const Marketplace = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  // Filters state from search params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [state, setState] = useState(searchParams.get('state') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Dynamic fields filters
  const [dynamicSchema, setDynamicSchema] = useState(null);
  const [dynamicFilters, setDynamicFilters] = useState({});

  // Enquiry modal states
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [enquiryListing, setEnquiryListing] = useState(null);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);

  const fetchFiltersInfo = async () => {
    try {
      const res = await apiClient.get('/categories');
      setCategories(res.data.categories);
      
      // Auto-set dynamic schema if initial category is set
      const initCatId = searchParams.get('categoryId');
      if (initCatId) {
        const chosen = res.data.categories.find((c) => c._id === initCatId);
        setDynamicSchema(chosen?.fieldSchema || null);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page,
        limit: 8,
        status: 'ACTIVE',
      });

      if (search) queryParams.append('search', search);
      if (selectedCategory) queryParams.append('categoryId', selectedCategory);
      if (city) queryParams.append('city', city);
      if (state) queryParams.append('state', state);

      // Append dynamic filters
      Object.entries(dynamicFilters).forEach(([key, val]) => {
        if (val) {
          queryParams.append(key, val);
        }
      });

      const res = await apiClient.get(`/listings?${queryParams.toString()}`);
      setListings(res.data.listings);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersInfo();
  }, []);

  // Listen to searchParams changes (e.g. navigation from landing page)
  useEffect(() => {
    const searchVal = searchParams.get('search') || '';
    const catVal = searchParams.get('categoryId') || '';
    const cityVal = searchParams.get('city') || '';
    const stateVal = searchParams.get('state') || '';
    const pageVal = Number(searchParams.get('page')) || 1;

    setSearch(searchVal);
    setSelectedCategory(catVal);
    setCity(cityVal);
    setState(stateVal);
    setPage(pageVal);

    if (catVal && categories.length > 0) {
      const chosen = categories.find((c) => c._id === catVal);
      setDynamicSchema(chosen?.fieldSchema || null);
    }
  }, [searchParams, categories]);

  useEffect(() => {
    fetchListings();
  }, [page, selectedCategory, city, state, dynamicFilters]);

  const updateUrlParams = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v) {
        updated.set(k, v);
      } else {
        updated.delete(k);
      }
    });
    setSearchParams(updated);
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setDynamicFilters({});
    setPage(1);
    
    if (catId) {
      const chosen = categories.find((c) => c._id === catId);
      setDynamicSchema(chosen?.fieldSchema || null);
    } else {
      setDynamicSchema(null);
    }

    updateUrlParams({ categoryId: catId, page: 1 });
  };

  const handleDynamicFilterChange = (key, value) => {
    setDynamicFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    updateUrlParams({ search, city, state, page: 1 });
    fetchListings();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setCity('');
    setState('');
    setDynamicFilters({});
    setDynamicSchema(null);
    setPage(1);
    setSearchParams(new URLSearchParams());
  };

  const openEnquiryModal = (listing) => {
    if (!token) {
      navigate('/login', { state: { from: '/marketplace' } });
      return;
    }
    setEnquiryListing(listing);
    setEnquiryMessage(`We are interested in your B2B listing "${listing.title}". Please share best pricing and contact details.`);
    setEnquirySuccess(false);
    setShowEnquiryModal(true);
  };

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    setSubmittingEnquiry(true);
    try {
      await apiClient.post('/contact-requests', {
        listingId: enquiryListing._id,
        message: enquiryMessage,
      });
      setEnquirySuccess(true);
      setTimeout(() => {
        setShowEnquiryModal(false);
      }, 1800);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit trade inquiry');
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const floor = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= floor) {
        stars.push(<Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />);
      } else {
        stars.push(<Star key={i} className="h-3.5 w-3.5 text-slate-300" />);
      }
    }
    return stars;
  };

  return (
    <div className="space-y-6">
      {/* Header title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Textile Directory</h1>
          <p className="text-xs text-slate-500 mt-1">Browse verified mills, wholesalers and waste recyclers in major production hubs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side: Filter Sidebar */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 self-start lg:col-span-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-bold text-sm text-navy-900 flex items-center space-x-1.5">
              <Filter className="h-4 w-4 text-sky-600" />
              <span>Refine Directory</span>
            </span>
            <button
              onClick={handleResetFilters}
              className="text-[10px] text-slate-500 hover:text-navy-900 font-bold hover:underline"
            >
              Reset All
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="space-y-4">
            {/* Search query */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Keywords</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Cotton, Recycler..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg text-xs"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {/* Select category */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Textile Segment</label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg text-xs bg-slate-50"
              >
                <option value="">All Segments</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City Hub filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">City Hub</label>
              <input
                type="text"
                placeholder="e.g. Surat"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setPage(1);
                  updateUrlParams({ city: e.target.value, page: 1 });
                }}
                className="w-full px-3 py-2 border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg text-xs"
              />
            </div>

            {/* State filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">State</label>
              <input
                type="text"
                placeholder="e.g. Gujarat"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setPage(1);
                  updateUrlParams({ state: e.target.value, page: 1 });
                }}
                className="w-full px-3 py-2 border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg text-xs"
              />
            </div>

            <button type="submit" className="w-full bg-brand-primary hover:bg-navy-800 text-white font-bold py-2 rounded-lg text-xs transition-colors">
              Filter Directory
            </button>
          </form>

          {/* Dynamic Filters rendering */}
          {dynamicSchema && (
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <span className="text-[10px] font-bold text-navy-800 uppercase tracking-widest block mb-2">Category Filters</span>
              {Object.entries(dynamicSchema).map(([fieldName, rules]) => {
                if (rules.type === 'enum') {
                  const label = fieldName.replace(/([A-Z])/g, ' $1');
                  return (
                    <div key={fieldName}>
                      <label className="block text-[10px] font-semibold text-slate-500 capitalize mb-1">
                        {label}
                      </label>
                      <select
                        value={dynamicFilters[fieldName] || ''}
                        onChange={(e) => handleDynamicFilterChange(fieldName, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg text-xs bg-slate-50"
                      >
                        <option value="">Any</option>
                        {rules.values.map((v) => (
                          <option key={v} value={v}>
                            {v.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>

        {/* Right Side: Directory list (1-column layout like Justdial) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">
              Showing {listings.length} of {pagination.total || 0} verified listings
            </span>
            <button
              onClick={fetchListings}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-500"
              title="Refresh listings"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[300px] bg-white rounded-xl border border-slate-200">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center space-y-4 shadow-sm">
              <Info className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="font-bold text-navy-900 text-lg">No Directory Matches</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                We couldn't find any listings matching your specifications. Try resetting filters to expand your search.
              </p>
              <button
                onClick={handleResetFilters}
                className="bg-brand-primary text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {listings.map((listing) => (
                <div key={listing._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row group">
                  {/* Photo Thumbnail */}
                  <div className="md:w-56 bg-slate-50 flex-shrink-0 relative border-r border-slate-100 h-48 md:h-auto overflow-hidden">
                    {listing.photoUrls && listing.photoUrls[0] ? (
                      <img
                        src={listing.photoUrls[0].startsWith('http') ? listing.photoUrls[0] : `${BACKEND_BASE}/uploads/${listing.photoUrls[0]}`}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold bg-slate-100 text-xs">
                        No Photo
                      </div>
                    )}
                    <span className="absolute top-3 left-3 text-[9px] font-bold text-white bg-navy-950/80 px-2 py-0.5 rounded border border-navy-900 backdrop-blur-sm uppercase">
                      {listing.categoryId?.name}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to={`/listings/${listing._id}`}>
                          <h3 className="font-bold text-base text-navy-900 hover:text-sky-600 transition-colors leading-tight">
                            {listing.title}
                          </h3>
                        </Link>
                        <span className="inline-flex items-center space-x-1 bg-blue-50 text-sky-600 border border-blue-100 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Verified Supplier</span>
                        </span>
                      </div>

                      {/* Stars Rating block */}
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="font-bold text-slate-700">{listing.ratingAvg?.toFixed(1) || '4.5'}</span>
                        <div className="flex items-center">
                          {renderStars(listing.ratingAvg || 4.5)}
                        </div>
                        <span className="text-slate-400">({listing.reviewCount || 12} reviews)</span>
                      </div>

                      <div className="text-xs text-slate-500 flex items-center space-x-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium text-slate-600">
                          {listing.fields?.location || listing.companyId?.city}, {listing.companyId?.state}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-400">
                        Listed by: <span className="font-semibold text-slate-500">{listing.companyId?.name}</span>
                      </p>
                    </div>

                    {/* Spec badges / fields preview */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {Object.entries(listing.fields || {}).map(([key, val]) => {
                        if (['location', 'priceExpectationPerKg', 'quantityKg'].includes(key)) return null;
                        const displayVal = Array.isArray(val) ? val.join(', ') : val.toString();
                        return (
                          <span key={key} className="bg-slate-50 border border-slate-100 px-2 py-1 rounded text-[10px] text-slate-600 font-medium">
                            <span className="capitalize text-slate-400 font-semibold">{key.replace(/([A-Z])/g, ' $1')}:</span> {displayVal.replace('_', ' ')}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions Column (Justdial Style) */}
                  <div className="p-6 md:w-56 border-t md:border-t-0 md:border-l border-slate-100 flex flex-col justify-between bg-slate-50/50">
                    <div className="space-y-3.5">
                      <div className="space-y-0.5">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Capacity / Qty</p>
                        <p className="font-extrabold text-navy-900 text-sm">{listing.fields?.quantityKg || 'N/A'} KG</p>
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Target Price</p>
                        <p className="font-extrabold text-sky-600 text-sm">
                          {listing.fields?.priceExpectationPerKg ? `₹${listing.fields.priceExpectationPerKg}/KG` : 'Negotiable'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <button
                        onClick={() => openEnquiryModal(listing)}
                        className="w-full bg-sky-500 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-center text-xs transition-colors flex items-center justify-center space-x-1 shadow-sm"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Get Best Deal</span>
                      </button>
                      <Link
                        to={`/listings/${listing._id}`}
                        className="w-full border border-slate-200 hover:bg-slate-50 text-navy-900 font-bold py-2 rounded-lg text-center text-xs transition-colors flex items-center justify-center space-x-1 bg-white"
                      >
                        <span>View Details</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination buttons */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-3 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => {
                  const newPage = page - 1;
                  setPage(newPage);
                  updateUrlParams({ page: newPage });
                }}
                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 font-semibold">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => {
                  const newPage = page + 1;
                  setPage(newPage);
                  updateUrlParams({ page: newPage });
                }}
                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enquiry Modal */}
      {showEnquiryModal && enquiryListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-sm text-navy-900 flex items-center space-x-1.5">
                <Send className="h-4.5 w-4.5 text-sky-600" />
                <span>Send Enquiry (Get Best Deal)</span>
              </h3>
              <button onClick={() => setShowEnquiryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {enquirySuccess ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="h-12 w-12 text-blue-500 mx-auto" />
                <h4 className="font-bold text-navy-900 text-sm">Enquiry Submitted!</h4>
                <p className="text-xs text-slate-500">
                  The supplier has been notified of your interest. Once they accept your enquiry, contact details will be shared.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1">
                  <p className="font-bold text-navy-900">{enquiryListing.title}</p>
                  <p className="text-slate-500">Company: <span className="font-semibold">{enquiryListing.companyId?.name}</span></p>
                  <p className="text-slate-500">Location: <span className="font-semibold">{enquiryListing.fields?.location || enquiryListing.companyId?.city}</span></p>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Requirement Details</label>
                  <textarea
                    rows={4}
                    required
                    value={enquiryMessage}
                    onChange={(e) => setEnquiryMessage(e.target.value)}
                    placeholder="Describe your purchase requirements or logistics details..."
                    className="w-full px-3 py-2 border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg text-xs"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowEnquiryModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEnquiry}
                    className="px-4 py-2 bg-sky-500 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 disabled:opacity-50"
                  >
                    {submittingEnquiry ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Deal Request</span>
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

export default Marketplace;
